import { useEffect, useMemo, useState } from "react";
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
} from "@chakra-ui/react";

import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import KpiCard from "../components/dashboard/KpiCard.jsx";
import { formatMoney } from "../utils/money.js";
import { loadSettings } from "../state/settingStore.js";

/**
 * UI-only mock store (replace with API calls next)
 */
function mockFetchIncome() {
  return Promise.resolve({
    dividends: [],
    staking: [],
  });
}

export default function Income() {
  const settings = useMemo(() => loadSettings(), []);

  const currency = settings.baseCurrency || "EUR";

  const [tab, setTab] = useState("dividends"); // "dividends" | "staking"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data
  const [dividends, setDividends] = useState([]);
  const [staking, setStaking] = useState([]);

  // Form state
  const [assetSymbol, setAssetSymbol] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // yyyy-mm-dd
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  // Staking-only
  const [network, setNetwork] = useState("");

  // Table controls
  const [q, setQ] = useState("");
  const [monthFilter, setMonthFilter] = useState("all"); // all | yyyy-mm

  useEffect(() => {
    let mounted = true;
    async function load() {
      setError("");
      setLoading(true);
      try {
        const data = await mockFetchIncome();
        if (!mounted) return;
        setDividends(data.dividends || []);
        setStaking(data.staking || []);
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load income.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const activeRows = tab === "dividends" ? dividends : staking;

  const filteredRows = useMemo(() => {
    const s = String(q || "").toLowerCase().trim();
    return activeRows
      .filter((r) => {
        if (monthFilter === "all") return true;
        return String(r.date || "").startsWith(monthFilter);
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
  }, [activeRows, q, monthFilter]);

  // KPIs (computed from both types)
  const kpis = useMemo(() => {
    const all = [...dividends, ...staking];
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const thisMonthPrefix = `${yyyy}-${mm}`;

    const sum = (rows) => rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    const monthly = sum(all.filter((r) => String(r.date || "").startsWith(thisMonthPrefix)));
    const ytd = sum(all.filter((r) => String(r.date || "").startsWith(String(yyyy))));

    // Next expected: placeholder logic (later: schedule)
    const nextExpected = 0;

    return {
      monthly,
      ytd,
      nextExpected,
      yieldPct: null,
    };
  }, [dividends, staking]);

  const canAdd = useMemo(() => {
    const a = Number(amount);
    if (!assetSymbol.trim()) return false;
    if (!date) return false;
    if (!Number.isFinite(a) || a <= 0) return false;
    if (tab === "staking" && !network.trim()) return false;
    return true;
  }, [assetSymbol, date, amount, tab, network]);

  function resetForm() {
    setAssetSymbol("");
    setAmount("");
    setNotes("");
    setNetwork("");
  }

  function onAdd(e) {
    e.preventDefault();
    setError("");
    if (!canAdd) return;

    const entry = {
      id: crypto.randomUUID(),
      type: tab,
      symbol: assetSymbol.trim().toUpperCase(),
      date,
      amount: Number(amount),
      notes: notes.trim(),
      ...(tab === "staking" ? { network: network.trim() } : {}),
    };

    if (tab === "dividends") setDividends((prev) => [entry, ...prev]);
    else setStaking((prev) => [entry, ...prev]);

    resetForm();
  }

  function onDelete(id) {
    if (tab === "dividends") setDividends((prev) => prev.filter((x) => x.id !== id));
    else setStaking((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <AppShell>
      <Stack gap={4}>
        <Box>
          <Heading size="md" mb={2}>Income</Heading>
          <Text color="fg.muted">
            Track dividends and crypto staking rewards. This page will feed into Passive Income KPI later.
          </Text>
        </Box>

        {error ? (
          <Alert.Root status="error" variant="subtle">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        ) : null}

        {/* KPI row */}
        <HStack gap={4} align="stretch" wrap="wrap">
          <Box flex="1" minW="220px">
            <KpiCard title="Monthly Income" value={formatMoney(kpis.monthly, currency)} isLoading={loading} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title="YTD Income" value={formatMoney(kpis.ytd, currency)} isLoading={loading} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title="Next Expected" value={formatMoney(kpis.nextExpected, currency)} isLoading={loading} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title="Yield" value={kpis.yieldPct == null ? "—" : `${kpis.yieldPct}%`} isLoading={false} />
          </Box>
        </HStack>

        {/* Tabs */}
        <Card p={3}>
          <Tabs.Root value={tab} onValueChange={(d) => setTab(d.value)} variant="line">
            <Tabs.List>
              <Tabs.Trigger value="dividends">Dividends</Tabs.Trigger>
              <Tabs.Trigger value="staking">Staking</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </Card>

        <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={4}>
          {/* Add entry */}
          <Card p={6}>
            <Heading size="sm" mb={4}>Add {tab === "dividends" ? "Dividend" : "Staking Reward"}</Heading>

            <form onSubmit={onAdd}>
              <Stack gap={4}>
                <Box>
                  <Text textStyle="sm" fontWeight="medium" mb={1}>Asset Symbol</Text>
                  <Input
                    value={assetSymbol}
                    onChange={(e) => setAssetSymbol(e.target.value)}
                    placeholder={tab === "dividends" ? "e.g. VUSA, AAPL" : "e.g. ETH, SOL"}
                  />
                </Box>

                {tab === "staking" ? (
                  <Box>
                    <Text textStyle="sm" fontWeight="medium" mb={1}>Network / Platform</Text>
                    <Input
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      placeholder="e.g. Coinbase, Lido, Binance, Solana"
                    />
                  </Box>
                ) : null}

                <HStack gap={4} align="start">
                  <Box flex={1}>
                    <Text textStyle="sm" fontWeight="medium" mb={1}>Date</Text>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </Box>

                  <Box flex={1}>
                    <Text textStyle="sm" fontWeight="medium" mb={1}>Amount ({currency})</Text>
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 12.34"
                    />
                  </Box>
                </HStack>

                <Box>
                  <Text textStyle="sm" fontWeight="medium" mb={1}>Notes (optional)</Text>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Q4 dividend, staking payout, reinvested"
                  />
                </Box>

                <Button type="submit" disabled={!canAdd}>
                  Add Entry
                </Button>

                <Text fontSize="xs" color="fg.muted">
                  Currency is display/entry currency. FX conversion is not applied automatically.
                </Text>
              </Stack>
            </form>
          </Card>

          {/* Controls + list */}
          <Card p={6}>
            <HStack justify="space-between" mb={4} flexWrap="wrap" gap={3}>
              <Heading size="sm">Entries</Heading>

              <HStack gap={2} flexWrap="wrap">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search symbol, notes..."
                  w={{ base: "100%", md: "240px" }}
                />

                <NativeSelect.Root size="sm">
                  <NativeSelect.Field value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                    <option value="all">All months</option>
                    {/* Minimal month options; later: build from rows */}
                    <option value={new Date().toISOString().slice(0, 7)}>This month</option>
                    <option value={`${new Date().getFullYear()}-01`}>This year (Jan)</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </HStack>
            </HStack>

            <Separator mb={4} />

            {loading ? (
              <HStack justify="center" py={10} color="fg.muted">
                <Spinner size="sm" />
                <Text fontSize="sm">Loading...</Text>
              </HStack>
            ) : (
              <Table.ScrollArea borderWidth="1px" borderRadius="md">
                <Table.Root size="sm" variant="line">
                  <Table.Header>
                    <Table.Row bg="bg.muted">
                      <Table.ColumnHeader>Symbol</Table.ColumnHeader>
                      {tab === "staking" ? <Table.ColumnHeader>Network</Table.ColumnHeader> : null}
                      <Table.ColumnHeader>Date</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
                      <Table.ColumnHeader>Notes</Table.ColumnHeader>
                      <Table.ColumnHeader />
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {filteredRows.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={tab === "staking" ? 6 : 5} textAlign="center" py={10} color="fg.muted">
                          No entries yet.
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      filteredRows.map((r) => (
                        <Table.Row key={r.id}>
                          <Table.Cell fontWeight="semibold">{r.symbol}</Table.Cell>
                          {tab === "staking" ? <Table.Cell>{r.network}</Table.Cell> : null}
                          <Table.Cell>{r.date}</Table.Cell>
                          <Table.Cell textAlign="end">{formatMoney(r.amount, currency, 6)}</Table.Cell>
                          <Table.Cell color="fg.muted">{r.notes || "—"}</Table.Cell>
                          <Table.Cell textAlign="end">
                            <Button size="xs" variant="ghost" onClick={() => onDelete(r.id)}>
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
      </Stack>
    </AppShell>
  );
}
