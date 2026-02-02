import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Separator,
  Stack,
  Text,
  Accordion,
  Badge,
} from "@chakra-ui/react";
import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

export default function Learning() {
  // Content is local for now, Later to be move this into DB
  const content = useMemo(
    () => [
      {
        id: "basics",
        title: "Basics",
        items: [
          {
            id: "stocks-vs-crypto",
            title: "Stocks vs Crypto: what’s the difference?",
            tags: ["basics"],
            body: [
              "Stocks represent ownership in a company. Crypto assets are digital tokens; some are networks (e.g., ETH), some are designed as money (e.g., BTC), and many are speculative.",
              "Stocks generally have clearer fundamentals (revenue, profit, cash flow). Crypto fundamentals depend on network utility, adoption, fees, tokenomics, and risk.",
              "Both can be volatile. Crypto is usually more volatile and can be impacted by exchange risks and protocol risks.",
            ],
          },
          {
            id: "market-cap",
            title: "Market cap explained (and why it matters)",
            tags: ["basics"],
            body: [
              "Market cap = price × supply. It’s a size indicator, not a guarantee of safety.",
              "Two assets can have the same price but vastly different market caps due to supply differences.",
              "For portfolios, market cap often influences expected volatility and liquidity.",
            ],
          },
        ],
      },
      {
        id: "kpis",
        title: "KPIs & Metrics",
        items: [
          {
            id: "portfolio-value",
            title: "Portfolio Value vs Cost Basis",
            tags: ["kpi", "portfolio"],
            body: [
              "Cost basis is what you paid (quantity × average buy price).",
              "Market value is what it is worth now (quantity × latest price).",
              "Profit/Loss = Market value − Cost basis.",
              "Your dashboard is market-based, with a fallback to cost basis when a latest price is unavailable.",
            ],
          },
          {
            id: "irr",
            title: "IRR (Internal Rate of Return): what it means",
            tags: ["kpi"],
            body: [
              "IRR is a time-weighted annualized return measure based on cash flows.",
              "It accounts for timing of contributions and withdrawals.",
              "To implement IRR correctly, you need dated cash flows (buys, sells, deposits, withdrawals, dividends) and an ending value.",
            ],
          },
          {
            id: "passive-income",
            title: "Passive Income: dividends & staking",
            tags: ["income"],
            body: [
              "Dividends are cash distributions from stocks/ETFs.",
              "Staking rewards are crypto network incentives (often paid in the token).",
              "For accurate passive income, track payments with dates and amounts; optionally link to the asset and reinvestment.",
            ],
          },
        ],
      },
      {
        id: "troubleshooting",
        title: "Troubleshooting",
        items: [
          {
            id: "missing-latest-price",
            title: "Why does an asset show Market Price: N/A?",
            tags: ["prices"],
            body: [
              "If LatestPrice is missing, it usually means the nightly refresh has not ingested that asset yet.",
              "For crypto, ensure the asset has providerIds.yahooSymbol like BTC-USD.",
              "For stocks, ensure providerIds.stooqSymbol like aapl.us.",
              "Your system falls back to avgBuyPrice to keep valuations working.",
            ],
          },
          {
            id: "currency-setting",
            title: "Currency changed but values didn’t convert",
            tags: ["settings"],
            body: [
              "Your currency setting currently changes formatting (€, $, £).",
              "It does not perform FX conversion. Conversion requires exchange rates and a base currency model.",
              "If you want FX conversion next, we can add an FX rate table + conversion layer.",
            ],
          },
        ],
      },
      {
        id: "faq",
        title: "FAQ",
        items: [
          {
            id: "data-sources",
            title: "Where do prices come from?",
            tags: ["faq", "data"],
            body: [
              "Stocks: Stooq daily CSV data (ingested once per day).",
              "Crypto: Yahoo Finance symbol-based data (e.g., BTC-USD), ingested once per day.",
              "This approach avoids rate limits and improves reliability compared to per-request APIs.",
            ],
          },
          {
            id: "security-cookies",
            title: "How does authentication work?",
            tags: ["faq", "security"],
            body: [
              "Authentication is cookie-based. Cookies should be HttpOnly to mitigate XSS token theft.",
              "In production, use Secure cookies + SameSite appropriate to your deployment (often Lax or None depending on domain setup).",
            ],
          },
        ],
      },
    ],
    []
  );

  const categories = useMemo(
    () => content.map((c) => ({ id: c.id, title: c.title })),
    [content]
  );

  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || "");
  const [q, setQ] = useState("");

  const activeCategory = useMemo(
    () => content.find((c) => c.id === activeCategoryId) || content[0],
    [content, activeCategoryId]
  );

  const filteredItems = useMemo(() => {
    const query = normalize(q);
    const allItems = (activeCategory?.items || []).map((x) => x);

    if (!query) return allItems;

    return allItems.filter((item) => {
      const haystack =
        normalize(item.title) +
        " " +
        normalize(item.tags?.join(" ")) +
        " " +
        normalize(item.body?.join(" "));
      return haystack.includes(query);
    });
  }, [activeCategory, q]);

  return (
    <AppShell>
      <Stack gap={4}>
        <Box>
          <Heading size="md" mb={2}>Learning</Heading>
          <Text color="fg.muted">
            Mini-guides, KPI explanations, FAQs, and troubleshooting for your portfolio tracker.
          </Text>
        </Box>

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "280px 1fr" }}
          gap={4}
          alignItems="start"
        >
          {/* LEFT: Categories */}
          <Card p={4}>
            <Text fontWeight="semibold" mb={3}>Topics</Text>
            <Stack gap={1}>
              {categories.map((c) => {
                const active = c.id === activeCategoryId;
                return (
                  <Button
                    key={c.id}
                    variant={active ? "solid" : "ghost"}
                    justifyContent="flex-start"
                    onClick={() => {
                      setActiveCategoryId(c.id);
                      setQ("");
                    }}
                  >
                    {c.title}
                  </Button>
                );
              })}
            </Stack>
          </Card>

          {/* RIGHT: Search + Articles */}
          <Stack gap={4}>
            <Card p={4}>
              <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
                <Box>
                  <Text fontWeight="semibold">{activeCategory?.title || "Articles"}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    Search within this topic
                  </Text>
                </Box>

                <Box minW={{ base: "100%", md: "320px" }}>
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search..."
                  />
                </Box>
              </HStack>
            </Card>

            <Card p={0}>
              <Box px={4} py={3}>
                <Text fontSize="sm" color="fg.muted">
                  {filteredItems.length} article(s)
                </Text>
              </Box>
              <Separator />

              <Accordion.Root multiple>
                {filteredItems.map((item) => (
                  <Accordion.Item key={item.id} value={item.id}>
                    <Accordion.ItemTrigger px={4} py={3}>
                      <HStack justify="space-between" w="full" gap={3}>
                        <Text fontWeight="semibold">{item.title}</Text>
                        <HStack gap={2} flexWrap="wrap" justify="flex-end">
                          {(item.tags || []).slice(0, 3).map((t) => (
                            <Badge key={t} variant="outline">
                              {t}
                            </Badge>
                          ))}
                        </HStack>
                      </HStack>
                    </Accordion.ItemTrigger>

                    <Accordion.ItemContent px={4} pb={4}>
                      <Stack gap={3}>
                        {(item.body || []).map((p, idx) => (
                          <Text key={idx} color="fg.muted">
                            {p}
                          </Text>
                        ))}

                        <Separator />
                      </Stack>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                ))}
              </Accordion.Root>

              {filteredItems.length === 0 ? (
                <Box px={4} py={10} textAlign="center" color="fg.muted">
                  No results for “{q}”.
                </Box>
              ) : null}
            </Card>
          </Stack>
        </Box>
      </Stack>
    </AppShell>
  );
}
