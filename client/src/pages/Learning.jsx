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
  NativeSelect,
} from "@chakra-ui/react";
import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text, q) {
  const query = normalize(q);
  if (!query) return text;
  const re = new RegExp(`(${escapeRegExp(query)})`, "ig");
  const parts = String(text).split(re);
  return parts.map((p, i) =>
    re.test(p) ? (
      <Box as="mark" key={i} bg="bg.emphasized" px="1" borderRadius="sm">
        {p}
      </Box>
    ) : (
      <Box as="span" key={i}>
        {p}
      </Box>
    )
  );
}

function makeSnippet(bodyArr, q, maxLen = 140) {
  const raw = (bodyArr || []).join(" ");
  const query = normalize(q);
  if (!raw) return "";
  if (!query) return raw.slice(0, maxLen) + (raw.length > maxLen ? "…" : "");

  const idx = normalize(raw).indexOf(query);
  if (idx === -1) return raw.slice(0, maxLen) + (raw.length > maxLen ? "…" : "");

  const start = Math.max(0, idx - 40);
  const end = Math.min(raw.length, idx + maxLen);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < raw.length ? "…" : "";
  return prefix + raw.slice(start, end) + suffix;
}

export default function Learning() {
  // Content is local for now (Later: move to DB)
  const content = useMemo(
    () => [
      {
        id: "basics",
        title: "Basics",
        items: [
          {
            id: "stocks-vs-crypto",
            title: "Stocks vs Crypto: what’s the difference?",
            tags: ["basics", "risk"],
            body: [
              "Stocks represent ownership in a company. Crypto assets are digital tokens; some are networks (e.g., ETH), some are designed as money (e.g., BTC), and many are speculative.",
              "Stocks generally have clearer fundamentals (revenue, profit, cash flow). Crypto fundamentals depend on network utility, adoption, fees, tokenomics, and risk.",
              "Crypto is generally more volatile and can be impacted by exchange risk, protocol risk, and regulatory risk.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "market-cap",
            title: "Market cap explained (and why it matters)",
            tags: ["basics"],
            body: [
              "Market cap = price × supply. It’s a size indicator, not a guarantee of safety.",
              "Two assets can have the same price but vastly different market caps due to supply differences.",
              "In portfolio context, market cap often correlates with liquidity and volatility, but it’s not a rule.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "diversification",
            title: "Diversification: what it actually means",
            tags: ["basics", "portfolio"],
            body: [
              "Diversification is reducing exposure to a single failure mode by holding assets that don’t move identically.",
              "A portfolio of 10 tech stocks is not very diversified, even if it has 10 tickers.",
              "Use allocation % and concentration (top holding share) as quick diagnostics.",
            ],
            updatedAt: "2026-02-01",
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
              "Profit/Loss = Market value − cost basis.",
              "Your dashboard is market-based, with a fallback to avgBuyPrice when LatestPrice is missing.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "total-return-pct",
            title: "Total Return % (why it replaces IRR in this app)",
            tags: ["kpi", "portfolio"],
            body: [
              "True IRR/XIRR requires dated cash flows (deposits, withdrawals, buys, sells).",
              "This app currently tracks holdings + avg buy price, not cash flow events.",
              "So we use Total Return % = Total Profit ÷ Total Invested × 100. It’s honest and correct for the available data.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "profit",
            title: "Profit: realized vs unrealized",
            tags: ["kpi"],
            body: [
              "Unrealized profit is the gain/loss on assets you still hold.",
              "Realized profit occurs when you sell.",
              "This tracker currently shows position-level profit from latest prices (mostly unrealized unless you model sells).",
            ],
            updatedAt: "2026-02-01",
          },
        ],
      },

      {
        id: "data",
        title: "Data & Pricing",
        items: [
          {
            id: "batch-refresh",
            title: "Why we use a daily batch refresh (24h)",
            tags: ["data", "prices"],
            body: [
              "Per-request price APIs are fragile: rate limits, network failures, and inconsistent performance.",
              "This app uses scheduled batch ingestion once every 24 hours to update PriceHistory (charts) and LatestPrice (valuation).",
              "Only assets that users actually hold are refreshed (distinct assetRefId from Holdings).",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "latestprice-vs-history",
            title: "LatestPrice vs PriceHistory (what’s the difference?)",
            tags: ["data", "prices"],
            body: [
              "LatestPrice is a single document per asset: the most recent price (used for valuations).",
              "PriceHistory stores daily points for charts (time series).",
              "Your dashboard valuations read LatestPrice first, fallback to avgBuyPrice if missing.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "asset-provider-ids",
            title: "Asset provider IDs (stooqSymbol / yahooSymbol)",
            tags: ["data", "assets", "troubleshooting"],
            body: [
              "Stocks require providerIds.stooqSymbol like aapl.us.",
              "Crypto requires providerIds.yahooSymbol like BTC-USD.",
              "If these are missing, refresh may fail and Market Price may show N/A.",
            ],
            updatedAt: "2026-02-01",
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
            tags: ["prices", "troubleshooting"],
            body: [
              "If LatestPrice is missing, it usually means the nightly refresh hasn’t ingested that asset yet.",
              "Crypto: ensure providerIds.yahooSymbol exists and is valid.",
              "Stocks: ensure providerIds.stooqSymbol exists and is valid.",
              "The app falls back to avgBuyPrice so valuation still works.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "currency-setting",
            title: "Currency changed but values didn’t convert",
            tags: ["settings", "troubleshooting"],
            body: [
              "Your currency setting currently changes formatting (€, $, £).",
              "It does not perform FX conversion. Conversion needs exchange rates and a base/display currency model.",
              "If you want FX conversion next: add an FXRates collection and convert at display-time.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "cookies-auth",
            title: "Login issues (cookie-based auth)",
            tags: ["security", "troubleshooting"],
            body: [
              "Cookies must be sent with requests: fetch must set credentials: 'include'.",
              "CORS must allow credentials and must include PUT if you use PUT endpoints.",
              "In production you may need Secure + SameSite=None depending on domain setup.",
            ],
            updatedAt: "2026-02-01",
          },
        ],
      },

      {
        id: "income",
        title: "Income",
        items: [
          {
            id: "dividends",
            title: "Dividends: what to track",
            tags: ["income"],
            body: [
              "Record the date, amount, and symbol (and optionally whether it was reinvested).",
              "For yield, you need either portfolio value over time or dividend totals vs invested capital.",
              "This app can compute simple trailing 12-month income once entries are stored.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "staking",
            title: "Staking: common pitfalls",
            tags: ["income", "crypto"],
            body: [
              "Staking yield can change rapidly and may be paid in the token (not fiat).",
              "For consistent reporting, store the reward amount and the valuation currency used at the time.",
              "Network/platform matters: some rewards are custodial (exchange), others are on-chain.",
            ],
            updatedAt: "2026-02-01",
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
              "Stocks: Stooq daily data (batch ingested).",
              "Crypto: Yahoo Finance symbols (e.g., BTC-USD), batch ingested.",
              "This reduces rate-limit problems and improves reliability.",
            ],
            updatedAt: "2026-02-01",
          },
          {
            id: "security",
            title: "Is my account secure?",
            tags: ["faq", "security"],
            body: [
              "Cookie-based sessions reduce token exposure in JS when using HttpOnly cookies.",
              "Use strong passwords and enable HTTPS in production.",
              "Reset password is available inside Settings (authenticated change password).",
            ],
            updatedAt: "2026-02-01",
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

  // Build a flat index for global search
  const index = useMemo(() => {
    const rows = [];
    for (const c of content) {
      for (const item of c.items) {
        const haystack =
          normalize(item.title) +
          " " +
          normalize(item.tags?.join(" ")) +
          " " +
          normalize(item.body?.join(" "));
        rows.push({
          ...item,
          categoryId: c.id,
          categoryTitle: c.title,
          haystack,
        });
      }
    }
    return rows;
  }, [content]);

  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || "");
  const [q, setQ] = useState("");

  // Enhanced search controls
  const [scope, setScope] = useState("topic"); // "topic" | "all"
  const [sort, setSort] = useState("relevance"); // relevance | title | newest
  const [activeTag, setActiveTag] = useState("all");

  const activeCategory = useMemo(
    () => content.find((c) => c.id === activeCategoryId) || content[0],
    [content, activeCategoryId]
  );

  const availableTags = useMemo(() => {
    const items = scope === "all" ? index : (activeCategory?.items || []);
    const set = new Set();
    for (const it of items) (it.tags || []).forEach((t) => set.add(t));
    return ["all", ...Array.from(set).sort()];
  }, [scope, index, activeCategory]);

  function score(item, query) {
    // simple relevance scoring:
    // title match > tag match > body match
    if (!query) return 0;
    const t = normalize(item.title);
    const tags = normalize((item.tags || []).join(" "));
    const body = normalize((item.body || []).join(" "));
    const qn = normalize(query);

    let s = 0;
    if (t.includes(qn)) s += 5;
    if (tags.includes(qn)) s += 3;
    if (body.includes(qn)) s += 1;
    return s;
  }

  const results = useMemo(() => {
    const query = normalize(q);

    const base =
      scope === "all"
        ? index
        : index.filter((r) => r.categoryId === activeCategoryId);

    let rows = base;

    if (activeTag !== "all") {
      rows = rows.filter((r) => (r.tags || []).includes(activeTag));
    }

    if (query) {
      rows = rows.filter((r) => r.haystack.includes(query));
    }

    // Sorting
    if (sort === "title") {
      rows = [...rows].sort((a, b) => String(a.title).localeCompare(String(b.title)));
    } else if (sort === "newest") {
      rows = [...rows].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    } else {
      // relevance
      rows = [...rows].sort((a, b) => score(b, query) - score(a, query));
    }

    return rows;
  }, [q, scope, sort, activeTag, index, activeCategoryId]);

  const popular = useMemo(() => {
    // quick tiles to steer users to the important parts of your app
    const picks = ["batch-refresh", "latestprice-vs-history", "total-return-pct", "asset-provider-ids", "cookies-auth"];
    return index.filter((x) => picks.includes(x.id));
  }, [index]);

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
                      if (scope === "topic") setQ("");
                      setActiveTag("all");
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
              <Stack gap={3}>
                <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
                  <Box>
                    <Text fontWeight="semibold">
                      {scope === "all" ? "All Topics" : activeCategory?.title || "Articles"}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Search {scope === "all" ? "across the knowledge base" : "within this topic"}.
                    </Text>
                  </Box>

                  <Box minW={{ base: "100%", md: "360px" }}>
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search keywords, tags, errors…"
                    />
                  </Box>
                </HStack>

                
              </Stack>
            </Card>

            <Card p={0}>
              <Box px={4} py={3}>
                <Text fontSize="sm" color="fg.muted">
                  {results.length} result(s)
                </Text>
              </Box>
              <Separator />

              <Accordion.Root multiple>
                {results.map((item) => (
                  <Accordion.Item key={item.id} value={item.id}>
                    <Accordion.ItemTrigger px={4} py={3}>
                      <Stack w="full" gap={1}>
                        <HStack justify="space-between" w="full" gap={3}>
                          <Text fontWeight="semibold">
                            {highlight(item.title, q)}
                          </Text>

                          <HStack gap={2} flexWrap="wrap" justify="flex-end">
                            <Badge variant="outline">
                              {item.categoryTitle}
                            </Badge>
                            {(item.tags || []).slice(0, 3).map((t) => (
                              <Badge key={t} variant="outline">
                                {t}
                              </Badge>
                            ))}
                          </HStack>
                        </HStack>

                        <Text fontSize="sm" color="fg.muted">
                          {highlight(makeSnippet(item.body, q), q)}
                        </Text>
                      </Stack>
                    </Accordion.ItemTrigger>

                    <Accordion.ItemContent px={4} pb={4}>
                      <Stack gap={3}>
                        {(item.body || []).map((p, idx) => (
                          <Text key={idx} color="fg.muted">
                            {p}
                          </Text>
                        ))}

                        <Separator />

                        <HStack justify="space-between" flexWrap="wrap" gap={3}>
                          <Text fontSize="xs" color="fg.muted">
                            Last updated: {item.updatedAt || "—"}
                          </Text>
                        </HStack>
                      </Stack>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                ))}
              </Accordion.Root>

              {results.length === 0 ? (
                <Box px={4} py={10} textAlign="center" color="fg.muted">
                  No results{q ? ` for “${q}”` : ""}.
                </Box>
              ) : null}
            </Card>
          </Stack>
        </Box>
      </Stack>
    </AppShell>
  );
}
