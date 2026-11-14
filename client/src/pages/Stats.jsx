import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api/stats.js';

// Color map for horizontal bar fills
const COLOR_HEX_MAP = {
  black: '#0f172a',
  white: '#f8fafc',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  pink: '#ec4899',
  purple: '#a855f7',
  orange: '#f97316',
  brown: '#78350f',
  grey: '#6b7280',
  gray: '#6b7280',
  beige: '#e2d5c3',
  navy: '#1e3a8a',
  maroon: '#800000',
  cream: '#fffdd0',
  olive: '#556b2f',
  teal: '#0d9488',
  lavender: '#e6e6fa',
  tan: '#d2b48c',
  khaki: '#c3b091',
  coral: '#ff7f50',
  gold: '#ffd700',
  silver: '#c0c0c0',
  charcoal: '#333333',
  burgundy: '#800020',
};

// Fallback category emojis
const CATEGORY_EMOJI = {
  top: '👕',
  bottom: '👖',
  dress: '👗',
  ethnic: '🥻',
  outerwear: '🧥',
  shoes: '👟',
  accessory: '👜',
};

// Season emojis
const SEASON_EMOJI = {
  summer: '☀️',
  winter: '❄️',
  monsoon: '🌧️',
  'all-season': '🔄',
};

// Occasion emojis
const OCCASION_EMOJI = {
  casual: '☕',
  formal: '👔',
  party: '🎉',
  work: '💼',
  festive: '✨',
  sports: '🏃',
};

/**
 * Format currency with Rupee symbol and Indian digit grouping (e.g. ₹12,499)
 */
function formatRupee(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const rounded = Math.round(amount);
  return `₹${new Intl.NumberFormat('en-IN').format(rounded)}`;
}

/**
 * Capitalizes string nicely
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats YYYY-MM-DD date string to compact readable format (e.g. "Nov 14")
 */
function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Resolves color fill style and border
 */
function getColorBarFill(colorName) {
  if (!colorName) return { bg: '#64748b', isLight: false };
  const normalized = colorName.toLowerCase().trim();

  // Exact match
  if (COLOR_HEX_MAP[normalized]) {
    const hex = COLOR_HEX_MAP[normalized];
    return {
      bg: hex,
      isLight: normalized === 'white' || normalized === 'cream' || normalized === 'beige',
    };
  }

  // Substring match
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key)) {
      return {
        bg: hex,
        isLight: key === 'white' || key === 'cream' || key === 'beige',
      };
    }
  }

  return { bg: '#64748b', isLight: false };
}

export default function Stats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeListTab, setActiveListTab] = useState('mostWorn');
  const [hoveredDay, setHoveredDay] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getStats();
      setData(result);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(err.message || 'Failed to load wardrobe statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Compute dynamic insight headline
  const insight = useMemo(() => {
    if (!data || !data.totals || data.totals.items === 0) {
      return null;
    }

    const { totals, colors, categories, costPerWear } = data;

    // 1. If wardrobe is 100% worn
    if (totals.items > 0 && totals.wornItems === totals.items) {
      return '🎉 Outstanding! You have worn 100% of your wardrobe at least once.';
    }

    // 2. High percentage of never worn items
    if (totals.neverWornItems > 0) {
      const neverWornPct = Math.round((totals.neverWornItems / totals.items) * 100);
      if (neverWornPct >= 40) {
        return `You haven't worn ${totals.neverWornItems} items yet (${neverWornPct}% of your wardrobe).`;
      }
    }

    // 3. Dominant color (>= 25%)
    if (colors && colors.length > 0) {
      const topColor = colors[0];
      const colorPct = Math.round((topColor.count / totals.items) * 100);
      if (colorPct >= 25) {
        return `${capitalize(topColor.color)} is ${colorPct}% of your wardrobe (${topColor.count} items).`;
      }
    }

    // 4. Dominant category (>= 35%)
    if (categories && categories.length > 0) {
      const topCat = categories[0];
      const catPct = Math.round((topCat.count / totals.items) * 100);
      if (catPct >= 35) {
        return `${capitalize(topCat.category)} makes up ${catPct}% of your total wardrobe.`;
      }
    }

    // 5. Best value highlight
    if (costPerWear?.best && costPerWear.best.length > 0) {
      const best = costPerWear.best[0];
      return `Best value: ${best.name} at ₹${best.costPerWear}/wear across ${best.wearCount} wears.`;
    }

    // 6. Generic never worn count
    if (totals.neverWornItems > 0) {
      return `You haven't worn ${totals.neverWornItems} item${totals.neverWornItems === 1 ? '' : 's'} yet.`;
    }

    return `You've logged ${totals.totalWears} wear${totals.totalWears === 1 ? '' : 's'} across ${totals.items} wardrobe items.`;
  }, [data]);

  // Max value in last 30 days for bar chart scale
  const max30DayWear = useMemo(() => {
    if (!data?.wearsLast30Days?.length) return 1;
    const max = Math.max(...data.wearsLast30Days.map((d) => d.count));
    return max > 0 ? max : 1;
  }, [data]);

  // Total wears in last 30 days
  const totalLast30Days = useMemo(() => {
    if (!data?.wearsLast30Days?.length) return 0;
    return data.wearsLast30Days.reduce((acc, d) => acc + d.count, 0);
  }, [data]);

  // -------------------------------------------------------------
  // 1. Loading Skeleton State
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-800 rounded-lg" />
            <div className="h-4 w-72 bg-slate-800/60 rounded" />
          </div>
          <div className="h-10 w-32 bg-slate-800 rounded-xl" />
        </div>

        {/* Insight Skeleton */}
        <div className="h-14 bg-slate-800/50 rounded-2xl border border-slate-700/50" />

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4 space-y-3">
              <div className="h-4 w-20 bg-slate-700/50 rounded" />
              <div className="h-8 w-16 bg-slate-700/80 rounded" />
            </div>
          ))}
        </div>

        {/* 30-day Chart Skeleton */}
        <div className="h-64 bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 space-y-4">
          <div className="h-5 w-48 bg-slate-700/50 rounded" />
          <div className="h-44 bg-slate-800/70 rounded-xl" />
        </div>

        {/* Breakdowns Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6" />
          <div className="h-80 bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. Error State
  // -------------------------------------------------------------
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl">
          ⚠️
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Unable to Load Stats
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {error}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  const {
    totals = {
      items: 0,
      outfits: 0,
      totalWears: 0,
      totalValue: 0,
      wornItems: 0,
      neverWornItems: 0,
    },
    colors = [],
    categories = [],
    seasons = [],
    occasions = [],
    mostWorn = [],
    leastWorn = [],
    costPerWear = { best: [], worst: [], unwornWithPrice: [] },
    unwornWithPrice = [],
    wearsLast30Days = [],
  } = data || {};

  // -------------------------------------------------------------
  // 3. Empty State (User has no items)
  // -------------------------------------------------------------
  if (totals.items === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/10">
          📊
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Wardrobe Analytics
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
            Your wardrobe is currently empty. Add your clothes to unlock wear analytics, cost-per-wear breakdown, and color distributions.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/wardrobe/add"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition cursor-pointer"
          >
            <span>➕</span>
            <span>Add your first item</span>
          </Link>
        </div>
      </div>
    );
  }

  // Percentage of items worn at least once
  const wornPct = totals.items > 0
    ? Math.round((totals.wornItems / totals.items) * 100)
    : 0;

  // Most worn items count ceiling for relative bars
  const maxColorCount = colors.length > 0 ? Math.max(...colors.map((c) => c.count)) : 1;
  const maxCategoryCount = categories.length > 0 ? Math.max(...categories.map((c) => c.count)) : 1;

  // Active list selection for the thumbnail lists
  const listTabs = [
    { id: 'mostWorn', label: 'Most Worn', icon: '🔥', count: mostWorn.length },
    { id: 'leastWorn', label: 'Least Worn', icon: '⏳', count: leastWorn.length },
    { id: 'bestValue', label: 'Best Value', icon: '💎', count: costPerWear.best?.length || 0 },
    { id: 'worstValue', label: 'Worst Value', icon: '⚠️', count: costPerWear.worst?.length || 0 },
    { id: 'moneyTiedUp', label: 'Money Tied Up', icon: '💰', count: unwornWithPrice.length },
  ];

  const currentListItems =
    activeListTab === 'mostWorn'
      ? mostWorn
      : activeListTab === 'leastWorn'
      ? leastWorn
      : activeListTab === 'bestValue'
      ? costPerWear.best || []
      : activeListTab === 'worstValue'
      ? costPerWear.worst || []
      : unwornWithPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-indigo-100 to-purple-300 bg-clip-text text-transparent">
            Wardrobe Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track wear frequency, cost-per-wear value, and wardrobe health
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/wardrobe"
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
          >
            Wardrobe Grid
          </Link>
          <Link
            to="/history"
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
          >
            Wear History
          </Link>
        </div>
      </div>

      {/* Dynamic Insight Banner */}
      {insight && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 p-4 sm:p-5 shadow-lg shadow-indigo-950/30 flex items-center space-x-3.5">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl text-indigo-400">
            💡
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400 block">
              Wardrobe Insight
            </span>
            <p className="text-sm sm:text-base font-medium text-slate-100 truncate sm:whitespace-normal">
              {insight}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Items */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Items
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {totals.items}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {totals.wornItems} worn • {totals.neverWornItems} unworn
          </div>
        </div>

        {/* Outfits */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Outfits
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-indigo-400">
            {totals.outfits}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Saved combinations
          </div>
        </div>

        {/* Total Wears */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Wears
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-400">
            {totals.totalWears}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Logged across all items
          </div>
        </div>

        {/* Wardrobe Value */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Wardrobe Value
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
            {formatRupee(totals.totalValue)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Estimated purchase value
          </div>
        </div>

        {/* % Worn At Least Once */}
        <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Utilization Rate
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-sky-400">
            {wornPct}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {totals.wornItems} of {totals.items} worn
          </div>
        </div>
      </div>

      {/* 30-Day Wear Activity Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>📅</span> Wears in the Last 30 Days
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily wear frequency across your wardrobe items
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="text-slate-400">
              <span className="text-slate-200 font-bold">{totalLast30Days}</span> total wears
            </div>
            <div className="text-slate-400">
              Peak: <span className="text-indigo-400 font-bold">{max30DayWear}</span>/day
            </div>
          </div>
        </div>

        {/* Hovered Date Info Pill */}
        <div className="h-6 flex items-center">
          {hoveredDay ? (
            <div className="text-xs font-medium text-slate-300 bg-slate-800/90 border border-slate-700/80 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1.5 animate-fadeIn">
              <span className="text-indigo-400">●</span>
              <span>{formatDateShort(hoveredDay.date)}:</span>
              <span className="text-white font-bold">
                {hoveredDay.count} wear{hoveredDay.count === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Hover or tap any bar to view wear counts for that day
            </span>
          )}
        </div>

        {/* Custom Div-based Bar Chart */}
        <div className="relative pt-4 pb-2">
          {/* Grid background lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-dashed border-slate-700 w-full" />
            <div className="border-b border-dashed border-slate-700 w-full" />
            <div className="border-b border-slate-700 w-full" />
          </div>

          {/* Bars Flex Container */}
          <div className="relative h-40 flex items-end justify-between gap-1 sm:gap-1.5 px-1">
            {wearsLast30Days.map((dayItem) => {
              const heightPct =
                dayItem.count > 0
                  ? Math.max(12, Math.round((dayItem.count / max30DayWear) * 100))
                  : 4; // minimum 4% baseline indicator
              const isSelected = hoveredDay?.date === dayItem.date;
              const hasWears = dayItem.count > 0;

              return (
                <div
                  key={dayItem.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  onMouseEnter={() => setHoveredDay(dayItem)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => setHoveredDay(dayItem)}
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-t from-purple-500 to-indigo-300 shadow-lg shadow-indigo-500/50 scale-y-105'
                        : hasWears
                        ? 'bg-gradient-to-t from-indigo-600 to-purple-500 group-hover:from-indigo-500 group-hover:to-purple-400'
                        : 'bg-slate-800/80 group-hover:bg-slate-700'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Date Axis Labels */}
          <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>{wearsLast30Days.length > 0 ? formatDateShort(wearsLast30Days[0].date) : '30 days ago'}</span>
            <span>{wearsLast30Days.length > 15 ? formatDateShort(wearsLast30Days[15].date) : '15 days ago'}</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Breakdowns Section (Colors & Categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>🎨</span> Color Breakdown
            </h2>
            <span className="text-xs text-slate-400">{colors.length} colors</span>
          </div>

          {colors.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No color data available</p>
          ) : (
            <div className="space-y-3">
              {colors.map((c) => {
                const { bg, isLight } = getColorBarFill(c.color);
                const pct = totals.items > 0 ? Math.round((c.count / totals.items) * 100) : 0;
                const barWidthPct = Math.max(6, Math.round((c.count / maxColorCount) * 100));

                return (
                  <div key={c.color} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            isLight ? 'border border-slate-500' : ''
                          }`}
                          style={{ backgroundColor: bg }}
                        />
                        <span className="font-medium text-slate-200 capitalize">
                          {c.color}
                        </span>
                      </div>
                      <span className="text-slate-400 font-medium">
                        {c.count} <span className="text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${barWidthPct}%`,
                          backgroundColor: bg,
                          border: isLight ? '1px solid #94a3b8' : undefined,
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>🏷️</span> Category Breakdown
            </h2>
            <span className="text-xs text-slate-400">{categories.length} categories</span>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No category data available</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => {
                const emoji = CATEGORY_EMOJI[cat.category] || '👕';
                const pct = totals.items > 0 ? Math.round((cat.count / totals.items) * 100) : 0;
                const barWidthPct = Math.max(6, Math.round((cat.count / maxCategoryCount) * 100));

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span>{emoji}</span>
                        <span className="font-medium text-slate-200 capitalize">
                          {cat.category}
                        </span>
                      </div>
                      <span className="text-slate-400 font-medium">
                        {cat.count} <span className="text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${barWidthPct}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Season & Occasion Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seasons */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>🌦️</span> Season Distribution
          </h2>
          {seasons.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No season data</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {seasons.map((s) => {
                const emoji = SEASON_EMOJI[s.season] || '🌦️';
                const pct = totals.items > 0 ? Math.round((s.count / totals.items) * 100) : 0;
                return (
                  <div
                    key={s.season}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center space-y-1"
                  >
                    <div className="text-lg">{emoji}</div>
                    <div className="text-xs font-semibold text-slate-200 capitalize">
                      {s.season}
                    </div>
                    <div className="text-sm font-bold text-indigo-400">
                      {s.count} <span className="text-xs font-normal text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Occasions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>🎯</span> Occasion Distribution
          </h2>
          {occasions.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No occasion data</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {occasions.map((o) => {
                const emoji = OCCASION_EMOJI[o.occasion] || '🎯';
                const pct = totals.items > 0 ? Math.round((o.count / totals.items) * 100) : 0;
                return (
                  <div
                    key={o.occasion}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center space-y-1"
                  >
                    <div className="text-lg">{emoji}</div>
                    <div className="text-xs font-semibold text-slate-200 capitalize">
                      {o.occasion}
                    </div>
                    <div className="text-sm font-bold text-purple-400">
                      {o.count} <span className="text-xs font-normal text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Wardrobe Lists Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span> Wardrobe Highlights & Cost Per Wear
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare your most worn favorites, low-wear pieces, and cost-per-wear value
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {listTabs.map((tab) => {
            const isActive = activeListTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveListTab(tab.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List Content */}
        {currentListItems.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-3xl text-slate-400">📭</div>
            <p className="text-sm text-slate-400">
              {activeListTab === 'mostWorn' && 'No items have been logged as worn yet.'}
              {activeListTab === 'leastWorn' && 'No items found.'}
              {activeListTab === 'bestValue' && 'No priced items with wears found to calculate cost per wear.'}
              {activeListTab === 'worstValue' && 'No priced items with wears found to calculate cost per wear.'}
              {activeListTab === 'moneyTiedUp' && 'No unworn items with a price tag found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {currentListItems.map((item, index) => {
              const categoryEmoji = CATEGORY_EMOJI[item.category] || '👕';

              return (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-800/30 px-2 rounded-xl transition"
                >
                  {/* Left: Rank + Photo + Info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-5 text-center text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 flex-shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl">{categoryEmoji}</span>
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="min-w-0">
                      <Link
                        to={`/wardrobe/${item.id}/edit`}
                        className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition truncate block"
                      >
                        {item.name}
                      </Link>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                        <span className="capitalize">{item.category}</span>
                        {item.price !== null && item.price !== undefined && (
                          <>
                            <span>•</span>
                            <span>{formatRupee(item.price)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metric Badge */}
                  <div className="flex-shrink-0 text-right">
                    {/* Most Worn Tab */}
                    {activeListTab === 'mostWorn' && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {item.wearCount} {item.wearCount === 1 ? 'wear' : 'wears'}
                        </span>
                        {item.costPerWear !== null && (
                          <div className="text-[11px] text-slate-400">
                            {formatRupee(item.costPerWear)}/wear
                          </div>
                        )}
                      </div>
                    )}

                    {/* Least Worn Tab */}
                    {activeListTab === 'leastWorn' && (
                      <div className="space-y-0.5">
                        {item.wearCount === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Never worn
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {item.wearCount} {item.wearCount === 1 ? 'wear' : 'wears'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Best Value Tab */}
                    {activeListTab === 'bestValue' && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {formatRupee(item.costPerWear)} / wear
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {item.wearCount} wears • {formatRupee(item.price)}
                        </div>
                      </div>
                    )}

                    {/* Worst Value Tab */}
                    {activeListTab === 'worstValue' && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {formatRupee(item.costPerWear)} / wear
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {item.wearCount} wears • {formatRupee(item.price)}
                        </div>
                      </div>
                    )}

                    {/* Money Tied Up Tab */}
                    {activeListTab === 'moneyTiedUp' && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {formatRupee(item.price)} tied up
                        </span>
                        <div className="text-[11px] text-slate-400">
                          0 wears logged
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
