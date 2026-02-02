import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  Table,
  Text,
  Menu,
  Portal,
  Spinner,
} from "@chakra-ui/react";
import { Search, Filter } from "lucide-react";

import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import KpiCard from "../components/dashboard/KpiCard.jsx";
import AllocationDonut from "../components/dashboard/AllocationDonut.jsx";
import { getDashboardSummary } from "../api/dashboardApi.js";
import { formatMoney } from "../utils/money";
import { loadSettings } from "../state/settingStore";

function AllocationSummaryTable({ rows, loading }) {
  return (
    <Table.Root size="sm" variant="line">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Value/Invested</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Gain</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Allocation %</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {loading ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <HStack py={6} justify="center" color="fg.muted">
                <Spinner size="sm" />
                <Text fontSize="sm">Loading...</Text>
              </HStack>
            </Table.Cell>
          </Table.Row>
        ) : rows.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={4} py={8} textAlign="center" color="fg.muted">
              No data yet.
            </Table.Cell>
          </Table.Row>
        ) : (
          rows.map((r) => (
            <Table.Row key={r.key}>
              <Table.Cell fontWeight="semibold">{r.name}</Table.Cell>
              <Table.Cell textAlign="end">{r.valueInvested}</Table.Cell>
              <Table.Cell textAlign="end">{r.gain}</Table.Cell>
              <Table.Cell textAlign="end">{r.allocationPct}</Table.Cell>
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}

function HoldingsBigTable({ rows, loading }) {
  return (
    <Table.ScrollArea borderWidth="1px" borderRadius="md">
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row bg="bg.muted">
            <Table.ColumnHeader>Currency</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Balance</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Avg Price</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Cost Basis</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Current Value</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Total Profit</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Share %</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={7}>
                <HStack py={8} justify="center" color="fg.muted">
                  <Spinner size="sm" />
                  <Text fontSize="sm">Loading...</Text>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ) : rows.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={7} py={10} textAlign="center" color="fg.muted">
                No holdings yet.
              </Table.Cell>
            </Table.Row>
          ) : (
            rows.map((r) => (
              <Table.Row key={r.key}>
                <Table.Cell fontWeight="semibold">{r.currency}</Table.Cell>
                <Table.Cell textAlign="end">{r.balance}</Table.Cell>
                <Table.Cell textAlign="end">{r.avgPrice}</Table.Cell>
                <Table.Cell textAlign="end">{r.costBasis}</Table.Cell>
                <Table.Cell textAlign="end">{r.currentValue}</Table.Cell>
                <Table.Cell textAlign="end">{r.totalProfit}</Table.Cell>
                <Table.Cell textAlign="end">{r.sharePct}</Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>

        <Table.Footer>
          <Table.Row>
            <Table.Cell fontWeight="semibold">Total</Table.Cell>
            <Table.Cell colSpan={4} />
            <Table.Cell textAlign="end" fontWeight="semibold">
              —
            </Table.Cell>
            <Table.Cell />
          </Table.Row>
        </Table.Footer>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export default function Dashboard() {
  const settings = useMemo(() => loadSettings(), []);
  const currency = settings.baseCurrency;
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | stocks | crypto


  // Layout-driven rows, Later bind to real computed data
  const allocationRows = useMemo(() => {
  const g = state.data?.groups;
  if (!g) return [];

  const stocksValueInvested = `${formatMoney(g.stocks.value, settings.baseCurrency)} / ${formatMoney(
    g.stocks.invested,
    settings.baseCurrency
  )}`;

  const cryptoValueInvested = `${formatMoney(g.crypto.value, settings.baseCurrency)} / ${formatMoney(
    g.crypto.invested,
    settings.baseCurrency
  )}`;

  return [
    {
      key: "stocks",
      name: "Stocks",
      valueInvested: stocksValueInvested,
      gain: formatMoney(g.stocks.gain, settings.baseCurrency),
      allocationPct: `${Number(g.stocks.allocationPct || 0).toFixed(2)}%`,
    },
    {
      key: "crypto",
      name: "Crypto",
      valueInvested: cryptoValueInvested,
      gain: formatMoney(g.crypto.gain, settings.baseCurrency),
      allocationPct: `${Number(g.crypto.allocationPct || 0).toFixed(2)}%`,
    },
  ];
}, [state.data, settings.baseCurrency]);


  const holdingsRows = useMemo(() => {
  const rows = state.data?.holdings || [];
  const s = searchTerm.trim().toLowerCase();

  return rows
    .filter((r) => {
      if (filterType === "stocks" && r.type !== "stock") return false;
      if (filterType === "crypto" && r.type !== "crypto") return false;
      return true;
    })
    .filter((r) => {
      if (!s) return true;
      return (
        String(r.symbol || "").toLowerCase().includes(s) ||
        String(r.name || "").toLowerCase().includes(s)
      );
    })
    .map((r) => ({
      key: r.key,
      currency: r.symbol,
      balance: r.balance,
      avgPrice: formatMoney(r.avgPrice, settings.baseCurrency),
      costBasis: formatMoney(r.costBasis, settings.baseCurrency),
      currentValue: formatMoney(r.currentValue, settings.baseCurrency),
      totalProfit: formatMoney(r.totalProfit, settings.baseCurrency),
      sharePct: `${Number(r.sharePct || 0).toFixed(2)}%`,
      type: r.type,
    }));
}, [state.data, searchTerm, filterType, settings.baseCurrency]);


  useEffect(() => {
    let mounted = true;
    async function load() {
      const { res, data } = await getDashboardSummary();
      if (!mounted) return;

      if (!res.ok) {
        setState({ loading: false, error: data?.error || "Failed to load dashboard.", data: null });
        return;
      }
      setState({ loading: false, error: "", data });
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = state.data?.kpis || {};
  const valueText = state.loading ? "—" : formatMoney(kpis.value, settings.baseCurrency);
  const profitText = state.loading ? "—" : kpis.totalProfit == null ? "—" : formatMoney(kpis.totalProfit, settings.baseCurrency);
  const irrText = "—";
  const incomeText = "—";

  return (
    <AppShell>
      <Stack gap={4}>
        {/* KPI ROW */}
        <HStack gap={4} align="stretch" wrap="wrap">
          <Box flex="1" minW="220px">
            <KpiCard title={`Value`} value={valueText} subtext="" isLoading={state.loading} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title={`Total Profit`} value={profitText} subtext="" isLoading={state.loading} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title={`IRR`} value={irrText} subtext="" isLoading={false} />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard title={`Passive Income`} value={incomeText} subtext="" isLoading={false} />
          </Box>
        </HStack>

        {/* Donut ROW*/}
        <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={4}>
          <Card p={6}>
            <Heading size="sm" mb={3}>
              Portfolio
            </Heading>

            <AllocationDonut
              data={state.data?.allocation || []}
              currency={settings.baseCurrency}
            />
          </Card>

          <Card p={6}>
            <HStack justify="space-between" mb={3}>
              <Heading size="sm">Allocation</Heading>
              <Text fontSize="sm" color="fg.muted">
                Stocks grouped and Crypto grouped here
              </Text>
            </HStack>

            <AllocationSummaryTable rows={allocationRows} loading={state.loading} />
          </Card>
        </Box>

        {/* BIG TABLE SECTION */}
        <Card p={6}>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="sm">Cash</Heading>

            <HStack gap={2}>
              {/* Search */}
              <HStack
                borderWidth="1px"
                borderRadius="md"
                px={2}
                py={1}
                minW={{ base: "200px", md: "260px" }}
              >
                <Search size={16} />
                <Input
                    variant="unstyled"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </HStack>

              {/* Filter menu placeholder */}
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button variant="outline" size="sm">
                    <HStack gap={2}>
                      <Filter size={16} />
                      <Text>Filter</Text>
                    </HStack>
                  </Button>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      <Menu.Item value="all" onClick={() => setFilterType("all")}>All</Menu.Item>
                      <Menu.Item value="stocks" onClick={() => setFilterType("stocks")}>Stocks</Menu.Item>
                      <Menu.Item value="crypto" onClick={() => setFilterType("crypto")}>Crypto</Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </HStack>
          </HStack>

          <HoldingsBigTable rows={holdingsRows} loading={state.loading} />
        </Card>
      </Stack>
    </AppShell>
  );
}

