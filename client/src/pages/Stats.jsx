import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shirt,
  Sparkles,
  Flame,
  Palette,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { getStats } from '../api/stats.js';
import { getColorInfo } from '../constants/colors.js';
import {
  Button,
  StatusPill,
  EmptyState,
  Skeleton,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  SegmentedControl,
  PillTabs,
} from '../components/ui/index.js';

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

// Season emojis and pastel colors
const SEASON_CONFIG = {
  summer: { emoji: '☀️', color: '#F5C98A', label: 'Summer' },
  winter: { emoji: '❄️', color: '#9CC3F5', label: 'Winter' },
  monsoon: { emoji: '🌧️', color: '#A8D5A2', label: 'Monsoon' },
  'all-season': { emoji: '🔄', color: '#B8BEF5', label: 'All-Season' },
};

// Occasion emojis and pastel colors
const OCCASION_CONFIG = {
  casual: { emoji: '☕', color: '#9CC3F5', label: 'Casual' },
  formal: { emoji: '👔', color: '#4F5BD5', label: 'Formal' },
  party: { emoji: '🎉', color: '#F5C98A', label: 'Party' },
  work: { emoji: '💼', color: '#B8BEF5', label: 'Work' },
  festive: { emoji: '✨', color: '#FBE3DC', label: 'Festive' },
  sports: { emoji: '🏃', color: '#A8D5A2', label: 'Sports' },
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
 * Formats weekday and day for 7-day view (e.g. "Mon 10")
 */
function formatDayShort(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    day: d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' }),
  };
}

/**
 * Hook to animate numbers from 0 to endValue, respecting prefers-reduced-motion
 */
function useCountUp(endValue, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof endValue !== 'number' || isNaN(endValue)) {
      setValue(0);
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || endValue === 0) {
      setValue(endValue);
      return;
    }

    let startTime = null;
    let animId = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.round(eased * endValue));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setValue(endValue);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [endValue, duration]);

  return value;
}

/**
 * Animated number component
 */
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const animated = useCountUp(value);
  const formatted = new Intl.NumberFormat('en-IN').format(animated);
  return <span>{prefix}{formatted}{suffix}</span>;
}

/**
 * Circular progress ring gauge for "% worn at least once"
 */
function RingGauge({ pct = 0, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;

  return (
    <div className="relative shrink-0 flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E3E6FB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#4F5BD5"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-[#4F5BD5] font-mono">
        {pct}%
      </span>
    </div>
  );
}

/**
 * Mini Sparkline SVG for KPI card
 */
function MiniSparkline({ data = [], stroke = '#4F5BD5', width = 56, height = 28 }) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} className="shrink-0">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#B8BEF5" strokeWidth="2" strokeDasharray="3 3" />
      </svg>
    );
  }

  const values = data.map((d) => (typeof d === 'number' ? d : d.count || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
  const gradId = `spark-${stroke.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Donut Chart made with pure SVG (stroke-dasharray, rounded segments, gap, centered icon)
 */
function ColorDonutChart({ colors = [], total = 1, size = 150 }) {
  const radius = 50;
  const strokeWidth = 15;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const topColors = colors.slice(0, 6);
  const otherCount = colors.slice(6).reduce((acc, c) => acc + c.count, 0);
  const allSlices = [...topColors];
  if (otherCount > 0) {
    allSlices.push({ color: 'other', count: otherCount });
  }

  let accumulatedLength = 0;
  const gap = allSlices.length > 1 ? 3 : 0;

  return (
    <div className="relative shrink-0 flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E3E6FB"
          strokeWidth={strokeWidth}
        />

        {allSlices.map((slice, idx) => {
          const pct = slice.count / (total || 1);
          const rawLength = pct * circumference;
          const dashLength = Math.max(0.5, rawLength - gap);
          const dashOffset = -accumulatedLength;
          accumulatedLength += rawLength;

          const colorInfo =
            slice.color === 'other'
              ? { hex: '#B8BEF5' }
              : getColorInfo(slice.color);

          return (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={colorInfo.hex}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-all duration-500 ease-out"
            />
          );
        })}

        {/* Center circle */}
        <circle
          cx={center}
          cy={center}
          r={radius - strokeWidth / 2 - 2}
          fill="white"
        />
      </svg>

      {/* Centered Icon inside donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <Palette className="w-5 h-5 text-[#4F5BD5]" />
        <span className="text-[10px] font-bold text-[#6B7194] mt-0.5 font-mono">
          {colors.length} {colors.length === 1 ? 'color' : 'colors'}
        </span>
      </div>
    </div>
  );
}

export default function Stats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeListTab, setActiveListTab] = useState('mostWorn');
  const [hoveredDay, setHoveredDay] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // '7' or '30'

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

  // Percentage of items worn at least once
  const wornPct = totals.items > 0 ? Math.round((totals.wornItems / totals.items) * 100) : 0;

  // Total money tied up in unworn pieces
  const moneyTiedUpTotal = useMemo(() => {
    return unwornWithPrice.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [unwornWithPrice]);

  // Color insight calculation
  const colorInsight = useMemo(() => {
    if (!colors || colors.length === 0 || !totals.items) return null;
    const topColor = colors[0];
    const pct = Math.round((topColor.count / totals.items) * 100);
    return `${capitalize(topColor.color)} is ${pct}% of your wardrobe (${topColor.count} ${topColor.count === 1 ? 'item' : 'items'}).`;
  }, [colors, totals.items]);

  // Max value in selected time range for bar chart scaling
  const visibleDays = useMemo(() => {
    if (timeRange === '7') {
      return wearsLast30Days.slice(-7);
    }
    return wearsLast30Days;
  }, [wearsLast30Days, timeRange]);

  const maxVisibleWear = useMemo(() => {
    if (!visibleDays.length) return 1;
    const max = Math.max(...visibleDays.map((d) => d.count));
    return max > 0 ? max : 1;
  }, [visibleDays]);

  const totalVisibleWears = useMemo(() => {
    return visibleDays.reduce((acc, d) => acc + d.count, 0);
  }, [visibleDays]);

  // Max category count for horizontal bars
  const maxCategoryCount = useMemo(() => {
    if (!categories.length) return 1;
    const max = Math.max(...categories.map((c) => c.count));
    return max > 0 ? max : 1;
  }, [categories]);

  // Max season count
  const maxSeasonCount = useMemo(() => {
    if (!seasons.length) return 1;
    const max = Math.max(...seasons.map((s) => s.count));
    return max > 0 ? max : 1;
  }, [seasons]);

  // Max occasion count
  const maxOccasionCount = useMemo(() => {
    if (!occasions.length) return 1;
    const max = Math.max(...occasions.map((o) => o.count));
    return max > 0 ? max : 1;
  }, [occasions]);

  // Tabs for the 5 thumbnail lists
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

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans animate-fade-in-up">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <Skeleton className="h-10 w-28 rounded-2xl" />
        </div>

        {/* 4 KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>

        {/* Large 30-Day Activity Skeleton */}
        <Skeleton className="h-80 rounded-3xl" />

        {/* Color Donut & Category Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-88 rounded-3xl" />
          <Skeleton className="h-88 rounded-3xl" />
        </div>

        {/* Season & Occasion Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>

        {/* Lists Skeleton */}
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans animate-fade-in-up">
        <div className="rounded-3xl bg-white/75 border border-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-heading text-[#1E2140]">Unable to Load Stats</h2>
            <p className="text-xs sm:text-sm text-[#6B7194]">{error}</p>
          </div>
          <div className="pt-2">
            <Button variant="primary" onClick={fetchStats}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (totals.items === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon="📊"
          title="Wardrobe Analytics"
          description="Your wardrobe is currently empty. Add your clothes to unlock wear analytics, cost-per-wear breakdown, and color distributions."
          actionText="Add your first item"
          actionLink="/wardrobe/add"
          actionAs={Link}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1E2140] tracking-tight">
            Wardrobe Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7194] mt-1 font-sans">
            Track wear frequency, cost-per-wear value, and wardrobe health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button as={Link} to="/wardrobe" variant="secondary" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Wardrobe</span>
          </Button>
          <Button as={Link} to="/history" variant="ghost" size="sm">
            History
          </Button>
        </div>
      </div>

      {/* 1. TOP ROW: FOUR KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Total Items with Ring Gauge (% worn at least once) */}
        <div className="bg-white/75 border border-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex items-center justify-between hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)] transition-all duration-200">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center shadow-xs shrink-0">
                <Shirt className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading truncate">
                Total Items
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#1E2140] tracking-tight pt-1">
              <AnimatedNumber value={totals.items} />
            </div>
            <p className="text-xs text-[#6B7194] truncate">
              {totals.neverWornItems} never worn
            </p>
          </div>
          {/* Ring gauge on right */}
          <div className="ml-3">
            <RingGauge pct={wornPct} size={50} strokeWidth={4} />
          </div>
        </div>

        {/* KPI 2: Outfits with pastel mini-bars */}
        <div className="bg-white/75 border border-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex items-center justify-between hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)] transition-all duration-200">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading truncate">
                Outfits
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#1E2140] tracking-tight pt-1">
              <AnimatedNumber value={totals.outfits} />
            </div>
            <p className="text-xs text-[#6B7194] truncate">
              Curated looks
            </p>
          </div>
          {/* Pastel mini bars on right */}
          <div className="w-12 h-10 flex items-end justify-center gap-1 shrink-0 px-1 ml-3">
            <div className="w-2 rounded-t-sm bg-[#B8BEF5]" style={{ height: '45%' }} />
            <div className="w-2 rounded-t-sm bg-[#9CC3F5]" style={{ height: '75%' }} />
            <div className="w-2 rounded-t-sm bg-[#4F5BD5]" style={{ height: '100%' }} />
            <div className="w-2 rounded-t-sm bg-[#A8D5A2]" style={{ height: '60%' }} />
          </div>
        </div>

        {/* KPI 3: Total Wears with pastel sparkline */}
        <div className="bg-white/75 border border-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex items-center justify-between hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)] transition-all duration-200">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#FCEBD0] text-[#9A6410] flex items-center justify-center shadow-xs shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading truncate">
                Total Wears
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#1E2140] tracking-tight pt-1">
              <AnimatedNumber value={totals.totalWears} />
            </div>
            <p className="text-xs text-[#6B7194] truncate">
              {totalVisibleWears} in last {timeRange}d
            </p>
          </div>
          {/* Pastel sparkline on right */}
          <div className="ml-3">
            <MiniSparkline
              data={wearsLast30Days.slice(-8)}
              stroke="#F5C98A"
              width={56}
              height={28}
            />
          </div>
        </div>

        {/* KPI 4: Wardrobe Value in rupees with pastel mini bar/sparkline */}
        <div className="bg-white/75 border border-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex items-center justify-between hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)] transition-all duration-200">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E3F2D9] text-[#4C8A3A] flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                ₹
              </div>
              <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading truncate">
                Closet Value
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#1E2140] tracking-tight pt-1">
              <AnimatedNumber value={totals.totalValue} prefix="₹" />
            </div>
            <p className="text-xs text-[#6B7194] truncate">
              {unwornWithPrice.length > 0
                ? `${formatRupee(moneyTiedUpTotal)} unworn`
                : 'All pieces active'}
            </p>
          </div>
          {/* Mini chart on right */}
          <div className="ml-3">
            <MiniSparkline
              data={[10, 18, 14, 25, 22, 30, 28]}
              stroke="#A8D5A2"
              width={56}
              height={28}
            />
          </div>
        </div>
      </div>

      {/* 2. LARGE CARD: WEARS OVER THE LAST 30 DAYS */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>📅</span>
                <span>Wears over the last {timeRange} days</span>
              </CardTitle>
              <CardDescription>
                Daily wear frequency and styling momentum
              </CardDescription>
            </div>

            {/* SegmentedControl (7 days / 30 days) */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <SegmentedControl
                options={[
                  { value: '7', label: '7 days' },
                  { value: '30', label: '30 days' },
                ]}
                value={timeRange}
                onChange={(val) => {
                  setTimeRange(val);
                  setHoveredDay(null);
                }}
                size="sm"
                aria-label="Time period range"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Active Hover / Tap Tooltip Display Pill */}
          <div className="h-7 flex items-center justify-between">
            {hoveredDay ? (
              <div className="text-xs font-semibold text-[#1E2140] bg-white border border-[#E3E6FB] px-3 py-1 rounded-full inline-flex items-center space-x-2 shadow-xs animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-[#4F5BD5]" />
                <span className="text-[#6B7194]">{formatDateShort(hoveredDay.date)}:</span>
                <span className="text-[#1E2140] font-bold font-mono">
                  {hoveredDay.count} {hoveredDay.count === 1 ? 'wear' : 'wears'}
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#6B7194]">
                Hover or tap any bar to inspect daily wear logs
              </span>
            )}

            <span className="text-xs font-semibold text-[#4F5BD5]">
              {totalVisibleWears} total wears in range
            </span>
          </div>

          {/* Bar Chart Container with lighter full-height track behind each colored bar */}
          <div className="relative pt-2 pb-1">
            <div className="relative h-44 flex items-end justify-between gap-1 sm:gap-2 px-1">
              {visibleDays.map((dayItem) => {
                const heightPct =
                  dayItem.count > 0
                    ? Math.max(14, Math.round((dayItem.count / maxVisibleWear) * 100))
                    : 0;
                const isSelected = hoveredDay?.date === dayItem.date;
                const hasWears = dayItem.count > 0;

                return (
                  <div
                    key={dayItem.date}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                    onMouseEnter={() => setHoveredDay(dayItem)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setHoveredDay(dayItem)}
                  >
                    {/* Full-height lighter track */}
                    <div className="w-full h-full bg-[#E3E6FB]/40 rounded-full flex flex-col justify-end p-0.5 overflow-hidden transition-all group-hover:bg-[#E3E6FB]/70">
                      {/* Pastel colored bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-full transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#4F5BD5] shadow-[0_0_12px_rgba(79,91,213,0.4)] scale-102'
                            : hasWears
                            ? 'bg-gradient-to-t from-[#4F5BD5] to-[#9CC3F5]'
                            : 'bg-transparent'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Labels Below Chart */}
            {timeRange === '7' ? (
              /* Day-of-week labels for 7-day view */
              <div className="flex justify-between text-xs text-[#6B7194] mt-2 px-1 font-semibold">
                {visibleDays.map((d) => {
                  const { weekday, day } = formatDayShort(d.date);
                  return (
                    <div key={d.date} className="flex-1 text-center">
                      <div>{weekday}</div>
                      <div className="text-[10px] text-[#6B7194] font-mono">{day}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Month/day boundary labels for 30-day view */
              <div className="flex justify-between text-xs text-[#6B7194] mt-2.5 px-1 font-mono">
                <span>{visibleDays.length > 0 ? formatDateShort(visibleDays[0].date) : '30 days ago'}</span>
                <span>{visibleDays.length > 15 ? formatDateShort(visibleDays[Math.floor(visibleDays.length / 2)].date) : '15 days ago'}</span>
                <span>Today</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. CARD: WARDROBE BY COLOR (DONUT CHART) & 4. CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Wardrobe by color as a Donut Chart with SVG & Legend & Insight Banner */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>🎨</span>
                  <span>Wardrobe by color</span>
                </CardTitle>
                <StatusPill variant="neutral" size="sm">
                  {colors.length} shades
                </StatusPill>
              </div>
              <CardDescription>
                Proportion and palette balance across your collection
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {colors.length === 0 ? (
                <p className="text-sm text-[#6B7194] py-8 text-center">No color data available</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 pt-1">
                  {/* Donut Chart */}
                  <ColorDonutChart colors={colors} total={totals.items} size={150} />

                  {/* Legend aligned right */}
                  <div className="flex-1 w-full space-y-2.5">
                    {colors.slice(0, 5).map((c) => {
                      const colorInfo = getColorInfo(c.color);
                      const pct = totals.items > 0 ? Math.round((c.count / totals.items) * 100) : 0;

                      return (
                        <div key={c.color} className="flex items-center justify-between text-xs font-sans">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-3 h-3 rounded-full border border-black/15 shadow-xs"
                              style={{ backgroundColor: colorInfo.hex }}
                            />
                            <span className="font-semibold text-[#1E2140] capitalize">
                              {c.color}
                            </span>
                          </div>
                          <span className="text-[#6B7194] font-mono font-semibold">
                            {c.count} <span className="text-[#6B7194]/80">({pct}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          {/* Soft Rounded Insight Banner below */}
          {colorInsight && (
            <div className="p-4 sm:p-5 pt-0">
              <div className="rounded-2xl bg-[#E3E6FB]/80 border border-[#D4D8F7] p-3.5 text-xs text-[#4F5BD5] flex items-center gap-2.5 shadow-2xs font-semibold">
                <span className="text-base shrink-0">💡</span>
                <span>{colorInsight}</span>
              </div>
            </div>
          )}
        </Card>

        {/* 4. CARD: Category Breakdown as Horizontal Pastel Bars */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>🏷️</span>
                <span>Category Breakdown</span>
              </CardTitle>
              <StatusPill variant="neutral" size="sm">
                {categories.length} categories
              </StatusPill>
            </div>
            <CardDescription>
              Wardrobe distribution across clothing types
            </CardDescription>
          </CardHeader>

          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-[#6B7194] py-8 text-center">No category data available</p>
            ) : (
              <div className="space-y-3.5 pt-1">
                {categories.map((cat) => {
                  const emoji = CATEGORY_EMOJI[cat.category] || '👕';
                  const pct = totals.items > 0 ? Math.round((cat.count / totals.items) * 100) : 0;
                  const barWidthPct = Math.max(8, Math.round((cat.count / maxCategoryCount) * 100));

                  return (
                    <div key={cat.category} className="space-y-1.5 font-sans">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{emoji}</span>
                          <span className="font-semibold text-[#1E2140] capitalize">
                            {cat.category}
                          </span>
                        </div>
                        <span className="text-[#6B7194] font-mono text-xs font-semibold">
                          {cat.count} <span className="text-[#6B7194]/80">({pct}%)</span>
                        </span>
                      </div>

                      {/* Horizontal Pastel Bar with Track */}
                      <div className="h-2.5 w-full bg-[#E3E6FB]/50 rounded-full overflow-hidden p-0.5">
                        <div
                          style={{ width: `${barWidthPct}%` }}
                          className="h-full bg-gradient-to-r from-[#4F5BD5] to-[#9CC3F5] rounded-full transition-all duration-500 shadow-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. CARDS: Season & Occasion Distribution as Horizontal Pastel Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Season Distribution as Horizontal Pastel Bars */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>🌦️</span>
                <span>Season Distribution</span>
              </CardTitle>
              <StatusPill variant="neutral" size="sm">
                {seasons.length} seasons
              </StatusPill>
            </div>
            <CardDescription>
              Suitable seasonal weather distribution
            </CardDescription>
          </CardHeader>

          <CardContent>
            {seasons.length === 0 ? (
              <p className="text-sm text-[#6B7194] py-4 text-center">No season data</p>
            ) : (
              <div className="space-y-3.5 pt-1">
                {seasons.map((s) => {
                  const cfg = SEASON_CONFIG[s.season] || { emoji: '🌦️', color: '#B8BEF5', label: s.season };
                  const pct = totals.items > 0 ? Math.round((s.count / totals.items) * 100) : 0;
                  const barWidthPct = Math.max(8, Math.round((s.count / maxSeasonCount) * 100));

                  return (
                    <div key={s.season} className="space-y-1.5 font-sans">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{cfg.emoji}</span>
                          <span className="font-semibold text-[#1E2140] capitalize">
                            {cfg.label}
                          </span>
                        </div>
                        <span className="text-[#6B7194] font-mono text-xs font-semibold">
                          {s.count} <span className="text-[#6B7194]/80">({pct}%)</span>
                        </span>
                      </div>

                      {/* Horizontal Pastel Bar */}
                      <div className="h-2.5 w-full bg-[#E3E6FB]/50 rounded-full overflow-hidden p-0.5">
                        <div
                          style={{
                            width: `${barWidthPct}%`,
                            backgroundColor: cfg.color,
                          }}
                          className="h-full rounded-full transition-all duration-500 shadow-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Occasion Distribution as Horizontal Pastel Bars */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span>
                <span>Occasion Distribution</span>
              </CardTitle>
              <StatusPill variant="neutral" size="sm">
                {occasions.length} occasions
              </StatusPill>
            </div>
            <CardDescription>
              Lifestyle & event suitability
            </CardDescription>
          </CardHeader>

          <CardContent>
            {occasions.length === 0 ? (
              <p className="text-sm text-[#6B7194] py-4 text-center">No occasion data</p>
            ) : (
              <div className="space-y-3.5 pt-1">
                {occasions.map((o) => {
                  const cfg = OCCASION_CONFIG[o.occasion] || { emoji: '🎯', color: '#B8BEF5', label: o.occasion };
                  const pct = totals.items > 0 ? Math.round((o.count / totals.items) * 100) : 0;
                  const barWidthPct = Math.max(8, Math.round((o.count / maxOccasionCount) * 100));

                  return (
                    <div key={o.occasion} className="space-y-1.5 font-sans">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{cfg.emoji}</span>
                          <span className="font-semibold text-[#1E2140] capitalize">
                            {cfg.label}
                          </span>
                        </div>
                        <span className="text-[#6B7194] font-mono text-xs font-semibold">
                          {o.count} <span className="text-[#6B7194]/80">({pct}%)</span>
                        </span>
                      </div>

                      {/* Horizontal Pastel Bar */}
                      <div className="h-2.5 w-full bg-[#E3E6FB]/50 rounded-full overflow-hidden p-0.5">
                        <div
                          style={{
                            width: `${barWidthPct}%`,
                            backgroundColor: cfg.color,
                          }}
                          className="h-full rounded-full transition-all duration-500 shadow-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. LISTS IN GLASS CARDS WITH THUMBNAILS AND STATUSPILLS */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              <span>Wardrobe Lists & Value Rankings</span>
            </CardTitle>
            <CardDescription>
              Rank your most worn favorites, low-wear pieces, best value, and tied-up money
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* List Category Tabs */}
          <PillTabs
            tabs={listTabs}
            activeTab={activeListTab}
            onChange={(tabId) => setActiveListTab(tabId)}
            aria-label="Wardrobe ranking lists"
          />

          {/* List Content */}
          {currentListItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-4xl text-[#6B7194]">📭</div>
              <p className="text-sm text-[#6B7194]">
                {activeListTab === 'mostWorn' && 'No items have been logged as worn yet.'}
                {activeListTab === 'leastWorn' && 'No items found.'}
                {activeListTab === 'bestValue' && 'No priced items with wear logs found to calculate cost per wear.'}
                {activeListTab === 'worstValue' && 'No priced items with wear logs found to calculate cost per wear.'}
                {activeListTab === 'moneyTiedUp' && 'No unworn items with a price tag found.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E3E6FB]/80">
              {currentListItems.map((item, index) => {
                const categoryEmoji = CATEGORY_EMOJI[item.category] || '👕';
                const rank = index + 1;

                return (
                  <div
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-3 group hover:bg-white/60 px-3 rounded-2xl transition-colors font-sans"
                  >
                    {/* Left: Rank number + Thumbnail + Details */}
                    <div className="flex items-center space-x-3.5 min-w-0">
                      {/* Rank Number Badge */}
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black font-mono shrink-0 border ${
                          rank === 1
                            ? 'bg-[#FCEBD0] text-[#9A6410] border-[#F5C98A]'
                            : rank === 2
                            ? 'bg-[#E3E6FB] text-[#4F5BD5] border-[#D4D8F7]'
                            : rank === 3
                            ? 'bg-[#DCE8FB] text-[#3B5FB0] border-[#CDE0FA]'
                            : 'bg-white text-[#6B7194] border-white/80'
                        }`}
                      >
                        #{rank}
                      </span>

                      {/* Thumbnail */}
                      <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl overflow-hidden bg-white/60 border border-white/90 shadow-xs shrink-0 flex items-center justify-center">
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
                      <div className="min-w-0 space-y-0.5">
                        <Link
                          to={`/wardrobe/${item.id}/edit`}
                          className="text-sm font-bold font-heading text-[#1E2140] group-hover:text-[#4F5BD5] transition-colors truncate block"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center space-x-2 text-xs text-[#6B7194]">
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

                    {/* Right: StatusPill Metric */}
                    <div className="shrink-0 text-right">
                      {/* Most Worn Tab */}
                      {activeListTab === 'mostWorn' && (
                        <div className="space-y-1">
                          <StatusPill variant="green" size="sm" dot>
                            {item.wearCount} {item.wearCount === 1 ? 'wear' : 'wears'}
                          </StatusPill>
                          {item.costPerWear !== null && (
                            <div className="text-[11px] text-[#6B7194] font-mono">
                              {formatRupee(item.costPerWear)}/wear
                            </div>
                          )}
                        </div>
                      )}

                      {/* Least Worn Tab */}
                      {activeListTab === 'leastWorn' && (
                        <div className="space-y-1">
                          {item.wearCount === 0 ? (
                            <StatusPill variant="amber" size="sm" dot>
                              Never worn
                            </StatusPill>
                          ) : (
                            <StatusPill variant="neutral" size="sm">
                              {item.wearCount} {item.wearCount === 1 ? 'wear' : 'wears'}
                            </StatusPill>
                          )}
                        </div>
                      )}

                      {/* Best Value Tab */}
                      {activeListTab === 'bestValue' && (
                        <div className="space-y-1">
                          <StatusPill variant="green" size="sm" dot>
                            {formatRupee(item.costPerWear)} / wear
                          </StatusPill>
                          <div className="text-[11px] text-[#6B7194] font-mono">
                            {item.wearCount} wears • {formatRupee(item.price)}
                          </div>
                        </div>
                      )}

                      {/* Worst Value Tab */}
                      {activeListTab === 'worstValue' && (
                        <div className="space-y-1">
                          <StatusPill variant="red" size="sm" dot>
                            {formatRupee(item.costPerWear)} / wear
                          </StatusPill>
                          <div className="text-[11px] text-[#6B7194] font-mono">
                            {item.wearCount} wears • {formatRupee(item.price)}
                          </div>
                        </div>
                      )}

                      {/* Money Tied Up Tab */}
                      {activeListTab === 'moneyTiedUp' && (
                        <div className="space-y-1">
                          <StatusPill variant="amber" size="sm" dot>
                            {formatRupee(item.price)} tied up
                          </StatusPill>
                          <div className="text-[11px] text-[#6B7194] font-mono">
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
        </CardContent>
      </Card>
    </div>
  );
}
