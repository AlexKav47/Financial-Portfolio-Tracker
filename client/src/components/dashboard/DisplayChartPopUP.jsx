import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Spinner,
  Stack,
  Text,
  SimpleGrid,
  Icon as ChakraIcon
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

// -------------------- helpers --------------------
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
  return { slope, intercept, yHat, r2, next };
}

function formatDateLabel(label) {
  if (!label || label === "Next") return "Forecast";
  const d = new Date(`${label}T00:00:00`);
  return Number.isNaN(d.getTime()) ? label : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

// UPDATED: Now defaults to Euro
function formatCurrency(v, currency = "EUR") {
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(v));
}

function confidenceLabel(r2) {
  if (r2 >= 0.7) return "High";
  if (r2 >= 0.4) return "Medium";
  return "Low";
}

// -------------------- UI Components --------------------
function StatCard({ title, value, subValue, icon, color }) {
  return (
    <Box p={5} borderRadius="xl" border="1px solid" borderColor="border.muted" bg="white" boxShadow="sm">
      <HStack gap={4}>
        <Box p={2} bg={`${color}.50`} color={`${color}.500`} borderRadius="lg">
          <ChakraIcon as={icon} size="24px" />
        </Box>
        <Stack gap={0}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">{title}</Text>
          <Text fontSize="xl" fontWeight="bold">{value}</Text>
          <Text fontSize="xs" color="gray.400">{subValue}</Text>
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
      setLoading(true);
      try {
        const { res, data } = await getLastPriceHistory(asset.assetRefId, 5);
        if (!mounted) return;
        if (!res.ok) {
          setErr(data?.error || "Failed to load price history.");
        } else {
          setRows(Array.isArray(data?.rows) ? data.rows : []);
        }
      } catch (e) {
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
    
    const chartData = rows.map((r, i) => ({
      date: r.date,
      close: r.close,
      trend: yHat[i],
    }));

    chartData.push({ 
      date: "Next", 
      close: null, 
      trend: next, 
    });

    return { 
      chartData, 
      slope, 
      r2, 
      next, 
      lastClose: closes[closes.length - 1], 
      delta: next - closes[closes.length - 1] 
    };
  }, [rows]);

  return (
    <Dialog.Root size="full" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="#F9FAFB">
            <Dialog.Header borderBottomWidth="1px" bg="white" pb={4}>
              <HStack justify="space-between">
                <Stack gap={0}>
                  <Dialog.Title fontSize="2xl">{asset?.symbol} Performance</Dialog.Title>
                  <Text color="gray.500">{asset?.name || "Price Forecast"}</Text>
                </Stack>
                <Dialog.CloseTrigger asChild><CloseButton /></Dialog.CloseTrigger>
              </HStack>
            </Dialog.Header>

            <Dialog.Body p={6}>
              {loading ? (
                <Stack align="center" py={20}><Spinner size="xl" color="blue.500" /><Text>Generating Chart...</Text></Stack>
              ) : rows.length > 0 && computed ? (
                <Stack gap={6}>
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                    <StatCard 
                      title="Market Trend" 
                      value={computed.slope > 0 ? "Upward" : "Downward"} 
                      subValue="Based on last 5 days"
                      icon={TrendingUp}
                      color={computed.slope > 0 ? "green" : "red"}
                    />
                    <StatCard 
                      title="Reliability" 
                      value={confidenceLabel(computed.r2)} 
                      subValue="Trend consistency"
                      icon={ShieldCheck}
                      color="blue"
                    />
                    <StatCard 
                      title="Next Price Target" 
                      value={formatCurrency(computed.next)} 
                      subValue="Calculated forecast"
                      icon={Target}
                      color="purple"
                    />
                  </SimpleGrid>

                  {/* FIXED HEIGHT BOX */}
                  <Box height="500px" width="100%" bg="white" p={6} borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={computed.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <defs>
                          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3182ce" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3182ce" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDateLabel} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#718096'}}
                          dy={10}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(v) => `€${v}`}
                          tick={{fill: '#718096'}}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), "Price"]}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="close" stroke="none" fill="url(#colorClose)" />
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#3182ce" 
                          strokeWidth={4} 
                          dot={{ r: 6, fill: "#3182ce", strokeWidth: 2, stroke: "#fff" }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="trend" 
                          stroke="#A0AEC0" 
                          strokeDasharray="5 5" 
                          strokeWidth={2} 
                          dot={false} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              ) : (
                <Box textAlign="center" py={20}><Text>No data found for this asset.</Text></Box>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}