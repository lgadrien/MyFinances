"use client";

import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  BarChart3,
  Briefcase,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Star,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import StockChart from "@/components/StockChart";
import {
  fetchTransactions,
  fetchStockPrice,
  fetchFavorites,
  addFavorite,
  removeFavorite,
} from "@/lib/data";
import {
  FRENCH_INSTRUMENTS,
  type MarketCategory,
} from "@/lib/french-instruments";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SIGNAL_CONFIG, type TrendSignal } from "@/lib/technical-analysis";

interface MarketRow {
  ticker: string;
  name: string;
  sector: string;
  category: MarketCategory;
  price: number;
  change: number;
  changePercent: number;
  owned: boolean;
  loaded: boolean;
}

/** Tendance rapide basée sur la variation du jour (fallback sans historique). */
function getTrendSignalFromChange(changePercent: number): TrendSignal {
  if (changePercent <= -3) return "STRONG_SELL";
  if (changePercent < -0.5) return "SELL";
  if (changePercent >= 3) return "STRONG_BUY";
  if (changePercent > 0.5) return "BUY";
  return "NEUTRAL";
}

type SortKey = "name" | "sector" | "price" | "changePercent";
type SortDir = "asc" | "desc" | null;

const formatEUR = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + " €";

export default function MarchePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"Tous" | MarketCategory>(
    "Tous",
  );
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // Tanstack Query - Load Favorites
  const { data: serverFavorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  // Sync favorites state
  useEffect(() => {
    setFavorites(serverFavorites);
  }, [serverFavorites]);

  // Tanstack Query - Load Transactions (to know owned status)
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });

  const ownedTickers = useMemo(() => {
    return new Set(
      transactions
        .filter((t: { type: string; ticker: string }) => t.type === "Achat")
        .map((t: { type: string; ticker: string }) => t.ticker),
    );
  }, [transactions]);

  // Initialize all base rows from static list + favs + owned
  const baseRows = useMemo(() => {
    const list = [...FRENCH_INSTRUMENTS];
    const rowsMap = new Map();

    list.forEach((inst) => {
      rowsMap.set(inst.ticker, {
        ticker: inst.ticker,
        name: inst.name,
        sector: inst.sector,
        category: inst.category,
        price: 0,
        change: 0,
        changePercent: 0,
        owned: ownedTickers.has(inst.ticker),
        loaded: false,
      });
    });

    // Inject favorites
    serverFavorites.forEach((ticker) => {
      if (!rowsMap.has(ticker)) {
        rowsMap.set(ticker, {
          ticker,
          name: ticker, // We don't have the real name yet, fallback to ticker
          sector: "Autre",
          category: "Action",
          price: 0,
          change: 0,
          changePercent: 0,
          owned: ownedTickers.has(ticker),
          loaded: false,
        });
      }
    });

    // Inject owned tickers
    ownedTickers.forEach((ticker) => {
      if (!rowsMap.has(ticker)) {
        rowsMap.set(ticker, {
          ticker,
          name: ticker,
          sector: "Autre",
          category: "Action",
          price: 0,
          change: 0,
          changePercent: 0,
          owned: true,
          loaded: false,
        });
      }
    });

    return Array.from(rowsMap.values());
  }, [ownedTickers, serverFavorites]);

  // Dynamic Row State because search can add items
  const [dynamicRows, setDynamicRows] = useState<MarketRow[]>([]);
  const allRows = useMemo(() => {
    // Merge dynamicRows (added from search) with baseRows
    const baseMap = new Map(baseRows.map((r) => [r.ticker, r]));
    dynamicRows.forEach((r) => {
      if (!baseMap.has(r.ticker)) {
        r.owned = ownedTickers.has(r.ticker);
        baseMap.set(r.ticker, r);
      }
    });
    return Array.from(baseMap.values());
  }, [baseRows, dynamicRows, ownedTickers]);

  // Tanstack Query - Prices
  const {
    data: pricesMap = new Map(),
    isLoading: loading,
    isRefetching: refreshing,
  } = useQuery({
    queryKey: ["market-prices", allRows.map((r) => r.ticker).join(",")],
    queryFn: async () => {
      const map = new Map();

      // Batch fetches
      for (let i = 0; i < allRows.length; i += 5) {
        const batch = allRows.slice(i, i + 5);
        const pricePromises = batch.map((r) => fetchStockPrice(r.ticker));
        const pricesData = await Promise.all(pricePromises);

        batch.forEach((r, idx) => {
          if (pricesData[idx]) {
            map.set(r.ticker, pricesData[idx]);
          }
        });
      }
      return map;
    },
    // Rafraîchissement en arrière-plan toutes les 60s
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Calculate merged rows with prices
  const rows = useMemo(() => {
    return allRows.map((r) => {
      const p = pricesMap.get(r.ticker);
      if (p) {
        return {
          ...r,
          price: p.price,
          change: p.change,
          changePercent: p.changePercent,
          loaded: true,
        };
      }
      return r;
    });
  }, [allRows, pricesMap]);

  // New search state
  interface TickerResult {
    ticker: string;
    name: string;
    exchange: string;
    type: string;
  }

  const [searchResults, setSearchResults] = useState<TickerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleFavMutation = useMutation({
    mutationFn: async ({
      ticker,
      isFav,
    }: {
      ticker: string;
      isFav: boolean;
    }) => {
      if (isFav) return removeFavorite(ticker);
      return addFavorite(ticker);
    },
    onMutate: async ({ ticker, isFav }) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const previous = queryClient.getQueryData<string[]>(["favorites"]);
      queryClient.setQueryData<string[]>(["favorites"], (old = []) =>
        isFav ? old.filter((f) => f !== ticker) : [...old, ticker],
      );
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["favorites"], context.previous);
      }
    },
  });

  async function handleToggleFavorite(e: React.MouseEvent, ticker: string) {
    e.stopPropagation();
    const isFav = favorites.includes(ticker);
    toggleFavMutation.mutate({ ticker, isFav });
  }

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/stock/search?q=${encodeURIComponent(search)}`,
        );
        const data = await res.json();
        // Filter out tickers already in the list
        const existingTickers = new Set(rows.map((r) => r.ticker));
        const newResults = (data.results || []).filter(
          (r: TickerResult) => !existingTickers.has(r.ticker),
        );
        setSearchResults(newResults);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, rows]);

  async function handleAddTicker(item: {
    ticker: string;
    name: string;
    type: string;
  }) {
    // Add to rows immediately
    const newRow: MarketRow = {
      ticker: item.ticker,
      name: item.name,
      sector: "Autre", // Default sector
      category: item.type === "INDEX" ? "Indice" : "Action",
      price: 0,
      change: 0,
      changePercent: 0,
      owned: false,
      loaded: false,
    };

    setDynamicRows((prev) => [newRow, ...prev]);
    setSearch("");
    setSearchResults([]);
    setSelectedTicker(item.ticker);
  }

  async function handleRefresh() {
    await queryClient.invalidateQueries({ queryKey: ["market-prices"] });
  }

  const filteredAndSorted = useMemo(() => {
    let result = rows.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.ticker.toLowerCase().includes(search.toLowerCase()) ||
        r.sector.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "Tous" || r.category === categoryFilter;
      const matchesFavorites = !showFavorites || favorites.includes(r.ticker);
      return matchesSearch && matchesCategory && matchesFavorites;
    });

    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
          case "name":
            cmp = a.name.localeCompare(b.name, "fr");
            break;
          case "sector":
            cmp = a.sector.localeCompare(b.sector, "fr");
            break;
          case "price":
            cmp = a.price - b.price;
            break;
          case "changePercent":
            cmp = a.changePercent - b.changePercent;
            break;
        }
        return sortDir === "desc" ? -cmp : cmp;
      });
    }

    return result;
  }, [
    rows,
    search,
    categoryFilter,
    sortKey,
    sortDir,
    showFavorites,
    favorites,
  ]);

  const counts = {
    all: rows.length,
    actions: rows.filter((r) => r.category === "Action").length,
    indices: rows.filter((r) => r.category === "Indice").length,
  };

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) {
      return <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-600" />;
    }
    if (sortDir === "asc") {
      return <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />;
    }
    return <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />;
  }

  return (
    <div className="animate-fade-in max-w-full space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Marché
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Watchlist & cotations en temps réel — {counts.actions} actions,{" "}
            {counts.indices} indices
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-700/50 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      {/* Category Filters + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-900/50 p-1">
          <button
            onClick={() => setCategoryFilter("Tous")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              categoryFilter === "Tous"
                ? "bg-zinc-700/60 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tous
            <span className="rounded-full bg-zinc-600/40 px-2 py-0.5 text-xs">
              {counts.all}
            </span>
          </button>
          <button
            onClick={() => setCategoryFilter("Action")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              categoryFilter === "Action"
                ? "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Actions
            <span className="rounded-full bg-zinc-600/40 px-2 py-0.5 text-xs">
              {counts.actions}
            </span>
          </button>
          <button
            onClick={() => setCategoryFilter("Indice")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              categoryFilter === "Indice"
                ? "bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Indices
            <span className="rounded-full bg-zinc-600/40 px-2 py-0.5 text-xs">
              {counts.indices}
            </span>
          </button>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              showFavorites
                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${showFavorites ? "fill-amber-400" : ""}`}
            />
            Favoris
            <span className="rounded-full bg-zinc-600/40 px-2 py-0.5 text-xs">
              {favorites.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-0 sm:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, ticker ou secteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full rounded-xl border border-zinc-800/50 bg-zinc-900/50 py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          />

          {/* Search Results Dropdown */}
          {searchFocused &&
            (search.length >= 2 || searchResults.length > 0) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    Recherche en cours...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-zinc-800">
                    <div className="bg-zinc-800/50 px-3 py-2 text-xs font-semibold text-zinc-400">
                      Ajouter à la liste
                    </div>
                    {searchResults.map((result) => (
                      <button
                        key={result.ticker}
                        onClick={() => handleAddTicker(result)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-zinc-800"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {result.ticker}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {result.name}
                            </p>
                          </div>
                          <Badge variant="neutral">{result.exchange}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : search.length >= 2 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    Aucun résultat trouvé sur les marchés
                  </div>
                ) : null}
              </div>
            )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-500">
        {filteredAndSorted.length} résultat(s)
      </p>

      {/* Stock Chart Panel */}
      {selectedTicker &&
        (() => {
          const instrument = rows.find((r) => r.ticker === selectedTicker);
          return instrument ? (
            <StockChart
              ticker={instrument.ticker}
              name={instrument.name}
              onClose={() => setSelectedTicker(null)}
            />
          ) : null;
        })()}
      {/* Market Data */}

      {/* Mobile Feed */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 w-full animate-pulse rounded-2xl bg-zinc-900"
              />
            ))
          : filteredAndSorted.map((row) => {
              const isIndex = row.category === "Indice";
              return (
                <div
                  key={row.ticker}
                  onClick={() =>
                    setSelectedTicker(
                      selectedTicker === row.ticker ? null : row.ticker,
                    )
                  }
                  className={`relative rounded-2xl border bg-zinc-900/50 p-4 shadow-sm backdrop-blur-sm transition-all active:scale-[0.98] ${
                    selectedTicker === row.ticker
                      ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                      : "border-zinc-800"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                          isIndex
                            ? "from-blue-500/20 to-blue-600/10"
                            : "from-zinc-700/50 to-zinc-800/50"
                        }`}
                      >
                        {isIndex ? (
                          <BarChart3 className="h-5 w-5 text-blue-400" />
                        ) : row.changePercent >= 0 ? (
                          <TrendingUp className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <p className="max-w-[140px] truncate font-bold text-white">
                          {row.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-zinc-500">{row.ticker}</p>
                          {isIndex && (
                            <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                              INDICE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        {row.price > 0 ? formatPrice(row.price) : "—"}
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          row.changePercent >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {row.changePercent >= 0 ? "+" : ""}
                        {row.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3">
                    <span className="text-xs text-zinc-500">{row.sector}</span>
                    <button
                      onClick={(e) => handleToggleFavorite(e, row.ticker)}
                      className="p-1"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          favorites.includes(row.ticker)
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-600"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black backdrop-blur-sm md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th
                onClick={() => handleSort("name")}
                className="cursor-pointer select-none px-6 py-4 text-left font-semibold text-zinc-400 transition-colors hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Action / Indice
                  <SortIcon column="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort("sector")}
                className="cursor-pointer select-none px-6 py-4 text-left font-semibold text-zinc-400 transition-colors hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Secteur
                  <SortIcon column="sector" />
                </div>
              </th>
              <th
                onClick={() => handleSort("price")}
                className="cursor-pointer select-none px-6 py-4 text-right font-semibold text-zinc-400 transition-colors hover:text-white"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Prix Live
                  <SortIcon column="price" />
                </div>
              </th>
              <th
                onClick={() => handleSort("changePercent")}
                className="cursor-pointer select-none px-6 py-4 text-right font-semibold text-zinc-400 transition-colors hover:text-white"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Var (24h)
                  <SortIcon column="changePercent" />
                </div>
              </th>
              <th className="px-6 py-4 text-center font-semibold text-zinc-400">
                <Star className="mx-auto h-4 w-4" />
              </th>
              <th className="px-6 py-4 text-center font-semibold text-zinc-400">
                Tendance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-5">
                      <div className="h-4 animate-pulse rounded bg-zinc-800" />
                    </td>
                  </tr>
                ))
              : filteredAndSorted.map((row) => {
                  const trendSignal = getTrendSignalFromChange(
                    row.changePercent,
                  );
                  const trendCfg = SIGNAL_CONFIG[trendSignal];
                  const isIndex = row.category === "Indice";
                  return (
                    <tr
                      key={row.ticker}
                      onClick={() =>
                        setSelectedTicker(
                          selectedTicker === row.ticker ? null : row.ticker,
                        )
                      }
                      className={`group cursor-pointer transition-colors hover:bg-zinc-800/30 ${
                        selectedTicker === row.ticker
                          ? "bg-zinc-800/40 ring-1 ring-inset ring-emerald-500/20"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                              isIndex
                                ? "from-blue-500/20 to-blue-600/10"
                                : "from-zinc-700/50 to-zinc-800/50"
                            }`}
                          >
                            {isIndex ? (
                              <BarChart3 className="h-4 w-4 text-blue-400" />
                            ) : row.changePercent >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-rose-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {row.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-zinc-500">
                                {row.ticker}
                              </p>
                              {isIndex && (
                                <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                                  INDICE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {row.sector}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.loaded ? (
                          row.price > 0 ? (
                            <span className="font-semibold text-white">
                              {formatPrice(row.price)}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )
                        ) : (
                          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-zinc-700" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.loaded ? (
                          row.price > 0 ? (
                            <div>
                              <span
                                className={`font-semibold ${
                                  row.changePercent >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {row.changePercent >= 0 ? "+" : ""}
                                {formatEUR(row.change)}
                              </span>
                              <br />
                              <span
                                className={`text-xs ${
                                  row.changePercent >= 0
                                    ? "text-emerald-500"
                                    : "text-rose-500"
                                }`}
                              >
                                {row.changePercent >= 0 ? "+" : ""}
                                {row.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )
                        ) : (
                          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-zinc-700" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => handleToggleFavorite(e, row.ticker)}
                          className="group/star mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-amber-500/10"
                          title={
                            favorites.includes(row.ticker)
                              ? "Retirer des favoris"
                              : "Ajouter aux favoris"
                          }
                        >
                          <Star
                            className={`h-4 w-4 transition-colors ${
                              favorites.includes(row.ticker)
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-600 group-hover/star:text-amber-400"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.loaded && row.price > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${trendCfg.bgColor} ${trendCfg.color}`}
                          >
                            {trendCfg.emoji} {trendCfg.label}
                          </span>
                        ) : row.loaded ? (
                          <span className="text-xs text-zinc-600">—</span>
                        ) : (
                          <div className="mx-auto h-4 w-16 animate-pulse rounded bg-zinc-700" />
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
