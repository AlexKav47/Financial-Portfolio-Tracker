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
  Tooltip,
} from "@chakra-ui/react";
import { 
  MousePointerClick, 
  Filter, 
  Search, 
  Info, 
  HelpCircle, 
  ArrowRight 
} from "lucide-react";

import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import KpiCard from "../components/dashboard/KpiCard.jsx";
import AllocationDonut from "../components/dashboard/AllocationDonut.jsx";
import { getDashboardSummary } from "../api/dashboardApi.js";
import { formatMoney } from "../utils/money";
import { loadSettings } from "../state/settingStore";
import DisplayChartPopUP from "../components/dashboard/DisplayChartPopUP.jsx";

const InfoTooltip = ({ label }) => (
  <Tooltip.Root portalled interactionMode="hover">
    <Tooltip.Trigger asChild>
      <Box 
        as="span" 
        display="inline-flex" 
        alignItems="center" 
        justifyContent="center"
        ml={1.5} 
        color="fg.muted" 
        cursor="help"
        flexShrink={0}
        width="14px"
        height="14px"
      >
        <Info size={14} />
      </Box>
    </Tooltip.Trigger>
    <Portal>
      <Tooltip.Positioner>
        <Tooltip.Content 
          px={3} 
          py={2} 
          borderRadius="md" 
          bg="bg.panel" 
          boxShadow="lg" 
          borderWidth="1px"
          borderColor="border.subtle"
          maxWidth="200px"
        >
          <Tooltip.Arrow />
          <Text fontSize="xs" color="fg.default" lineHeight="short">{label}</Text>
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Portal>
  </Tooltip.Root>
);

function AllocationSummaryTable({ rows }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="lg"
      overflow="hidden"
      bg="bg.panel"
    >
      <Table.Root size="sm" variant="simple">
        <Table.Header bg="bg.muted">
          <Table.Row borderBottomWidth="1px" borderColor="border.subtle">
            <Table.ColumnHeader color="fg.muted" py={3}>Name</Table.ColumnHeader>
            <Table.ColumnHeader color="fg.muted" textAlign="end">Value / Invested</Table.ColumnHeader>
            <Table.ColumnHeader color="fg.muted" textAlign="end">Gain</Table.ColumnHeader>
            <Table.ColumnHeader color="fg.muted">
              <HStack justify="end" gap={0}>
                <Text>Allocation %</Text>
                <InfoTooltip label="Weight of this category relative to your total portfolio value." />
              </HStack>
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {rows.map((r) => (
            <Table.Row
              key={r.key}
              _hover={{ bg: "bg.subtle" }}
              borderColor="border.subtle"
            >
              <Table.Cell fontWeight="bold" py={3} color="fg.default">{r.name}</Table.Cell>
              <Table.Cell textAlign="end" color="fg.default">{r.valueInvested}</Table.Cell>
              <Table.Cell
                textAlign="end"
                color={r.gain.includes("-") ? "red.500" : "green.500"}
                fontWeight="semibold"
              >
                {r.gain}
              </Table.Cell>
              <Table.Cell textAlign="end" color="fg.default">{r.allocationPct}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function HoldingsBigTable({ rows, loading }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const onOpenAsset = (r) => {
    setSelected({ assetRefId: r.assetRefId, symbol: r.symbol, type: r.type, name: r.name });
    setOpen(true);
  };

  return (
    <>
      <DisplayChartPopUP open={open} setOpen={setOpen} asset={selected} />

      <Table.ScrollArea
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="md"
        bg="none"
      >
        <Table.Root size="sm" variant="simple">
          <Table.Header bg="bg.muted">
            <Table.Row borderColor="border.subtle">
              <Table.ColumnHeader color="fg.muted" py={3}>Currency</Table.ColumnHeader>
              <Table.ColumnHeader color="fg.muted" textAlign="end">Amount</Table.ColumnHeader>
              <Table.ColumnHeader color="fg.muted">
                <HStack justify="end" gap={0}>
                  <Text>Avg Price</Text>
                  <InfoTooltip label="The weighted average cost you paid per unit." />
                </HStack>
              </Table.ColumnHeader>
              <Table.ColumnHeader color="fg.muted">
                 <HStack justify="end" gap={0}>
                  <Text>Cost Basis</Text>
                  <InfoTooltip label="Total money spent on this asset (Price x Amount)." />
                </HStack>
              </Table.ColumnHeader>
              <Table.ColumnHeader color="fg.muted" textAlign="end">Current Value</Table.ColumnHeader>
              <Table.ColumnHeader color="fg.muted" textAlign="end">Total Profit</Table.ColumnHeader>
              <Table.ColumnHeader color="fg.muted" textAlign="end">Share %</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading ? (
              <Table.Row bg="none"><Table.Cell colSpan={7} textAlign="center" py={8}><Spinner size="sm" /></Table.Cell></Table.Row>
            ) : (
              rows.map((r) => (
                <Table.Row
                  key={r.key}
                  bg="none"
                  _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                  borderColor="border.subtle"
                >
                  <Table.Cell py={3}>
                    <HStack
                      as="button"
                      onClick={() => onOpenAsset(r)}
                      gap={3}
                      px={2}
                      py={1}
                      borderRadius="md"
                      _hover={{ bg: "bg.emphasized" }}
                      group
                    >
                      <Stack gap={0} align="start">
                        <Text fontWeight="bold" fontSize="sm" color="fg.default">{r.currency}</Text>
                        <Text fontSize="11px" color="fg.muted">{r.name}</Text>
                      </Stack>
                      <Box opacity="1" _groupHover={{ opacity: 1 }} color="fg.muted">
                        <MousePointerClick size={20} />
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell textAlign="end" color="fg.default">{r.balance}</Table.Cell>
                  <Table.Cell textAlign="end" color="fg.default">{r.avgPrice}</Table.Cell>
                  <Table.Cell textAlign="end" color="fg.default">{r.costBasis}</Table.Cell>
                  <Table.Cell textAlign="end" fontWeight="semibold" color="fg.default">{r.currentValue}</Table.Cell>
                  <Table.Cell
                    textAlign="end"
                    fontWeight="bold"
                    color={r.totalProfit.includes("-") ? "red.500" : "green.500"}
                  >
                    {r.totalProfit}
                  </Table.Cell>
                  <Table.Cell textAlign="end" color="fg.muted">{r.sharePct}</Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </>
  );
}

export default function Dashboard() {
  const settings = useMemo(() => loadSettings(), []);
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const allocationRows = useMemo(() => {
    const g = state.data?.groups;
    if (!g) return [];
    const stocksValueInvested = `${formatMoney(g.stocks.value, settings.baseCurrency)} / ${formatMoney(g.stocks.invested, settings.baseCurrency)}`;
    const cryptoValueInvested = `${formatMoney(g.crypto.value, settings.baseCurrency)} / ${formatMoney(g.crypto.invested, settings.baseCurrency)}`;

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
        ...r,
        key: r.key,
        currency: r.symbol,
        avgPrice: formatMoney(r.avgPrice, settings.baseCurrency),
        costBasis: formatMoney(r.costBasis, settings.baseCurrency),
        currentValue: formatMoney(r.currentValue, settings.baseCurrency),
        totalProfit: formatMoney(r.totalProfit, settings.baseCurrency),
        sharePct: `${Number(r.sharePct || 0).toFixed(2)}%`,
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
    return () => { mounted = false; };
  }, []);

  const kpis = state.data?.kpis || {};

const valueText = state.loading ? "—" : formatMoney(kpis.value, settings.baseCurrency);

const profitText =
  state.loading ? "—" : kpis.totalProfit == null ? "—" : formatMoney(kpis.totalProfit, settings.baseCurrency);

const totalReturnText =
  state.loading
    ? "—"
    : kpis.totalReturnPct == null
      ? "—"
      : `${Number(kpis.totalReturnPct).toFixed(2)}%`;

const passiveIncomeText =
  state.loading
    ? "—"
    : kpis.passiveIncome == null
      ? "—"
      : formatMoney(kpis.passiveIncome, settings.baseCurrency);

  return (
    <AppShell>
      <Stack gap={4}>
        <Box>
          <Heading size="md" mb={2}>Dashboard</Heading>
          <Text color="fg.muted">
            Monitor your portfolio's performance, allocation, and key metrics at a glance. Click on any asset to view detailed charts and insights.
          </Text>
        </Box> 

        {/* HELP BANNER */}
        <Box 
          bg="blue.900/10" 
          borderWidth="1px" 
          borderColor="blue.500/20" 
          p={3} 
          borderRadius="lg"
        >
          <HStack justify="space-between">
            <HStack gap={3}>
              <HelpCircle size={18} color="var(--chakra-colors-blue-400)" />
              <Stack gap={0}>
                <Text fontSize="sm" fontWeight="medium">Feeling Stuck?</Text>
                <Text fontSize="xs" color="fg.muted" display={{ base: "none", md: "block" }}>
                  Learn the basics of how to utilise the dashboard and more to master your portfolio.
                </Text>
              </Stack>
            </HStack>
          </HStack>
        </Box>

        {/* KPI ROW */}
        <HStack gap={4} align="stretch" wrap="wrap">
          <Box flex="1" minW="220px">
            <KpiCard 
              title={<HStack gap={0}><Text>Total Value</Text><InfoTooltip label="Total market value of all holdings." /></HStack>} 
              value={valueText} 
              isLoading={state.loading} 
            />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard 
              title={<HStack gap={0}><Text>Total Profit</Text><InfoTooltip label="Total realized and unrealized gains." /></HStack>} 
              value={profitText} 
              isLoading={state.loading} 
            />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard
                title={
                  <HStack gap={0}>
                    <Text>Total Return %</Text>
                    <InfoTooltip label="Total Profit ÷ Total Invested." />
                  </HStack>
                }
                value={totalReturnText}
                isLoading={state.loading}
              />
          </Box>
          <Box flex="1" minW="220px">
            <KpiCard 
              title={<HStack gap={0}><Text>Passive Income</Text><InfoTooltip label="Dividends and interest earned over the last 12 months." /></HStack>} 
              value={passiveIncomeText}
              isLoading={state.loading} 
            />
          </Box>
        </HStack>

        {/* Donut ROW*/}
        <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={4}>
          <Card p={6}>
            <Heading size="sm" mb={3}>Portfolio Allocation Donut</Heading>
            <AllocationDonut
              data={state.data?.allocation || []}
              currency={settings.baseCurrency}
            />
          </Card>

          <Card p={6}>
            <Heading size="sm" mb={3}>Allocation</Heading>
            <AllocationSummaryTable rows={allocationRows} loading={state.loading} />
          </Card>
        </Box>

        {/* BIG TABLE SECTION */}
        <Card p={6}>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="sm">Holdings</Heading>
            <HStack gap={2}>
              <HStack borderWidth="1px" borderRadius="md" px={2} py={1} minW={{ base: "150px", md: "260px" }}>
                <Search size={16} />
                <Input
                  variant="unstyled"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </HStack>
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button variant="outline" size="sm">
                    <HStack gap={2}><Filter size={16} /><Text>Filter</Text></HStack>
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