import { useEffect, useMemo, useState } from "react";
import {
  Box,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Spinner,
  Stack,
  Text,
  SimpleGrid,
  Icon as ChakraIcon,
} from "@chakra-ui/react";
import { TrendingUp, ShieldCheck, Target } from "lucide-react";
import {
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { getLastPriceHistory } from "../../api/priceHistoryAPI";

// helpers 
function linearRegression(yVals) {
  const n = yVals.length;
  const xVals = Array.from({ length: n }, (_, i) => i);
  const sumX = xVals.reduce((a, b) => a + b, 0);
  const sumY = yVals.reduce((a, b) => a + b, 0);
  const sumXY = xVals.reduce((a, x, i) => a + x * yVals[i], 0);
  const sumXX = xVals.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const yHat = xVals.map((x) => slope * x + intercept);
  const yMean = sumY / n;
  const ssTot = yVals.reduce((acc, y) => acc + (y - yMean) ** 2, 0);
  const ssRes = yVals.reduce((acc, y, i) => acc + (y - yHat[i]) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const next = slope * n + intercept;
  return { slope, yHat, r2, next };
}

function formatDateLabel(label) {
  if (!label || label === "Next") return "Forecast";
  const d = new Date(`${label}T00:00:00`);
  return Number.isNaN(d.getTime()) ? label : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function formatCurrency(v, currency = "EUR") {
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(v));
}

function confidenceLabel(r2) {
  if (r2 >= 0.7) return "High";
  if (r2 >= 0.4) return "Medium";
  return "Low";
}

function StatCard({ title, value, subValue, icon, accent }) {
  const accentColor = accent === "success" ? "green.500" : accent === "danger" ? "red.500" : accent;

  return (
    <Box
      p={5}
      borderRadius="lg"
      border="1px solid"
      borderColor="border.subtle"
      bg="bg.panel" 
    >
      <HStack gap={4}>
        <Box
          p={2}
          borderRadius="lg"
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          color={accentColor}
        >
          <ChakraIcon as={icon} boxSize="20px" />
        </Box>
        <Stack gap={0}>
          <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">
            {title}
          </Text>
          <Text fontSize="xl" fontWeight="900" color="fg.default">
            {value}
          </Text>
          <Text fontSize="xs" color="fg.subtle">
            {subValue}
          </Text>
        </Stack>
      </HStack>
    </Box>
  );
}

export default function DisplayChartPopUP({ open, setOpen, asset }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!open || !asset?.assetRefId) return;
      setErr("");
      setLoading(true);
      try {
        const { res, data } = await getLastPriceHistory(asset.assetRefId, 5);
        if (!mounted) return;
        if (!res.ok) setErr(data?.error || "Failed to load price history.");
        else setRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch {
        setErr("Network error occurred.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [open, asset?.assetRefId]);

  const computed = useMemo(() => {
    const closes = rows.map((r) => r.close).filter((v) => typeof v === "number");
    if (closes.length < 2) return null;
    const { slope, r2, yHat, next } = linearRegression(closes);
    const chartData = rows.map((r, i) => ({ date: r.date, close: r.close, trend: yHat[i] }));
    chartData.push({ date: "Next", close: next, trend: next });
    const last = closes[closes.length - 1];
    return { chartData, slope, r2, next, lastClose: last, delta: next - last };
  }, [rows]);

  return (
    <Dialog.Root size="full" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.canvas" color="fg.default">
            <Dialog.Header borderBottomWidth="1px" borderColor="border.subtle" bg="bg.panel" pb={4}>
              <HStack justify="space-between">
                <Stack gap={0}>
                  <Dialog.Title style={{ fontSize: "22px", fontWeight: 900 }}>
                    {asset?.symbol} Performance
                  </Dialog.Title>
                  <Text color="fg.muted">{asset?.name || "Price Forecast"}</Text>
                </Stack>
                <Dialog.CloseTrigger asChild>
                  <CloseButton />
                </Dialog.CloseTrigger>
              </HStack>
            </Dialog.Header>

            <Dialog.Body p={6}>
              {loading ? (
                <Stack align="center" py={20}>
                  <Spinner size="xl" />
                  <Text color="fg.muted">Generating chart…</Text>
                </Stack>
              ) : err ? (
                <Box textAlign="center" py={20}>
                  <Text color="fg.error" fontWeight="700">{err}</Text>
                </Box>
              ) : rows.length > 0 && computed ? (
                <Stack gap={6}>
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                    <StatCard
                      title="Market Trend"
                      value={computed.slope > 0 ? "Upward" : "Downward"}
                      subValue="Based on last 5 days"
                      icon={TrendingUp}
                      accent={computed.slope > 0 ? "success" : "danger"}
                    />
                    <StatCard
                      title="Reliability"
                      value={confidenceLabel(computed.r2)}
                      subValue="Trend consistency"
                      icon={ShieldCheck}
                      accent="blue.500"
                    />
                    <StatCard
                      title="Next Target"
                      value={formatCurrency(computed.next)}
                      subValue="Calculated forecast"
                      icon={Target}
                      accent="purple.500"
                    />
                  </SimpleGrid>

                  <Box
                    h={{ base: "420px", md: "520px" }}
                    w="100%"
                    bg="bg.panel"
                    p={6}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="border.subtle"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={computed.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <defs>
                          <linearGradient id="closeFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chakra-colors-cyan-500)" stopOpacity={0.3} />
                            <stop offset="85%" stopColor="var(--chakra-colors-cyan-500)" stopOpacity={0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          vertical={false} 
                          stroke="var(--chakra-colors-border)" 
                        />
                        
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDateLabel}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--chakra-colors-fg)", fontSize: 12 }}
                          dy={10}
                        />
                        
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--chakra-colors-fg)", fontSize: 12 }}
                        />
                        
                        <Tooltip
                          formatter={(value) => [formatCurrency(value), "Price"]}
                          contentStyle={{
                            backgroundColor: "var(--chakra-colors-bg-panel)",
                            border: "1px solid var(--chakra-colors-border-subtle)",
                            borderRadius: "12px",
                            color: "var(--chakra-colors-fg-default)",
                            boxShadow: "var(--chakra-shadows-md)",
                          }}
                          itemStyle={{ color: "var(--chakra-colors-fg-default)" }}
                          labelStyle={{ color: "var(--chakra-colors-fg-muted)", marginBottom: "4px" }}
                        />
                        
                        <Area 
                          type="monotone" 
                          dataKey="close" 
                          stroke="none" 
                          fill="url(#closeFill)" 
                          activeDot={false}
                        />
                        
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="var(--chakra-colors-cyan-500)" 
                          strokeWidth={3} 
                          dot={false} 
                        />
                        
                        <Line 
                          type="monotone" 
                          dataKey="trend" 
                          stroke="var(--chakra-colors-fg-muted)" 
                          strokeDasharray="5 5" 
                          strokeWidth={2} 
                          dot={false} 
                          opacity={0.4}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              ) : (
                <Box textAlign="center" py={20}>
                  <Text color="fg.muted">No data found for this asset.</Text>
                </Box>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}