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

// Solve A*x=b using Gaussian elimination
// Returns the solution vector or null if the system cannot be solved
function solveLinearSystem(A, b) {
  const n = A.length;

  // Create an augmented matrix [A | b] to do elimination in one structure
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Pick the best pivot row for this column
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivotRow][col])) pivotRow = r;
    }

    // If pivot is too small, the system is singular
    if (Math.abs(M[pivotRow][col]) < 1e-12) return null;

    // Swap pivot row into place.
    if (pivotRow !== col) [M[col], M[pivotRow]] = [M[pivotRow], M[col]];

    // Scale pivot row so the pivot becomes 1
    const pivot = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= pivot;

    // Eliminate this column in all other rows
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }

  // After elimination the final column holds the solution
  return M.map((row) => row[n]);
}

// Evaluate a polynomial at x
// coeffs = [a0, a1, a2, ...] and y = a0 + a1*x + a2*x^2 + ...
function evalPoly(coeffs, x) {
  let y = 0;
  let xp = 1;
  for (let i = 0; i < coeffs.length; i++) {
    y += coeffs[i] * xp;
    xp *= x;
  }
  return y;
}

// Format the x-axis label
// If the label is Next show a word instead of a date
function formatDateLabel(label) {
  if (!label || label === "Next") return "Forecast";
  const d = new Date(`${label}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? label
    : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

// Format numbers as currency for tooltips and KPI cards
function formatCurrency(v, currency = "EUR") {
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(v));
}

// Turn a score into a simple confidence label
function confidenceLabel(score) {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

function StatCard({ title, value, subValue, icon, accent }) {
  const accentColor =
    accent === "success"
      ? "green.500"
      : accent === "danger"
      ? "red.500"
      : accent;

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
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="widest"
          >
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

/**
 * Pick 5 points from up to 30 rows
 * evenly spaced across time (so we capture the trend, not just the last days)
 */
function pick5EvenlyFrom30(rows) {
  const valid = (Array.isArray(rows) ? rows : [])
    .map((r, i) => ({ ...r, __i: i })) // store original index 0..29
    .filter((r) => typeof r?.close === "number" && Number.isFinite(r.close));

  if (valid.length <= 5) return valid;

  // Evenly spaced indices across the valid array
  const idxs = [0, 1, 2, 3, 4].map((k) =>
    Math.round((k * (valid.length - 1)) / 4)
  );

  // Unique and sorted
  const uniqIdxs = Array.from(new Set(idxs)).sort((a, b) => a - b);

  // If duplicates caused fewer than 5 then fill from the end backwards
  const filled = [...uniqIdxs];
  let cursor = valid.length - 1;
  while (filled.length < 5 && cursor >= 0) {
    if (!filled.includes(cursor)) filled.push(cursor);
    cursor--;
  }
  filled.sort((a, b) => a - b);

  return filled.slice(0, 5).map((i) => valid[i]);
}

/**
 * Polynomial interpolation through N points
 * With 5 points, degree 4 polynomial, 5 coefficients
 *
 * Builds Vandermonde matrix
 *   A[i][j] = x_i^j
 * and solves A * coeffs = y
 */
function polyInterpolate(xVals, yVals) {
  const n = xVals.length;
  if (n < 2 || yVals.length !== n) return null;

  const A = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    let xp = 1;
    for (let j = 0; j < n; j++) {
      A[i][j] = xp;
      xp *= xVals[i];
    }
  }

  const coeffs = solveLinearSystem(A, yVals);
  if (!coeffs) return null;

  return { coeffs };
}

// Popup component that loads price history and renders the chart and stats
export default function DisplayChartPopUP({ open, setOpen, asset }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  // How many days of history to request from the API
  const DAYS = 30;

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!open || !asset?.assetRefId) return;

      setErr("");
      setLoading(true);

      try {
        const { res, data } = await getLastPriceHistory(asset.assetRefId, DAYS);
        if (!mounted) return;

        if (!res.ok) {
          setErr(data?.error || "Failed to load price history.");
          setRows([]);
          return;
        }

        setRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch {
        if (mounted) {
          setErr("Network error occurred.");
          setRows([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [open, asset?.assetRefId]);

  // Compute chart data and stats using 5 chosen points
  const computed = useMemo(() => {
    const picked5 = pick5EvenlyFrom30(rows);

    // Need exactly 5 points for 5 unknowns logic (degree 4 polynomial)
    if (picked5.length < 5) return null;

    // Use original indices (__i) as x-values to preserve spacing.
    const xVals = picked5.map((r) => r.__i);
    const yVals = picked5.map((r) => r.close);

    const fit = polyInterpolate(xVals, yVals);
    if (!fit) return null;

    const { coeffs } = fit;

    // Trend is the interpolated polynomial at each chosen x
    const chartData = picked5.map((r) => ({
      date: r.date,
      close: r.close,
      trend: evalPoly(coeffs, r.__i),
    }));

    // Forecast one day beyond the last selected index
    const lastX = xVals[xVals.length - 1];
    const nextX = lastX + 1;
    const next = evalPoly(coeffs, nextX);

    chartData.push({ date: "Next", close: next, trend: next });

    const lastClose = yVals[yVals.length - 1];
    const delta = next - lastClose;

    // Slope at the latest point
    let instantSlope = 0;
    for (let k = 1; k < coeffs.length; k++) {
      instantSlope += k * coeffs[k] * Math.pow(lastX, k - 1);
    }

    // Compare forecast jump to average move between the 5 points
    const absMoves = [];
    for (let i = 1; i < yVals.length; i++) absMoves.push(Math.abs(yVals[i] - yVals[i - 1]));
    const avgMove = absMoves.length
      ? absMoves.reduce((a, b) => a + b, 0) / absMoves.length
      : 0;

    const jump = Math.abs(next - lastClose);
    const stabilityScore = avgMove > 0 ? Math.max(0, 1 - jump / (3 * avgMove)) : 0.5;

    return {
      chartData,
      next,
      lastClose,
      delta,
      instantSlope,
      stabilityScore,
      pickedIdxs: xVals,
      coeffs,
    };
  }, [rows]);

  return (
    <Dialog.Root size="full" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.canvas" color="fg.default">
            <Dialog.Header
              borderBottomWidth="1px"
              borderColor="border.subtle"
              bg="bg.panel"
              pb={4}
            >
              <HStack justify="space-between">
                <Stack gap={0}>
                  <Dialog.Title style={{ fontSize: "22px", fontWeight: 900 }}>
                    {asset?.symbol} Performance
                  </Dialog.Title>
                  <Text color="fg.muted">
                    {asset?.name || "Price Forecast"} • Last {DAYS} days
                  </Text>
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
                  <Text color="fg.error" fontWeight="700">
                    {err}
                  </Text>
                </Box>
              ) : rows.length > 0 && computed ? (
                <Stack gap={6}>
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                    <StatCard
                      title="Market Trend"
                      value={computed.instantSlope > 0 ? "Upward" : "Downward"}
                      subValue="Slope at latest point"
                      icon={TrendingUp}
                      accent={computed.instantSlope > 0 ? "success" : "danger"}
                    />

                    <StatCard
                      title="Reliability"
                      value={confidenceLabel(computed.stabilityScore)}
                      subValue={`Stability score: ${computed.stabilityScore.toFixed(2)}`}
                      icon={ShieldCheck}
                      accent="blue.500"
                    />

                    <StatCard
                      title="Next Target"
                      value={formatCurrency(computed.next)}
                      subValue={`Δ vs last: ${formatCurrency(computed.delta)}`}
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
                      <ComposedChart
                        data={computed.chartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient
                            id="closeFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--chakra-colors-cyan-500)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="85%"
                              stopColor="var(--chakra-colors-cyan-500)"
                              stopOpacity={0}
                            />
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
                          tick={{
                            fill: "var(--chakra-colors-fg)",
                            fontSize: 12,
                          }}
                          dy={10}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--chakra-colors-fg)",
                            fontSize: 12,
                          }}
                        />

                        <Tooltip
                          formatter={(value) => [formatCurrency(value), "Price"]}
                          contentStyle={{
                            backgroundColor: "var(--chakra-colors-bg-panel)",
                            border:
                              "1px solid var(--chakra-colors-border-subtle)",
                            borderRadius: "12px",
                            color: "var(--chakra-colors-fg-default)",
                            boxShadow: "var(--chakra-shadows-md)",
                          }}
                          itemStyle={{
                            color: "var(--chakra-colors-fg-default)",
                          }}
                          labelStyle={{
                            color: "var(--chakra-colors-fg-muted)",
                            marginBottom: "4px",
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke="none"
                          fill="url(#closeFill)"
                          activeDot={false}
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
