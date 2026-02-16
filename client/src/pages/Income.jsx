import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Separator,
  Stack,
  Table,
  Tabs,
  Text,
  Spinner,
  Alert,
  List,
} from "@chakra-ui/react";

import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import KpiCard from "../components/dashboard/KpiCard.jsx";
import { formatMoney } from "../utils/money.js";

import { loadSettings } from "../state/settingStore.js";
import { listIncome, createIncome, deleteIncome } from "../api/incomeApi.js";
import { searchAssets } from "../api/assetApi.js";
import { getDashboardSummary } from "../api/dashboardApi.js";

const POPULAR_NETWORKS = [
  "Binance", "Coinbase", "Lido", "Kraken", "Metamask", 
  "Rocket Pool", "Nexo", "Crypto.com", "Ledger Live", "Phantom", "Solana", "Ethereum Mainnet"
];

export default function Income() {
  const [settings] = useState(() => loadSettings());
  const currency = settings.baseCurrency || "EUR";

  const [tab, setTab] = useState("dividends");
  const apiType = tab === "dividends" ? "dividend" : "staking";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [allEntries, setAllEntries] = useState([]);
  const [portfolioTotal, setPortfolioTotal] = useState(0);

  const assetType = apiType === "dividend" ? "stock" : "crypto";
  const [assetQuery, setAssetQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const debounceRef = useRef(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [network, setNetwork] = useState("");
  const [networkSuggestions, setNetworkSuggestions] = useState([]);
  const [showNetworkList, setShowNetworkList] = useState(false);

  const [q, setQ] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  async function load() {
    setError("");
    setLoading(true);
    
    const [incomeRes, dashRes] = await Promise.all([
      listIncome({ type: "all", q: "" }),
      getDashboardSummary()
    ]);

    setLoading(false);

    if (!incomeRes.res.ok) {
      setError(incomeRes.data?.error || "Failed to load income.");
      return;
    }

    setAllEntries(incomeRes.data?.entries || []);
    
    if (dashRes.res.ok) {
      const d = dashRes.data;
      // Fixed: Accessing the total value based on your specific API structure
      const total = d?.kpis?.value || d?.groups?.total?.value || 0;
      console.log("Found Portfolio Total:", total); 
      setPortfolioTotal(total);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setAssetQuery("");
    setSuggestions([]);
    setSelectedAsset(null);
    setAmount("");
    setNotes("");
    setNetwork("");
  }, [apiType]);

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

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [assetQuery, assetType]);

  useEffect(() => {
    const trimmed = network.trim().toLowerCase();
    if (!trimmed || !showNetworkList) {
      setNetworkSuggestions([]);
      return;
    }
    const matches = POPULAR_NETWORKS.filter(p => 
      p.toLowerCase().includes(trimmed) && p.toLowerCase() !== trimmed
    );
    setNetworkSuggestions(matches);
  }, [network, showNetworkList]);

  const filteredRows = useMemo(() => {
    const s = String(q || "").toLowerCase().trim();
    return allEntries
      .filter((r) => r.type === apiType)
      .filter((r) => {
        if (monthFilter === "all") return true;
        return new Date(r.date).toISOString().slice(0, 7) === monthFilter;
      })
      .filter((r) => {
        if (!s) return true;
        return (
          String(r.symbol || "").toLowerCase().includes(s) ||
          String(r.notes || "").toLowerCase().includes(s) ||
          String(r.network || "").toLowerCase().includes(s)
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [allEntries, apiType, q, monthFilter]);

  const kpis = useMemo(() => {
    const all = allEntries || [];
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth(); 
    
    const sum = (arr) => arr.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    const thisMonthPrefix = `${yyyy}-${String(mm + 1).padStart(2, "0")}`;
    const monthly = sum(all.filter((r) => new Date(r.date).toISOString().startsWith(thisMonthPrefix)));
    const ytd = sum(all.filter((r) => new Date(r.date).getFullYear() === yyyy));

    const last3Months = [1, 2, 3].map(i => {
      const d = new Date(yyyy, mm - i, 1);
      const prefix = d.toISOString().slice(0, 7);
      return sum(all.filter(r => r.date.startsWith(prefix)));
    });
    const avgMonthly = (last3Months.reduce((a, b) => a + b, 0) / 3) || 0;
    // Fixed: Ensure this is a clean number for the KpiCard
    const nextExpected = Number(avgMonthly.toFixed(2));

    const monthsPassed = mm + 1;
    const projectedAnnual = (ytd / monthsPassed) * 12;
    const yieldValue = (portfolioTotal > 0 && projectedAnnual > 0) 
      ? ((projectedAnnual / portfolioTotal) * 100).toFixed(2) 
      : null;

    return { monthly, ytd, nextExpected, yieldPct: yieldValue };
  }, [allEntries, portfolioTotal]);

  function onSelectAsset(a) {
    setSelectedAsset(a);
    setSuggestions([]);
    setAssetQuery(`${a.symbol} — ${a.name}`);
  }

  const canAdd = useMemo(() => {
    const a = Number(amount);
    if (!selectedAsset || !date || isNaN(a) || a <= 0) return false;
    if (apiType === "staking" && !network.trim()) return false;
    return true;
  }, [selectedAsset, date, amount, apiType, network]);

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
      notes: notes.trim(),
      ...(apiType === "staking" ? { network: network.trim() } : {}),
    };

    const { res, data } = await createIncome(payload);
    if (!res.ok) {
      setError(data?.error || "Failed to add entry.");
      return;
    }

    setAllEntries((prev) => [data.entry, ...prev]);
    setAssetQuery("");
    setSelectedAsset(null);
    setAmount("");
    setNotes("");
    setNetwork("");
  }

  async function onDelete(id) {
    const { res, data } = await deleteIncome(id);
    if (!res.ok) {
      setError(data?.error || "Failed to delete entry.");
      return;
    }
    setAllEntries((prev) => prev.filter((x) => x._id !== id));
  }

  return (
    <AppShell>
      <Stack gap={4}>
        <Box>
          <Heading size="md" mb={2}>Income</Heading>
          <Text color="fg.muted">Track dividends and crypto staking rewards.</Text>
        </Box>

        {error && (
          <Alert.Root status="error" variant="subtle">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        )}

        <HStack gap={4} align="stretch" wrap="wrap">
          <Box flex="1" minW="220px">
            <KpiCard title="Total Monthly Income" value={formatMoney(kpis.monthly, currency)} isLoading={loading} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title="Total YTD Income" value={formatMoney(kpis.ytd, currency)} isLoading={loading} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title="Next Expected (Est.)" value={formatMoney(kpis.nextExpected, currency)} isLoading={loading} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title="Annual Yield" value={kpis.yieldPct == null ? "—" : `${kpis.yieldPct}%`} isLoading={loading} />
          </Box>
        </HStack>

        <Card p={3}>
          <Tabs.Root value={tab} onValueChange={(d) => setTab(d.value)} variant="line">
            <Tabs.List>
              <Tabs.Trigger value="dividends">Dividends</Tabs.Trigger>
              <Tabs.Trigger value="staking">Staking</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </Card>

        <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={4}>
          <Card p={6}>
            <Heading size="sm" mb={4}>Add {apiType === "dividend" ? "Dividend" : "Staking Reward"}</Heading>
            <form onSubmit={onAdd}>
              <Stack gap={4}>
                <Box>
                  <Text textStyle="sm" fontWeight="medium" mb={1}>Asset</Text>
                  <HStack gap={2} mb={2}>
                    <Box px={3} py={2} borderWidth="1px" borderRadius="md" minW="110px" bg="bg.muted">
                      <Text fontSize="sm" fontWeight="semibold">{assetType === "stock" ? "Stock" : "Crypto"}</Text>
                    </Box>
                    <Input
                      value={assetQuery}
                      onChange={(e) => setAssetQuery(e.target.value)}
                      placeholder={assetType === "stock" ? "Search AAPL, VUSA..." : "Search BTC, ETH..."}
                    />
                  </HStack>
                  {searchBusy && <HStack color="fg.muted" fontSize="sm"><Spinner size="xs" /><Text>Searching...</Text></HStack>}
                  {suggestions.length > 0 && (
                    <List.Root mt={2} variant="plain" borderWidth="1px" borderRadius="md" overflow="hidden">
                      {suggestions.map((s) => (
                        <List.Item key={s._id} px={3} py={2} cursor="pointer" _hover={{ bg: "bg.muted" }} onClick={() => onSelectAsset(s)}>
                          <HStack justify="space-between">
                            <Box><Text fontWeight="semibold">{s.symbol}</Text><Text fontSize="xs" color="fg.muted">{s.name}</Text></Box>
                            <Text fontSize="xs" color="fg.subtle">{s.type}</Text>
                          </HStack>
                        </List.Item>
                      ))}
                    </List.Root>
                  )}
                </Box>

                {apiType === "staking" && (
                  <Box position="relative">
                    <Text textStyle="sm" fontWeight="medium" mb={1}>Network / Platform</Text>
                    <Input
                      value={network}
                      onChange={(e) => { setNetwork(e.target.value); setShowNetworkList(true); }}
                      onFocus={() => setShowNetworkList(true)}
                      onBlur={() => setTimeout(() => setShowNetworkList(false), 200)}
                      placeholder="e.g. Coinbase, Lido, Binance"
                    />
                  </Box>
                )}

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text textStyle="sm" fontWeight="medium" mb={1}>Date</Text>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </Box>
                  <Box flex={1}>
                    <Text textStyle="sm" fontWeight="medium" mb={1}>Amount ({currency})</Text>
                    <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 12.34" />
                  </Box>
                </HStack>

                <Box>
                  <Text textStyle="sm" fontWeight="medium" mb={1}>Notes (optional)</Text>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Q4 dividend" />
                </Box>

                <Button type="submit" disabled={!canAdd}>Add Entry</Button>
              </Stack>
            </form>
          </Card>

          <Card p={6}>
            <HStack justify="space-between" mb={4}>
              <Heading size="sm">Entries ({apiType})</Heading>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." w="150px" size="sm" />
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
                    <Table.Cell>{new Date(r.date).toISOString().slice(0, 10)}</Table.Cell>
                    <Table.Cell textAlign="end">{formatMoney(r.amount, currency, 2)}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <Button size="xs" variant="ghost" onClick={() => onDelete(r._id)}>Delete</Button>
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