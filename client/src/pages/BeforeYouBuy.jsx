import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CATEGORIES, OCCASIONS, SEASONS } from '../constants/wardrobe.js';
import { getFilterOptions } from '../api/items.js';
import { checkDuplicate } from '../api/duplicates.js';

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

// Common color to hex mapping for small dot indicators
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

function getColorDot(colorStr) {
  if (!colorStr) return '#94a3b8';
  const norm = colorStr.toLowerCase().trim();
  return COLOR_HEX_MAP[norm] || '#94a3b8';
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatLastWorn(lastWornAt) {
  if (!lastWornAt) return 'Never worn';
  const date = new Date(lastWornAt);
  if (isNaN(date.getTime())) return 'Never worn';
  const now = new Date();
  const diffDays = Math.round((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Last worn today';
  if (diffDays === 1) return 'Last worn yesterday';
  if (diffDays < 7) return `Last worn ${diffDays} days ago`;
  if (diffDays < 30) {
    const wks = Math.round(diffDays / 7);
    return `Last worn ${wks} week${wks === 1 ? '' : 's'} ago`;
  }
  return `Last worn on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export default function BeforeYouBuy() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const categoryParam = searchParams.get('category') || 'top';
  const colorParam = searchParams.get('color') || '';
  const occasionParam = searchParams.get('occasion') || '';
  const seasonParam = searchParams.get('season') || '';
  const fabricParam = searchParams.get('fabric') || '';

  // Form states
  const [category, setCategory] = useState(categoryParam);
  const [color, setColor] = useState(colorParam);
  const [occasion, setOccasion] = useState(occasionParam);
  const [season, setSeason] = useState(seasonParam);
  const [fabric, setFabric] = useState(fabricParam);

  // Available colors datalist
  const [ownedColors, setOwnedColors] = useState([]);

  // Result states
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load owned colors for the datalist
  useEffect(() => {
    getFilterOptions()
      .then((data) => {
        if (data?.colors) setOwnedColors(data.colors);
      })
      .catch((err) => console.error('Failed to load owned colors for datalist:', err));
  }, []);

  // Perform duplicate check
  const runCheck = useCallback(
    async (targetCategory, targetColor, targetOccasion, targetSeason, targetFabric) => {
      if (!targetCategory || !targetColor || targetColor.trim() === '') {
        return;
      }

      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const data = await checkDuplicate({
          category: targetCategory,
          color: targetColor.trim(),
          occasion: targetOccasion || undefined,
          season: targetSeason || undefined,
          fabric: targetFabric || undefined,
        });
        setResult(data);
      } catch (err) {
        console.error('Duplicate check error:', err);
        setError(err.message || 'Failed to check wardrobe duplicates. Please try again.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger check if valid URL query params exist on initial mount
  useEffect(() => {
    if (categoryParam && colorParam) {
      setCategory(categoryParam);
      setColor(colorParam);
      setOccasion(occasionParam);
      setSeason(seasonParam);
      setFabric(fabricParam);
      runCheck(categoryParam, colorParam, occasionParam, seasonParam, fabricParam);
    }
  }, [categoryParam, colorParam, occasionParam, seasonParam, fabricParam, runCheck]);

  // Handle submit
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!color.trim()) return;

    // Update query string
    const newParams = {
      category,
      color: color.trim().toLowerCase(),
    };
    if (occasion) newParams.occasion = occasion;
    if (season) newParams.season = season;
    if (fabric.trim()) newParams.fabric = fabric.trim();

    setSearchParams(newParams);
    runCheck(category, color.trim(), occasion, season, fabric.trim());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-100 to-indigo-300 bg-clip-text text-transparent flex items-center gap-2.5">
            <span>🛍️</span> Before You Buy
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Check your wardrobe before buying to avoid accidental duplicates and wasted purchases
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
            to="/underused"
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
          >
            Underused Items
          </Link>
        </div>
      </div>

      {/* Check Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Category Select (Required) */}
          <div className="space-y-1.5">
            <label htmlFor="buy-category" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Category <span className="text-indigo-400">*</span>
            </label>
            <select
              id="buy-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/80 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition capitalize"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_EMOJI[cat] || '👕'} {capitalize(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Color Input with Datalist (Required) */}
          <div className="space-y-1.5">
            <label htmlFor="buy-color" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Color <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <input
                id="buy-color"
                type="text"
                list="owned-colors"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Black, Navy, Maroon"
                className="w-full bg-slate-800 border border-slate-700/80 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
              <datalist id="owned-colors">
                {ownedColors.map((c) => (
                  <option key={c} value={capitalize(c)} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Occasion (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="buy-occasion" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Occasion
            </label>
            <select
              id="buy-occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/80 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">Any Occasion</option>
              {OCCASIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {capitalize(occ)}
                </option>
              ))}
            </select>
          </div>

          {/* Season (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="buy-season" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Season
            </label>
            <select
              id="buy-season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/80 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">Any Season</option>
              {SEASONS.map((sea) => (
                <option key={sea} value={sea}>
                  {capitalize(sea)}
                </option>
              ))}
            </select>
          </div>

          {/* Fabric (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="buy-fabric" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Fabric
            </label>
            <input
              id="buy-fabric"
              type="text"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              placeholder="e.g. Cotton, Linen, Silk"
              maxLength={40}
              className="w-full bg-slate-800 border border-slate-700/80 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !color.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? '⏳' : '🔍'}</span>
            <span>{loading ? 'Checking wardrobe...' : 'Check my wardrobe'}</span>
          </button>
        </div>
      </form>

      {/* Initial Idle State (Before search) */}
      {!hasSearched && !loading && (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl">
            🧐
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">Smart Wardrobe Check</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Thinking about buying something new? Select the category and color above to instantly check your existing closet for duplicates or neglected twins.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-800/40 rounded-2xl border border-slate-700/50" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Duplicate Check Failed
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">{error}</p>
          </div>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results Section */}
      {!loading && !error && result && (
        <div className="space-y-6">
          {/* Verdict Banner */}
          <div
            className={`rounded-2xl p-6 sm:p-7 border shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 ${
              result.verdict.level === 'go'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
                : result.verdict.level === 'think'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-100 shadow-amber-950/40'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-100 shadow-rose-950/40'
            }`}
          >
            {/* Verdict Icon Pill */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border ${
                result.verdict.level === 'go'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : result.verdict.level === 'think'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              }`}
            >
              {result.verdict.level === 'go' ? '✅' : result.verdict.level === 'think' ? '🤔' : '🛑'}
            </div>

            {/* Verdict Text */}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-extrabold tracking-wider">
                  {result.verdict.level === 'go'
                    ? 'Verdict: Go for it!'
                    : result.verdict.level === 'think'
                    ? 'Verdict: Think twice'
                    : 'Verdict: Skip this purchase'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-snug">
                {result.verdict.message}
              </h2>
            </div>
          </div>

          {/* Stats Breakdown Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xs text-slate-400 font-medium">Exact Matches</div>
              <div className="text-xl font-bold text-white mt-1">{result.exactCount}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xs text-slate-400 font-medium">Similar Items</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{result.similarCount}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xs text-slate-400 font-medium">Total in Category</div>
              <div className="text-xl font-bold text-slate-200 mt-1">{result.stats.totalInCategory}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xs text-slate-400 font-medium">Worn Often (≥5)</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{result.stats.wornOften}</div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xs text-slate-400 font-medium">Rarely Worn (≤1)</div>
              <div className="text-xl font-bold text-rose-400 mt-1">{result.stats.rarelyWorn}</div>
            </div>
          </div>

          {/* Matching Items Grid */}
          {result.matches.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <div className="text-4xl">🎉</div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                No Existing Duplicates Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                You don't currently have anything similar to this {color} {category}. Adding it will expand your styling range!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-semibold text-slate-200 uppercase tracking-wider">
                  Similar Items in Your Wardrobe ({result.matches.length})
                </span>
                <span>Sorted by similarity match</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {result.matches.map((item) => {
                  const emoji = CATEGORY_EMOJI[item.category] || '👕';
                  const dot = getColorDot(item.color);
                  const matchPct = Math.round(item.score * 100);

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-slate-700 transition"
                    >
                      {/* Thumbnail Container */}
                      <div className="aspect-[4/5] bg-slate-800 relative overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-4xl">{emoji}</span>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md backdrop-blur-md ${
                              item.matchType === 'exact'
                                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                                : 'bg-indigo-950/90 text-indigo-300 border border-indigo-500/40'
                            }`}
                          >
                            {item.matchType === 'exact' ? 'Exact match' : 'Similar'}
                          </span>
                        </div>

                        {/* Similarity Score Tag */}
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-700/60">
                          {matchPct}% match
                        </span>
                      </div>

                      {/* Content Details */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/wardrobe/${item.id}/edit`}
                            className="text-sm font-semibold text-slate-100 hover:text-indigo-300 transition truncate block"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: dot }}
                            />
                            <span className="capitalize truncate">{item.color}</span>
                          </div>
                        </div>

                        {/* Usage Metrics */}
                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span>Wear count:</span>
                            <span
                              className={`font-semibold ${
                                item.wearCount >= 5
                                  ? 'text-emerald-400'
                                  : item.wearCount <= 1
                                  ? 'text-rose-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {item.wearCount} {item.wearCount === 1 ? 'time' : 'times'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {formatLastWorn(item.lastWornAt)}
                          </div>
                        </div>

                        {/* View / Edit Link */}
                        <div className="pt-1">
                          <Link
                            to={`/wardrobe/${item.id}/edit`}
                            className="w-full text-center block text-xs font-medium py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition"
                          >
                            View in wardrobe
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

