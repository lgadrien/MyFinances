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

function getTrendLabel(changePercent: number): {
  label: string;
  variant: "success" | "danger" | "warning";
} {
  if (changePercent < -2) {
    return { label: "KRACH / SOLDES 🔥", variant: "danger" };
  }
  if (changePercent < 0) {
    return { label: "Correction 🔻", variant: "warning" };
  }
  return { label: "Vert 🟢", variant: "success" };
}

type SortKey = "name" | "sector" | "price" | "changePercent";
type SortDir = "asc" | "desc" | null;

export default function MarchePage() {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"Tous" | MarketCategory>(
    "Tous",
  );
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // New search state
  const [searchResults, setSearchResults] = useState<
    { ticker: string; name: string; exchange: string; type: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    const favs = await fetchFavorites();
    setFavorites(favs);
  }

  async function handleToggleFavorite(e: React.MouseEvent, ticker: string) {
    e.stopPropagation();

    // Check if currently favorite
    const isFav = favorites.includes(ticker);

    // Optimistic update
    const newFavorites = isFav
      ? favorites.filter((f) => f !== ticker)
      : [...favorites, ticker];
    setFavorites(newFavorites);

    // Async DB update
    try {
      if (isFav) {
        await removeFavorite(ticker);
      } else {
        await addFavorite(ticker);
      }
    } catch (e) {
      console.error("Failed to update favorite", e);
      // Revert if failed
      setFavorites(favorites);
    }
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
          (r: any) => !existingTickers.has(r.ticker),
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

    setRows((prev) => [newRow, ...prev]);
    setSearch("");
    setSearchResults([]);
    setSelectedTicker(item.ticker);

    // Fetch price immediately
    try {
      const priceData = await fetchStockPrice(item.ticker);
      setRows((prev) =>
        prev.map((r) =>
          r.ticker === item.ticker
            ? {
                ...r,
                price: priceData?.price || 0,
                change: priceData?.change || 0,
                changePercent: priceData?.changePercent || 0,
                loaded: true,
              }
            : r,
        ),
      );
    } catch (e) {
      console.error("Failed to fetch price for new ticker", e);
    }
  }

  useEffect(() => {
    loadMarketData();
  }, []);

  async function loadMarketData() {
    setLoading(true);

    // Get owned tickers from Supabase transactions
    const transactions = await fetchTransactions();
    const ownedTickers = new Set(
      transactions.filter((t) => t.type === "Achat").map((t) => t.ticker),
    );

    // Initialize all rows from static list
    const initialRows: MarketRow[] = FRENCH_INSTRUMENTS.map((inst) => ({
      ticker: inst.ticker,
      name: inst.name,
      sector: inst.sector,
      category: inst.category,
      price: 0,
      change: 0,
      changePercent: 0,
      owned: ownedTickers.has(inst.ticker),
      loaded: false,
    }));

    setRows(initialRows);
    setLoading(false);

    // Fetch prices in batches of 5 (Alpha Vantage rate limit) - kept for existing logic, now using Yahoo so limit is less of an issue but good for batching
    for (let i = 0; i < initialRows.length; i += 5) {
      const batch = initialRows.slice(i, i + 5);
      const pricePromises = batch.map((r) => fetchStockPrice(r.ticker));
      const prices = await Promise.all(pricePromises);

      setRows((prev) =>
        prev.map((row) => {
          const batchIdx = batch.findIndex((b) => b.ticker === row.ticker);
          if (batchIdx === -1) return row;
          const priceData = prices[batchIdx];
          if (!priceData) return { ...row, loaded: true };
          return {
            ...row,
            price: priceData.price,
            change: priceData.change,
            changePercent: priceData.changePercent,
            loaded: true,
          };
        }),
      );

      // Small delay between batches to respect rate limits
      if (i + 5 < initialRows.length) {
        await new Promise((r) => setTimeout(r, 100)); // Reduced delay since Yahoo is faster
      }
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
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
      return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-600" />;
    }
    if (sortDir === "asc") {
      return <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />;
    }
    return <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Marché
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Watchlist & cotations en temps réel — {counts.actions} actions,{" "}
            {counts.indices} indices
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/50 hover:text-white disabled:opacity-50"
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
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/50 p-1">
          <button
            onClick={() => setCategoryFilter("Tous")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              categoryFilter === "Tous"
                ? "bg-slate-700/60 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tous
            <span className="rounded-full bg-slate-600/40 px-2 py-0.5 text-xs">
              {counts.all}
            </span>
          </button>
          <button
            onClick={() => setCategoryFilter("Action")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              categoryFilter === "Action"
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Actions
            <span className="rounded-full bg-slate-600/40 px-2 py-0.5 text-xs">
              {counts.actions}
            </span>
          </button>
          <button
            onClick={() => setCategoryFilter("Indice")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              categoryFilter === "Indice"
                ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Indices
            <span className="rounded-full bg-slate-600/40 px-2 py-0.5 text-xs">
              {counts.indices}
            </span>
          </button>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              showFavorites
                ? "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${showFavorites ? "fill-yellow-400" : ""}`}
            />
            Favoris
            <span className="rounded-full bg-slate-600/40 px-2 py-0.5 text-xs">
              {favorites.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-0 sm:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, ticker ou secteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full rounded-xl border border-slate-800/50 bg-slate-900/50 py-2.5 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
          />

          {/* Search Results Dropdown */}
          {searchFocused &&
            (search.length >= 2 || searchResults.length > 0) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Recherche en cours...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    <div className="bg-slate-800/50 px-3 py-2 text-xs font-semibold text-slate-400">
                      Ajouter à la liste
                    </div>
                    {searchResults.map((result) => (
                      <button
                        key={result.ticker}
                        onClick={() => handleAddTicker(result)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {result.ticker}
                            </p>
                            <p className="text-xs text-slate-400">
                              {result.name}
                            </p>
                          </div>
                          <Badge variant="neutral">{result.exchange}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : search.length >= 2 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th
                onClick={() => handleSort("name")}
                className="cursor-pointer select-none px-6 py-4 text-left font-semibold text-slate-400 transition-colors hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  Action / Indice
                  <SortIcon column="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort("sector")}
                className="cursor-pointer select-none px-6 py-4 text-left font-semibold text-slate-400 transition-colors hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  Secteur
                  <SortIcon column="sector" />
                </div>
              </th>
              <th
                onClick={() => handleSort("price")}
                className="cursor-pointer select-none px-6 py-4 text-right font-semibold text-slate-400 transition-colors hover:text-slate-200"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Prix Live
                  <SortIcon column="price" />
                </div>
              </th>
              <th
                onClick={() => handleSort("changePercent")}
                className="cursor-pointer select-none px-6 py-4 text-right font-semibold text-slate-400 transition-colors hover:text-slate-200"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Var (24h)
                  <SortIcon column="changePercent" />
                </div>
              </th>
              <th className="px-6 py-4 text-center font-semibold text-slate-400">
                <Star className="mx-auto h-4 w-4" />
              </th>
              <th className="px-6 py-4 text-center font-semibold text-slate-400">
                Tendance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-5">
                      <div className="h-4 animate-pulse rounded bg-slate-800" />
                    </td>
                  </tr>
                ))
              : filteredAndSorted.map((row) => {
                  const trend = getTrendLabel(row.changePercent);
                  const isIndex = row.category === "Indice";
                  return (
                    <tr
                      key={row.ticker}
                      onClick={() =>
                        setSelectedTicker(
                          selectedTicker === row.ticker ? null : row.ticker,
                        )
                      }
                      className={`group cursor-pointer transition-colors hover:bg-slate-800/30 ${
                        selectedTicker === row.ticker
                          ? "bg-slate-800/40 ring-1 ring-inset ring-emerald-500/20"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                              isIndex
                                ? "from-blue-500/20 to-blue-600/10"
                                : "from-slate-700/50 to-slate-800/50"
                            }`}
                          >
                            {isIndex ? (
                              <BarChart3 className="h-4 w-4 text-blue-400" />
                            ) : row.changePercent >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {row.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-slate-500">
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
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {row.sector}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.loaded ? (
                          row.price > 0 ? (
                            <span className="font-semibold text-white">
                              {row.price.toFixed(2)} €
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )
                        ) : (
                          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-700" />
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
                                    : "text-red-400"
                                }`}
                              >
                                {row.changePercent >= 0 ? "+" : ""}
                                {row.change.toFixed(2)} €
                              </span>
                              <br />
                              <span
                                className={`text-xs ${
                                  row.changePercent >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                                }`}
                              >
                                {row.changePercent >= 0 ? "+" : ""}
                                {row.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )
                        ) : (
                          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-700" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => handleToggleFavorite(e, row.ticker)}
                          className="group/star mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-yellow-500/10"
                          title={
                            favorites.includes(row.ticker)
                              ? "Retirer des favoris"
                              : "Ajouter aux favoris"
                          }
                        >
                          <Star
                            className={`h-4 w-4 transition-colors ${
                              favorites.includes(row.ticker)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-600 group-hover/star:text-yellow-400"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.loaded && row.price > 0 ? (
                          <Badge variant={trend.variant}>{trend.label}</Badge>
                        ) : row.loaded ? (
                          <span className="text-xs text-slate-600">—</span>
                        ) : (
                          <div className="mx-auto h-4 w-16 animate-pulse rounded bg-slate-700" />
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
