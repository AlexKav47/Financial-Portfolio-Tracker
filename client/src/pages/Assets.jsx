import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Separator, Heading, HStack, Input, Spinner, Stack, Text, Table, List, Alert, NativeSelect } from "@chakra-ui/react";
import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import { searchAssets } from "../api/assetApi.js";
import { getLatestPriceByAssetId } from "../api/pricesApi.js";
import { listHoldings, createHolding, deleteHolding } from "../api/holdingsApi.js";
import { loadSettings } from "../state/settingStore.js";
import { formatMoney } from "../utils/money.js";

export default function Assets() {
  const settings = useMemo(() => loadSettings(), []);
  const currency = settings.baseCurrency; 

  // Form State
  const [type, setType] = useState("stock"); 
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);

  const [selected, setSelected] = useState(null);
  const [latestBusy, setLatestBusy] = useState(false);
  const [prefillPrice, setPrefillPrice] = useState(null);

  const [quantity, setQuantity] = useState("1");
  const [avgBuyPrice, setAvgBuyPrice] = useState("");

  // Data State
  const [holdings, setHoldings] = useState([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);

  async function loadHoldings() {
    setLoadingHoldings(true);
    const { res, data } = await listHoldings();
    setLoadingHoldings(false);

    if (!res.ok) {
      setError(data?.error || "Failed to load holdings.");
      return;
    }
    setHoldings(data?.holdings || []);
  }

  useEffect(() => {
    loadHoldings();
  }, []);

  function resetSelectionAndPrice() {
    setSelected(null);
    setPrefillPrice(null);
    setAvgBuyPrice("");
    setLatestBusy(false);
  }

  function onTypeChange(e) {
    const next = e.target.value;
    setType(next);
    setQ("");
    setSuggestions([]);
    resetSelectionAndPrice();
    setError("");
  }

  // Search Logic 
  useEffect(() => {
    setError("");
    resetSelectionAndPrice();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = q.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchBusy(true);
      const { res, data } = await searchAssets(type, trimmed);
      setSearchBusy(false);

      if (!res.ok) {
        setSuggestions([]);
        setError(data?.error || "Asset search failed.");
        return;
      }

      setSuggestions(Array.isArray(data?.results) ? data.results : []);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, type]);

  async function onSelectAsset(asset) {
    setSelected(asset);
    setSuggestions([]);
    setError("");
    setPrefillPrice(null);
    setAvgBuyPrice("");

    setLatestBusy(true);
    const { res, data } = await getLatestPriceByAssetId(asset._id);
    setLatestBusy(false);

    if (!res.ok) {
      setError(data?.error || "Failed to fetch latest price.");
      return;
    }

    const price = data?.latest?.price;
    setPrefillPrice(price ?? null);
    if (price != null && Number.isFinite(Number(price))) {
      setAvgBuyPrice(String(price));
    }
  }

  const canAdd = useMemo(() => {
    const qty = Number(quantity);
    const p = Number(avgBuyPrice);
    return (
      !!selected &&
      Number.isFinite(qty) &&
      qty > 0 &&
      Number.isFinite(p) &&
      p > 0
    );
  }, [selected, quantity, avgBuyPrice]);

  async function onAdd(e) {
    e.preventDefault();
    setError("");
    if (!canAdd) return;

    setBusy(true);
    const { res, data } = await createHolding({
      assetRefId: selected._id,
      type: selected.type,
      symbol: selected.symbol,
      name: selected.name,
      quantity: Number(quantity),
      avgBuyPrice: Number(avgBuyPrice),
    });
    setBusy(false);

    if (!res.ok) {
      setError(data?.error || "Failed to add asset.");
      return;
    }

    // Reset after add
    setQ("");
    setSuggestions([]);
    resetSelectionAndPrice();
    setQuantity("1");

    await loadHoldings();
  }

  async function onDelete(id) {
    setError("");
    setBusy(true);
    const { res, data } = await deleteHolding(id);
    setBusy(false);

    if (!res.ok) {
      setError(data?.error || "Failed to delete holding.");
      return;
    }

    setHoldings((prev) => prev.filter((h) => h._id !== id));
  }

  return (
    <AppShell>
      <Box mb={6}>
        <Heading size="md" mb={2}>
          Assets
        </Heading>
        <Text color="fg.muted">
          Manage your portfolio holdings. Search for an asset, prefill price, and add it to your list.
        </Text>
      </Box>

      {error ? (
        <Alert.Root status="error" mb={6} variant="subtle">
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      ) : null}

      <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={4}>
        {/* FORM CARD */}
        <Card p={6}>
          <Heading size="sm" mb={4}>
            Add Asset
          </Heading>

          <Stack gap={4}>
            <Box>
              <Text textStyle="sm" fontWeight="medium" mb={1}>
                Type
              </Text>
              <NativeSelect.Root>
                <NativeSelect.Field value={type} onChange={onTypeChange}>
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>

            <Box>
              <Text textStyle="sm" fontWeight="medium" mb={1}>
                Search
              </Text>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={type === "stock" ? "Search AAPL, MSFT..." : "Search BTC, ETH..."}
              />

              {searchBusy ? (
                <HStack color="fg.muted" mt={2} fontSize="sm">
                  <Spinner size="xs" />
                  <Text>Searching...</Text>
                </HStack>
              ) : null}

              {suggestions.length > 0 ? (
                <List.Root
                  mt={2}
                  variant="plain"
                  borderWidth="1px"
                  borderRadius="md"
                  overflow="hidden"
                >
                  {suggestions.map((s) => (
                    <List.Item
                      key={s._id}
                      px={3}
                      py={2}
                      cursor="pointer"
                      _hover={{ bg: "bg.muted" }}
                      onClick={() => onSelectAsset(s)}
                    >
                      <HStack justify="space-between" align="start">
                        <Box>
                          <Text fontWeight="semibold">{s.symbol}</Text>
                          <Text fontSize="xs" color="fg.muted">
                            {s.name}
                          </Text>
                        </Box>
                        <Text fontSize="xs" color="fg.subtle">
                          {s.type}
                        </Text>
                      </HStack>
                    </List.Item>
                  ))}
                </List.Root>
              ) : null}
            </Box>

            <Separator />

            <Box bg="bg.muted" p={3} borderRadius="md">
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="bold">
                Selected
              </Text>
              <Text fontWeight="bold">
                {selected ? `${selected.symbol} — ${selected.name}` : "None"}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Market Price:{" "}
                {latestBusy
                  ? "Loading..."
                  : prefillPrice != null
                  ? formatMoney(prefillPrice, currency)
                  : "None"}
              </Text>
            </Box>

            <form onSubmit={onAdd}>
              <Stack gap={4}>
                <HStack gap={4} align="start">
                  <Box flex={1}>
                    <Text textStyle="sm" mb={1}>
                      Quantity
                    </Text>
                    <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </Box>

                  <Box flex={1}>
                    <Text textStyle="sm" mb={1}>
                      Avg Buy Price
                    </Text>
                    <Input
                      value={avgBuyPrice}
                      onChange={(e) => setAvgBuyPrice(e.target.value)}
                      placeholder="Prefilled from market; editable"
                    />
                  </Box>
                </HStack>

                <Button width="full" type="submit" disabled={!canAdd} loading={busy}>
                  Add to Holdings
                </Button>
              </Stack>
            </form>
          </Stack>
        </Card>

        {/* LIST CARD */}
        <Card p={6}>
          <Heading size="sm" mb={4}>
            Current Holdings
          </Heading>

          {loadingHoldings ? (
            <Spinner />
          ) : (
            <Table.ScrollArea borderWidth="1px" borderRadius="md">
              <Table.Root size="sm" variant="line">
                <Table.Header>
                  <Table.Row bg="bg.muted">
                    <Table.ColumnHeader>Symbol</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Qty</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Avg Price</Table.ColumnHeader>
                    <Table.ColumnHeader />
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {holdings.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4} textAlign="center" py={10} color="fg.muted">
                        No holdings found.
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    holdings.map((h) => (
                      <Table.Row key={h._id} bg="none">
                        <Table.Cell fontWeight="bold">{h.symbol}</Table.Cell>
                        <Table.Cell textAlign="end">{h.quantity}</Table.Cell>
                        <Table.Cell textAlign="end">
                          {formatMoney(h.avgBuyPrice, settings.baseCurrency)}
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => onDelete(h._id)}
                            loading={busy}
                          >
                            Delete
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
          )}
        </Card>
      </Box>
    </AppShell>
  );
}
