import { useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import { ResponsiveContainer, PieChart, Pie, Tooltip } from "recharts";
import { formatMoney } from "../../utils/money";

function DonutTooltip({ active, payload, currency }) {
  if (!active || !payload || payload.length === 0) return null;

  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <Box bg="bg.panel" borderWidth="1px" borderRadius="md" px={3} py={2} boxShadow="md">
      <Text fontWeight="semibold">
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
        borderColor="border"
        display="grid"
        placeItems="center"
        mx="auto"
      >
        <Box textAlign="center">
          <Text fontWeight="semibold">Portfolio</Text>
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
            innerRadius={70}
            outerRadius={95}
            paddingAngle={2}
            strokeWidth={0}
            isAnimationActive={false}
          />
        </PieChart>
      </ResponsiveContainer>

      <Box position="absolute" inset="0" display="grid" placeItems="center" pointerEvents="none">
        <Box textAlign="center">
          <Text fontSize="sm" color="fg.muted">
            Total
          </Text>
          <Text fontWeight="bold">{formatMoney(total, currency)}</Text>
        </Box>
      </Box>
    </Box>
  );
}
