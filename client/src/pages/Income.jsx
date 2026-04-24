import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Heading, HStack, Input, Separator, Stack, Table, Tabs, Text, Spinner, Alert, List } from "@chakra-ui/react";
import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import KpiCard from "../components/dashboard/KpiCard.jsx";
import { formatMoney } from "../utils/money.js";
import { loadSettings } from "../state/settingStore.js";
import { listIncome, createIncome, deleteIncome } from "../api/incomeApi.js";
import { searchAssets } from "../api/assetApi.js";
import { getDashboardSummary } from "../api/dashboardApi.js";

// Hardcoded these to give the user a head start on common crypto platforms
const POPULAR_NETWORKS = [
  "Binance",
  "Coinbase",
  "Lido",
  "Kraken",
  "Metamask",
  "Rocket Pool",
  "Nexo",
  "Crypto.com",
  "Ledger Live",
  "Phantom",
  "Solana",
  "Ethereum Mainnet",
];

export default function Income() {
  // Grab the users currency preference
  const [settings] = useState(() => loadSettings());
  const currency = settings.baseCurrency || "EUR";

  // State for switching between Stock Dividends and Crypto Staking
  const [tab, setTab] = useState("dividends");
  const apiType = tab === "dividends" ? "dividend" : "staking";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allEntries, setAllEntries] = useState([]);
  const [portfolioTotal, setPortfolioTotal] = useState(0);

  // Asset search state
  const assetType = apiType === "dividend" ? "stock" : "crypto";
  const [assetQuery, setAssetQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const debounceRef = useRef(null);

  // Form state for adding new entries
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");

  // Staking specific state
  const [network, setNetwork] = useState("");
  const [networkSuggestions, setNetworkSuggestions] = useState([]);
  const [showNetworkList, setShowNetworkList] = useState(false);

  // Table filtering state
  const [q, setQ] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  // Grab both the income history and the dashboard summary for KPIs
  async function load() {
    setError("");
    setLoading(true);

    const [incomeRes, dashRes] = await Promise.all([
      listIncome({ type: "all", q: "" }),
      getDashboardSummary(),
    ]);

    setLoading(false);

    if (!incomeRes.res.ok) {
      setError(incomeRes.data?.error || "Failed to load income.");
      return;
    }

    setAllEntries(incomeRes.data?.entries || []);

    if (dashRes.res.ok) {
      const d = dashRes.data;
      // Total portfolio value to calculate the % yield 
      const total = d?.kpis?.value || d?.groups?.total?.value || 0;
      setPortfolioTotal(total);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Reset the form whenever the user switches between Dividends and Staking
  useEffect(() => {
    setAssetQuery("");
    setSuggestions([]);
    setSelectedAsset(null);
    setAmount("");
    setNetwork("");
    setShowNetworkList(false);
    setNetworkSuggestions([]);
  }, [apiType]);

  // Handle the Search as you type logic with a 250ms debounce to save API hits
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = assetQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchBusy(true);
      const { res, data } = await searchAssets(assetType, trimmed);
      setSearchBusy(false);
      if (res.ok) setSuggestions(data?.results || []);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [assetQuery, assetType]);

  // Filtering the POPULAR_NETWORKS list based on what the user types
  useEffect(() => {
    if (!showNetworkList) {
      setNetworkSuggestions([]);
      return;
    }

    const trimmed = network.trim().toLowerCase();

    const matches = trimmed
      ? POPULAR_NETWORKS.filter((p) => {
          const pl = p.toLowerCase();
          return pl.includes(trimmed) && pl !== trimmed;
        })
      : POPULAR_NETWORKS;

    setNetworkSuggestions(matches);
  }, [network, showNetworkList]);

  // Handles the filtering and sorting of the main entries table
  const filteredRows = useMemo(() => {
    const s = String(q || "").toLowerCase().trim();
    return (allEntries || [])
      .filter((r) => r.type === apiType)
      .filter((r) => {
        if (monthFilter === "all") return true;
        return new Date(r.date).toISOString().slice(0, 7) === monthFilter;
      })
      .filter((r) => {
        if (!s) return true;
        return (
          String(r.symbol || "").toLowerCase().includes(s) ||
          String(r.network || "").toLowerCase().includes(s)
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // Keep newest on top
  }, [allEntries, apiType, q, monthFilter]);

  /**
   * Calculate Monthly, YTD, and an estimated Next Expected based 
   * on the average of the last 3 months
   */
  const kpis = useMemo(() => {
    const all = allEntries || [];
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth();

    const sum = (arr) => arr.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    // Filter for the current calendar month
    const thisMonthPrefix = `${yyyy}-${String(mm + 1).padStart(2, "0")}`;
    const monthly = sum(
      all.filter((r) => new Date(r.date).toISOString().startsWith(thisMonthPrefix))
    );
    
    // Total for the whole current year
    const ytd = sum(all.filter((r) => new Date(r.date).getFullYear() === yyyy));

    // Look back 3 months to generate a run rate estimate
    const last3Months = [1, 2, 3].map((i) => {
      const d = new Date(yyyy, mm - i, 1);
      const prefix = d.toISOString().slice(0, 7);
      return sum(all.filter((r) => String(r.date).startsWith(prefix)));
    });

    const avgMonthly = (last3Months.reduce((a, b) => a + b, 0) / 3) || 0;
    const nextExpected = Number(avgMonthly.toFixed(2));

    // Projected Annual Yield (Year-to-Date / Months-Elapsed) * 12
    const monthsPassed = mm + 1;
    const projectedAnnual = (ytd / monthsPassed) * 12;
    const yieldValue =
      portfolioTotal > 0 && projectedAnnual > 0
        ? ((projectedAnnual / portfolioTotal) * 100).toFixed(2)
        : null;

    return { monthly, ytd, nextExpected, yieldPct: yieldValue };
  }, [allEntries, portfolioTotal]);

  // When a user clicks a search result lock it in
  function onSelectAsset(a) {
    setSelectedAsset(a);
    setSuggestions([]);
    setAssetQuery(`${a.symbol} — ${a.name}`);
  }

  // Basic form validation that wont let them submit junk data
  const canAdd = useMemo(() => {
    const a = Number(amount);
    if (!selectedAsset || !date || Number.isNaN(a) || a <= 0) return false;
    // Staking requires a network/platform, dividends dont
    if (apiType === "staking" && !network.trim()) return false;
    return true;
  }, [selectedAsset, date, amount, apiType, network]);

  // Submit the new entry to the backend
  async function onAdd(e) {
    e.preventDefault();
    setError("");
    if (!canAdd) return;

    const payload = {
      type: apiType,
      assetRefId: selectedAsset?._id || null,
      symbol: (selectedAsset?.symbol || "").trim().toUpperCase(),
      date,
      amount: Number(amount),
      currency: currency,
      ...(apiType === "staking" ? { network: network.trim() } : {}),
    };

    const { res, data } = await createIncome(payload);
    if (!res.ok) {
      setError(data?.error || "Failed to add entry.");
      return;
    }

    // Optimistically update the list so the UI feels snappy
    setAllEntries((prev) => [data.entry, ...prev]);
    
    // Clear the form fields for the next entry
    setAssetQuery("");
    setSelectedAsset(null);
    setAmount("");
    setNetwork("");
    setShowNetworkList(false);
  }

  async function onDelete(id) {
    const { res, data } = await deleteIncome(id);
    if (!res.ok) {
      setError(data?.error || "Failed to delete entry.");
      return;
    }
    // Remove the item from the state immediately
    setAllEntries((prev) => prev.filter((x) => x._id !== id));
  }

  return (
    <AppShell>
      <Stack gap={4}>
        <Box>
          <Heading size="md" mb={2}>
            Income
          </Heading>
          <Text color="fg.muted">Track dividends and crypto staking rewards.</Text>
        </Box>

        {/* Global Error Alert */}
        {error && (
          <Alert.Root status="error" variant="subtle">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        )}

        {/* Top Row KPI Statistics */}
        <HStack gap={4} align="stretch" wrap="wrap">
          <Box flex="1" minW="220px">
            <KpiCard
              title="Total Monthly Income"
              value={formatMoney(kpis.monthly, currency)}
              isLoading={loading}
            />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard
              title="Total YTD Income"
              value={formatMoney(kpis.ytd, currency)}
              isLoading={loading}
            />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard
              title="Next Expected (Est.)"
              value={formatMoney(kpis.nextExpected, currency)}
              isLoading={loading}
            />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard
              title="Annual Yield"
              value={kpis.yieldPct == null ? "—" : `${kpis.yieldPct}%`}
              isLoading={loading}
            />
          </Box>
        </HStack>

        {/* Switcher between Dividends and Staking */}
        <Card p={3}>
          <Tabs.Root
            value={tab}
            onValueChange={(d) => setTab(d.value)}
            variant="line"
          >
            <Tabs.List>
              <Tabs.Trigger value="dividends">Dividends</Tabs.Trigger>
              <Tabs.Trigger value="staking">Staking</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </Card>

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "1.2fr 1fr" }}
          gap={4}
        >
          {/* Left Column Input Form */}
          <Card p={6}>
            <Heading size="sm" mb={4}>
              Add {apiType === "dividend" ? "Dividend" : "Staking Reward"}
            </Heading>

            <form onSubmit={onAdd}>
              <Stack gap={4}>
                <Box>
                  <Text textStyle="sm" fontWeight="medium" mb={1}>
                    Asset
                  </Text>
                  <HStack gap={2} mb={2}>
                    <Box
                      px={3}
                      py={2}
                      borderWidth="1px"
                      borderRadius="md"
                      minW="110px"
                      bg="bg.muted"
                    >
                      <Text fontSize="sm" fontWeight="semibold">
                        {assetType === "stock" ? "Stock" : "Crypto"}
                      </Text>
                    </Box>
                    <Input
                      value={assetQuery}
                      onChange={(e) => setAssetQuery(e.target.value)}
                      placeholder={
                        assetType === "stock"
                          ? "Search AAPL, VUSA..."
                          : "Search BTC, ETH..."
                      }
                    />
                  </HStack>

                  {/* Loading spinner for the async search */}
                  {searchBusy && (
                    <HStack color="fg.muted" fontSize="sm">
                      <Spinner size="xs" />
                      <Text>Searching...</Text>
                    </HStack>
                  )}

                  {/* Search Results Dropdown */}
                  {suggestions.length > 0 && (
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
                          <HStack justify="space-between">
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
                  )}
                </Box>

                {/* Network input only shows up for Crypto staking */}
                {apiType === "staking" && (
                  <Box position="relative">
                    <Text textStyle="sm" fontWeight="medium" mb={1}>
                      Network / Platform
                    </Text>

                    <Input
                      value={network}
                      onChange={(e) => {
                        setNetwork(e.target.value);
                        setShowNetworkList(true);
                      }}
                      onFocus={() => setShowNetworkList(true)}
                      onBlur={() => setTimeout(() => setShowNetworkList(false), 150)}
                      placeholder="e.g. Coinbase, Lido, Binance"
                    />

                    {/* Simple autocomplete for networks */}
                    {showNetworkList && networkSuggestions.length > 0 && (
                      <List.Root
                        mt={2}
                        variant="plain"
                        borderWidth="1px"
                        borderRadius="md"
                        overflow="hidden"
                      >
                        {networkSuggestions.slice(0, 8).map((n) => (
                          <List.Item
                            key={n}
                            px={3}
                            py={2}
                            cursor="pointer"
                            _hover={{ bg: "bg.muted" }}
                            onMouseDown={(e) => {
                              // onMouseDown because onBlur would fire first and hide the list
                              e.preventDefault();
                              setNetwork(n);
                              setShowNetworkList(false);
                            }}
                          >
                            <Text fontWeight="semibold">{n}</Text>
                          </List.Item>
                        ))}
                      </List.Root>
                    )}
                  </Box>
                )}

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text textStyle="sm" fontWeight="medium" mb={1}>
                      Date
                    </Text>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Box>
                  <Box flex={1}>
                    <Text textStyle="sm" fontWeight="medium" mb={1}>
                      Amount ({currency})
                    </Text>
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 12.34"
                    />
                  </Box>
                </HStack>

                <Button type="submit" disabled={!canAdd}>
                  Add Entry
                </Button>
              </Stack>
            </form>
          </Card>

          {/* Right Column Historical Entries Table */}
          <Card p={6}>
            <HStack justify="space-between" mb={4}>
              <Heading size="sm">Entries ({apiType})</Heading>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                w="150px"
                size="sm"
              />
            </HStack>
            <Separator mb={4} />

            <Table.Root size="sm" variant="line">
              <Table.Header>
                <Table.Row bg="bg.muted">
                  <Table.ColumnHeader>Symbol</Table.ColumnHeader>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
                  <Table.ColumnHeader />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredRows.map((r) => (
                  <Table.Row key={r._id}>
                    <Table.Cell fontWeight="semibold">{r.symbol}</Table.Cell>
                    <Table.Cell>
                      {new Date(r.date).toISOString().slice(0, 10)}
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      {formatMoney(r.amount, currency, 2)}
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onDelete(r._id)}
                      >
                        Delete
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        </Box>
      </Stack>
    </AppShell>
  );
}