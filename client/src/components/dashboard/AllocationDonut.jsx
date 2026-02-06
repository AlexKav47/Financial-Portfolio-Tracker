import { useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";
import { formatMoney } from "../../utils/money";

const COLORS = [
  "var(--chakra-colors-purple-500)",
  "var(--chakra-colors-blue-500)",
  "var(--chakra-colors-cyan-500)",
  "var(--chakra-colors-green-500)",
  "var(--chakra-colors-yellow-500)",
  "var(--chakra-colors-orange-500)",
  "var(--chakra-colors-red-500)",
];

function DonutTooltip({ active, payload, currency }) {
  if (!active || !payload || payload.length === 0) return null;

  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <Box 
      bg="bg.panel" 
      borderWidth="1px" 
      borderColor="border.subtle" 
      borderRadius="md" 
      px={3} 
      py={2} 
      boxShadow="lg" 
      backdropFilter="blur(10px)"
    >
      <Text fontWeight="semibold" color="fg.default">
        {p.name}
        {p.fullName && p.fullName !== p.name ? ` — ${p.fullName}` : ""}
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {formatMoney(p.value, currency)} ({Number(p.pct || 0).toFixed(2)}%)
      </Text>
    </Box>
  );
}

export default function AllocationDonut({ data = [], currency = "EUR" }) {
  const total = useMemo(() => {
    return (data || []).reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  }, [data]);

  if (!data.length || total <= 0) {
    return (
      <Box
        w="220px"
        h="220px"
        borderRadius="full"
        borderWidth="12px"
        borderColor="border.muted"
        display="grid"
        placeItems="center"
        mx="auto"
      >
        <Box textAlign="center">
          <Text fontWeight="semibold" color="fg.default">Portfolio</Text>
          <Text fontSize="sm" color="fg.muted">
            No allocation yet
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box position="relative" w="100%" h="240px">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={(props) => <DonutTooltip {...props} currency={currency} />} />

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={75} 
            outerRadius={100}
            paddingAngle={4}   
            cornerRadius={6}   
            strokeWidth={0}
            isAnimationActive={true} 
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))" }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Central Label */}
      <Box position="absolute" inset="0" display="grid" placeItems="center" pointerEvents="none">
        <Box textAlign="center">
          <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">
            Total
          </Text>
          <Text fontSize="xl" fontWeight="black" color="fg.default">
            {formatMoney(total, currency)}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}