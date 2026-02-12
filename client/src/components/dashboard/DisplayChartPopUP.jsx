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

// 1. Fetch the last 30 days of price history for the asset when the popup opens.
// 2. Fit a polynomial regression to the close prices to find the trend.
// 3. Compute a projected "next" value and confidence score from the fit.
// 4. Render a chart with the price history, trend line, and next projection.
// 5. Show KPI cards for trend direction, reliability, and next target.

// Solve A*x=b using Gaussian elimination.
// Returns the solution vector or null if the system cannot be solved.
function solveLinearSystem(A, b) {
  const n = A.length;

  // Create an augmented matrix [A | b] to do elimination in one structure.
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Pick the best pivot row for this column.
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivotRow][col])) pivotRow = r;
    }

    // If pivot is too small, the system is singular.
    if (Math.abs(M[pivotRow][col]) < 1e-12) return null;

    // Swap pivot row into place.
    if (pivotRow !== col) [M[col], M[pivotRow]] = [M[pivotRow], M[col]];

    // Scale pivot row so the pivot becomes 1.
    const pivot = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= pivot;

    // Eliminate this column in all other rows.
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }

  // After elimination, the final column holds the solution.
  return M.map((row) => row[n]);
}

// Evaluate a polynomial at x.
// coeffs = [a0, a1, a2, and so on] and y = a0 + a1*x + a2*x^2 + and so on.
function evalPoly(coeffs, x) {
  let y = 0;
  let xp = 1; // This tracks x^i as we move through the coefficients.
  for (let i = 0; i < coeffs.length; i++) {
    y += coeffs[i] * xp;
    xp *= x;
  }
  return y;
}

// Compute adjusted R^2 from R^2.
// This penalizes using more polynomial terms (higher degree).
function adjustedR2(r2, n, p) {
  // If we do not have enough points, just return the normal R^2.
  if (n <= p + 1) return r2;
  return 1 - (1 - r2) * ((n - 1) / (n - p - 1));
}

// Fit a polynomial regression to y-values using x = 0..n-1.
// Returns fitted curve values (yHat), a "next" projected value, and fit stats.
function polyRegression(yVals, degree = 2) {
  const n = yVals.length;
  if (n < 2) return null;

  // Keep the degree safe so we do not try to fit more terms than points allow.
  const d = Math.max(1, Math.min(degree, n - 1));
  const m = d + 1; // Number of coefficients.

  // x-values are just the index positions of the points.
  const xVals = Array.from({ length: n }, (_, i) => i);

  // Build the normal equation system (X^T X) * c = (X^T y).
  const XtX = Array.from({ length: m }, () => Array(m).fill(0));
  const Xty = Array(m).fill(0);

  for (let i = 0; i < n; i++) {
    const x = xVals[i];

    // Precompute powers of x up to 2*d to fill XtX efficiently.
    const pow = Array(2 * d + 1).fill(0);
    pow[0] = 1;
    for (let k = 1; k < pow.length; k++) pow[k] = pow[k - 1] * x;

    // Accumulate sums needed for XtX and Xty.
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) {
        XtX[r][c] += pow[r + c];
      }
      Xty[r] += yVals[i] * pow[r];
    }
  }

  // Solve for polynomial coefficients.
  const coeffs = solveLinearSystem(XtX, Xty);
  if (!coeffs) return null;

  // yHat is the fitted trend value at each original x position.
  const yHat = xVals.map((x) => evalPoly(coeffs, x));

  // next is the fitted value one step beyond the last point (x = n).
  const next = evalPoly(coeffs, n);

  // Compute R^2 and adjusted R^2 to estimate how well the curve fits the data.
  const yMean = yVals.reduce((a, b) => a + b, 0) / n;
  const ssTot = yVals.reduce((acc, y) => acc + (y - yMean) ** 2, 0);
  const ssRes = yVals.reduce((acc, y, i) => acc + (y - yHat[i]) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const adjR2 = adjustedR2(r2, n, d);

  // instantSlope is the derivative of the polynomial at the last x point.
  const xLast = n - 1;
  let instantSlope = 0;
  for (let k = 1; k < coeffs.length; k++) {
    instantSlope += k * coeffs[k] * Math.pow(xLast, k - 1);
  }

  return { coeffs, yHat, next, r2, adjR2, degree: d, instantSlope };
}

// Format the x-axis label.
// If the label is "Next" show a friendly word instead of a date.
function formatDateLabel(label) {
  if (!label || label === "Next") return "Forecast";
  const d = new Date(`${label}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? label
    : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

// Format numbers as currency for tooltips and KPI cards.
function formatCurrency(v, currency = "EUR") {
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(v));
}

// Turn adjusted R^2 into a simple confidence label.
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

// Popup component that loads price history and renders the chart + stats.
export default function DisplayChartPopUP({ open, setOpen, asset }) {
  // Tracks request state for fetching price history.
  const [loading, setLoading] = useState(false);

  // Stores a message when the API fails or the network errors.
  const [err, setErr] = useState("");

  // Holds the raw rows returned from the API.
  const [rows, setRows] = useState([]);

  // How many days of history to request from the API.
  const DAYS = 30;

  // Degree used for the polynomial trend line.
  const POLY_DEGREE = 2;

  // Fetch data when the dialog opens and have an asset id.
  useEffect(() => {
    let mounted = true; // Prevent state updates after unmount.

    async function load() {
      // Do not load unless popup is open and the asset has an id.
      if (!open || !asset?.assetRefId) return;

      setErr("");
      setLoading(true);

      try {
        const { res, data } = await getLastPriceHistory(asset.assetRefId, DAYS);

        // If component unmounted during fetch, stop here.
        if (!mounted) return;

        // Handle API errors.
        if (!res.ok) {
          setErr(data?.error || "Failed to load price history.");
          setRows([]);
          return;
        }

        // Store valid rows or empty array if the shape is unexpected.
        setRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch {
        // Handle network or errors.
        if (mounted) {
          setErr("Network error occurred.");
          setRows([]);
        }
      } finally {
        // Finish loading state if still mounted.
        if (mounted) setLoading(false);
      }
    }

    load();

    // Cleanup runs when dependencies change or component unmounts.
    return () => {
      mounted = false;
    };
  }, [open, asset?.assetRefId]);

  // Compute chart data and stats from rows.
  const computed = useMemo(() => {
    // Extract close prices and keep only valid numbers.
    const closes = rows
      .map((r) => r?.close)
      .filter((v) => typeof v === "number" && Number.isFinite(v));

    // Need enough points to fit a curve.
    if (closes.length < 3) return null;

    // Fit the polynomial and get trend values.
    const fit = polyRegression(closes, POLY_DEGREE);
    if (!fit) return null;

    const { yHat, next, adjR2, instantSlope } = fit;

    // Build the chart data array used by Recharts.
    const chartData = rows.map((r, i) => ({
      date: r.date,
      close: r.close,
      trend: yHat[i],
    }));

    // Add one extra point to show the projected next value.
    chartData.push({ date: "Next", close: next, trend: next });

    // Compare next projected value to the last real close.
    const lastClose = closes[closes.length - 1];
    const delta = next - lastClose;

    return {
      chartData,
      next,
      lastClose,
      delta,
      adjR2,
      instantSlope,
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
                    {asset?.name || "Price Forecast"} • Last {DAYS} days • Poly(
                    {POLY_DEGREE})
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
                // Show error message when loading fails.
                <Box textAlign="center" py={20}>
                  <Text color="fg.error" fontWeight="700">
                    {err}
                  </Text>
                </Box>
              ) : rows.length > 0 && computed ? (
                // Show stats and chart when data is available.
                <Stack gap={6}>
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                    <StatCard
                      title="Market Trend"
                      value={computed.instantSlope > 0 ? "Upward" : "Downward"}
                      subValue="Momentum at latest point"
                      icon={TrendingUp}
                      accent={computed.instantSlope > 0 ? "success" : "danger"}
                    />

                    <StatCard
                      title="Reliability"
                      value={confidenceLabel(computed.adjR2)}
                      subValue={`Adjusted R²: ${computed.adjR2.toFixed(2)}`}
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
