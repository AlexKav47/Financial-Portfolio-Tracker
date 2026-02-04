import React, { useMemo } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Stack,
  Text,
  SimpleGrid,
  Flex,
  Badge,
  Circle,
  Separator,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  Lock,
  ShieldCheck,
  LineChart,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function Hero() {
  const T = useMemo(
    () => ({
      bg0: "#050816", 
      bg1: "#0B1227", 
      bg2: "#0E1937", 
      stroke: "rgba(148, 163, 184, 0.18)", 
      stroke2: "rgba(148, 163, 184, 0.28)",
      text0: "#EAF0FF",
      text1: "rgba(234, 240, 255, 0.78)",
      text2: "rgba(234, 240, 255, 0.62)",
      brand0: "#7C3AED", 
      brand1: "#22D3EE", 
      ok: "#34D399",
      warn: "#FBBF24",
      shadow: "0 30px 90px rgba(0,0,0,0.55)",
    }),
    []
  );

  const chartData = useMemo(
    () => [
      { t: "Mon", v: 98 },
      { t: "Tue", v: 103 },
      { t: "Wed", v: 101 },
      { t: "Thu", v: 112 },
      { t: "Fri", v: 118 },
      { t: "Sat", v: 116 },
      { t: "Sun", v: 128 },
    ],
    []
  );

  return (
    <Box
      minH="100vh"
      bg={T.bg0}
      color={T.text0}
      fontFamily="'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      overflow="hidden"
      position="relative"
    >
      {/* backdrop  */}
      {/* subtle grid */}
      <Box
        position="absolute"
        inset="0"
        backgroundImage={`radial-gradient(${T.stroke2} 1px, transparent 1px)`}
        backgroundSize="44px 44px"
        opacity="0.35"
        maskImage="radial-gradient(ellipse at 40% 20%, black, transparent 70%)"
        pointerEvents="none"
      />
      {/* gradient glows */}
      <Box
        position="absolute"
        top="-18%"
        left="-10%"
        w="740px"
        h="740px"
        bg={T.brand0}
        filter="blur(170px)"
        opacity="0.16"
        borderRadius="full"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-22%"
        right="-12%"
        w="760px"
        h="760px"
        bg={T.brand1}
        filter="blur(190px)"
        opacity="0.12"
        borderRadius="full"
        pointerEvents="none"
      />

      {/* NAV */}
      <Container maxW="7xl" position="relative" zIndex="2" py={6}>
        <Flex align="center" justify="space-between" gap={4}>
          <HStack spacing={3}>
            <Box
              p="10px"
              borderRadius="14px"
              bg="rgba(124, 58, 237, 0.14)"
              border="1px solid"
              borderColor="rgba(124, 58, 237, 0.25)"
              boxShadow="0 0 0 1px rgba(34, 211, 238, 0.06) inset"
            >
              <LineChart size={18} />
            </Box>
            <Stack spacing={0} lineHeight="1.05">
              <Text fontWeight="900" letterSpacing="-0.8px">
                Financial Portfolio Tracker
              </Text>
              <Text fontSize="12px" color={T.text2} fontWeight="600">
                Final Year Project
              </Text>
            </Stack>
          </HStack>

          <HStack spacing={2}>
            <Button
              as={RouterLink}
              to="/login"
              variant="ghost"
              color={T.text0}
              _hover={{ bg: "rgba(234,240,255,0.06)" }}
              _active={{ bg: "rgba(234,240,255,0.08)" }}
              size="sm"
            >
              Sign in
            </Button>
            <Button
              as={RouterLink}
              to="/register"
              size="sm"
              borderRadius="999px"
              bg="rgba(234,240,255,0.95)"
              color="#0B1227"
              _hover={{
                bg: "rgba(234,240,255,1)",
                transform: "translateY(-1px)",
              }}
              _active={{ transform: "translateY(0px)" }}
              rightIcon={<ArrowRight size={16} />}
            >
              Create account
            </Button>
          </HStack>
        </Flex>
      </Container>

      {/* hero */}
      <Container maxW="7xl" position="relative" zIndex="2" pt={{ base: 10, md: 14 }} pb={{ base: 16, md: 20 }}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 12, lg: 10 }} alignItems="center">
          {/* left copy */}
          <Stack spacing={7}>

            <Stack spacing={4}>
              <Heading
                fontWeight="950"
                letterSpacing="-2.4px"
                lineHeight="0.98"
                fontSize={{ base: "44px", md: "60px" }}
              >
                Track your wealth with{" "}
                <Box as="span" bgGradient={`linear(to-r, ${T.brand1}, ${T.brand0})`} bgClip="text">
                  clean, real metrics
                </Box>
                .
              </Heading>
              <Text color={T.text1} fontSize={{ base: "md", md: "lg" }} lineHeight="1.7" maxW="46ch">
                A portfolio dashboard built for students and retail investors: unified holdings, allocation breakdown,
                profit attribution, and performance analytics—without the clutter.
              </Text>
            </Stack>

            <HStack spacing={3} flexWrap="wrap">
              <Button
                as={RouterLink}
                to="/register"
                size="lg"
                borderRadius="16px"
                bg={T.brand0}
                color="white"
                _hover={{
                  bg: "#6D28D9",
                  boxShadow: "0 0 0 1px rgba(124,58,237,0.30) inset, 0 18px 50px rgba(124,58,237,0.18)",
                  transform: "translateY(-1px)",
                }}
                _active={{ transform: "translateY(0px)" }}
                rightIcon={<ArrowRight size={18} />}
              >
                Get started
              </Button>

              <Button
                as={RouterLink}
                to="/login"
                size="lg"
                variant="outline"
                borderRadius="16px"
                borderColor="rgba(234,240,255,0.18)"
                color={T.text0}
                _hover={{ bg: "rgba(234,240,255,0.05)", borderColor: "rgba(234,240,255,0.28)" }}
              >
                I already have an account
              </Button>
            </HStack>

            <HStack spacing={5} pt={2} flexWrap="wrap" color={T.text2} fontSize="sm">
              <MiniTrust icon={ShieldCheck} label="Encrypted storage" />
              <MiniTrust icon={Lock} label="Secure auth" />
              <MiniTrust icon={Layers} label="Multi-asset ready" />
            </HStack>
          </Stack>

          {/* right product preview */}
          <Box
            position="relative"
            borderRadius="28px"
            p="1px"
            bgGradient={`linear(to-br, rgba(34,211,238,0.32), rgba(124,58,237,0.32), rgba(234,240,255,0.06))`}
            boxShadow={T.shadow}
          >
            <Box
              borderRadius="27px"
              bg={`linear-gradient(180deg, ${T.bg2}, ${T.bg1})`}
              border="1px solid"
              borderColor={T.stroke}
              overflow="hidden"
            >
              {/* top bar */}
              <Flex align="center" justify="space-between" px={6} py={4} borderBottom="1px solid" borderColor={T.stroke}>
                <HStack spacing={3}>
                  <Circle size="10px" bg="rgba(239,68,68,0.85)" />
                  <Circle size="10px" bg="rgba(251,191,36,0.85)" />
                  <Circle size="10px" bg="rgba(34,197,94,0.85)" />
                </HStack>
              </Flex>

              <Box p={{ base: 5, md: 6 }}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  {/* fake kpi cards */}
                  <Box
                    borderRadius="20px"
                    bg="rgba(5,8,22,0.55)"
                    border="1px solid"
                    borderColor={T.stroke}
                    p={5}
                  >
                    <Text fontSize="11px" color={T.text2} fontWeight="800" letterSpacing="0.12em">
                      PORTFOLIO VALUE
                    </Text>
                    <Heading mt={2} fontSize="34px" letterSpacing="-1.2px">
                      €42,910.18
                    </Heading>

                    <HStack mt={3} spacing={2} color={T.ok} fontWeight="800" fontSize="13px">
                      <CheckCircle2 size={16} />
                      <Text>+ €1,284.22 (30D)</Text>
                    </HStack>

                    <Separator my={4} borderColor={T.stroke} />

                    <SimpleGrid columns={2} spacing={3}>
                      <StatPill label="IRR" value="11.3%" accent={T.brand1} />
                      <StatPill label="Passive" value="€92/mo" accent={T.brand0} />
                      <StatPill label="Volatility" value="Med" accent={T.warn} />
                      <StatPill label="Holdings" value="27" accent={T.ok} />
                    </SimpleGrid>
                  </Box>

                  {/* chart card */}
                  <Box
                    borderRadius="20px"
                    bg="rgba(5,8,22,0.55)"
                    border="1px solid"
                    borderColor={T.stroke}
                    p={5}
                    position="relative"
                  >
                    <Flex align="center" justify="space-between">
                      <Stack spacing={0.5}>
                        <Text fontSize="11px" color={T.text2} fontWeight="800" letterSpacing="0.12em">
                          PERFORMANCE
                        </Text>
                        <Text fontSize="sm" color={T.text1} fontWeight="700">
                          7-day Results
                        </Text>
                      </Stack>
                      <Box
                        px={3}
                        py={1}
                        borderRadius="999px"
                        bg="rgba(124,58,237,0.12)"
                        border="1px solid rgba(124,58,237,0.22)"
                        color="rgba(234,240,255,0.85)"
                        fontSize="12px"
                        fontWeight="800"
                      >
                        + 6.9%
                      </Box>
                    </Flex>

                    <Box mt={4} h="170px">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={T.brand1} stopOpacity={0.35} />
                              <stop offset="85%" stopColor={T.brand1} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="t" tick={{ fill: "rgba(234,240,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis hide domain={["dataMin - 8", "dataMax + 8"]} />
                          <Tooltip
                            cursor={{ stroke: "rgba(234,240,255,0.14)", strokeWidth: 1 }}
                            contentStyle={{
                              background: "rgba(11, 18, 39, 0.95)",
                              border: `1px solid ${T.stroke}`,
                              borderRadius: 12,
                              color: T.text0,
                              fontWeight: 700,
                              boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
                            }}
                            labelStyle={{ color: "rgba(234,240,255,0.55)", fontWeight: 800 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={T.brand1}
                            strokeWidth={2}
                            fill="url(#pv)"
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>

                    <Separator my={4} borderColor={T.stroke} />

                    <SimpleGrid columns={2} spacing={2}>
                      <TinyMetric label="Stocks" value="72%" />
                      <TinyMetric label="Crypto" value="28%" />
                    </SimpleGrid>
                  </Box>
                </SimpleGrid>
                </Box>
              </Box>
          </Box>
        </SimpleGrid>
      </Container>

      {/* features */}
      <Box position="relative" zIndex="2" pb={{ base: 14, md: 20 }}>
        <Container maxW="7xl">
          <Box
            borderRadius="30px"
            p={{ base: 6, md: 8 }}
            bg="rgba(11, 18, 39, 0.55)"
            border="1px solid"
            borderColor={T.stroke}
          >
            <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} mb={6} direction={{ base: "column", md: "row" }}>
              <Stack spacing={1}>
                <Heading fontSize={{ base: "xl", md: "2xl" }} letterSpacing="-1px">
                  Built for clarity, not noise
                </Heading>
                <Text color={T.text2} maxW="70ch">
                  Your FYP tracker can stay professional-looking while still feeling modern. These sections are purely
                  presentational—swap copy later.
                </Text>
              </Stack>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
              <FeatureCard
                T={T}
                icon={ShieldCheck}
                title="Secure by default"
                desc="Auth-first UX: sign in, see your dashboard, and keep sensitive numbers protected."
              />
              <FeatureCard
                T={T}
                icon={Layers}
                title="Unified holdings"
                desc="Track positions across assets in one schema—ideal for allocations and performance analytics."
              />
              <FeatureCard
                T={T}
                icon={LineChart}
                title="Performance metrics"
                desc="Show equity curve, IRR, profit breakdowns, and KPIs in a way that’s actually readable."
              />
            </SimpleGrid>

            <Separator my={7} borderColor={T.stroke} />

            <Flex
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <HStack spacing={3} color={T.text2} fontSize="sm" flexWrap="wrap">
                <HStack spacing={2}>
                  <CheckCircle2 size={16} color={T.ok} />
                  <Text>Fast setup</Text>
                </HStack>
                <HStack spacing={2}>
                  <CheckCircle2 size={16} color={T.ok} />
                  <Text>Hardcoded theme</Text>
                </HStack>
                <HStack spacing={2}>
                  <CheckCircle2 size={16} color={T.ok} />
                  <Text>Recharts-ready</Text>
                </HStack>
              </HStack>
            </Flex>
          </Box>
        </Container>
      </Box>

      {/* footer */}
      <Box position="relative" zIndex="2" borderTop={`1px solid ${T.stroke}`} py={8}>
        <Container maxW="7xl">
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
            <Text fontSize="xs" color={T.text2} fontWeight="700">
              © 2026 Portfolio Tracker • FYP build
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}

function MiniTrust({ icon: IconComp, label }) {
  return (
    <HStack spacing={2}>
      <Circle size="26px" bg="rgba(234,240,255,0.06)" border="1px solid rgba(234,240,255,0.14)">
        <IconComp size={14} />
      </Circle>
      <Text>{label}</Text>
    </HStack>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <Box
      borderRadius="14px"
      bg="rgba(234,240,255,0.04)"
      border="1px solid rgba(234,240,255,0.10)"
      p={3}
    >
      <Text fontSize="10px" color="rgba(234,240,255,0.55)" fontWeight="900" letterSpacing="0.12em">
        {label}
      </Text>
      <Text mt={1} fontWeight="900" letterSpacing="-0.3px">
        <Box as="span" color={accent}>
          {value}
        </Box>
      </Text>
    </Box>
  );
}

function TinyMetric({ label, value }) {
  return (
    <Box
      borderRadius="14px"
      bg="rgba(234,240,255,0.04)"
      border="1px solid rgba(234,240,255,0.10)"
      p={3}
    >
      <Text fontSize="11px" color="rgba(234,240,255,0.55)" fontWeight="900">
        {label}
      </Text>
      <Text mt={1} fontSize="16px" fontWeight="900">
        {value}
      </Text>
    </Box>
  );
}

function FeatureCard({ T, icon: IconComp, title, desc }) {
  return (
    <Box
      borderRadius="22px"
      p={6}
      bg="rgba(5,8,22,0.42)"
      border="1px solid"
      borderColor={T.stroke}
      _hover={{
        borderColor: "rgba(34, 211, 238, 0.22)",
        transform: "translateY(-2px)",
      }}
      transition="all 0.25s ease"
    >
      <Circle
        size="44px"
        bg="rgba(34, 211, 238, 0.10)"
        border="1px solid rgba(34, 211, 238, 0.18)"
        mb={4}
      >
        <IconComp size={20} />
      </Circle>
      <Heading fontSize="lg" letterSpacing="-0.8px">
        {title}
      </Heading>
      <Text mt={2} color={T.text2} lineHeight="1.7" fontSize="sm">
        {desc}
      </Text>
    </Box>
  );
}
