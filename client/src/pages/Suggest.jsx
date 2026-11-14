import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { OCCASIONS, SEASONS } from '../constants/wardrobe.js';
import { getSuggestions } from '../api/suggestions.js';
import { logItemWear } from '../api/wear.js';
import { createOutfit } from '../api/outfits.js';

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

export default function Suggest() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read occasion and season from URL query string
  const occasionParam = searchParams.get('occasion') || '';
  const seasonParam = searchParams.get('season') || '';

  const [occasion, setOccasion] = useState(occasionParam);
  const [season, setSeason] = useState(seasonParam);

  const [excludeIds, setExcludeIds] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [missing, setMissing] = useState([]);
  const [emptyMessage, setEmptyMessage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Per-outfit action state indicators
  const [actionStates, setActionStates] = useState({}); // { [outfitIdx]: { wearing: bool, worn: bool, saving: bool, saved: bool } }

  // Floating toast notification state
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Sync state with URL params
  useEffect(() => {
    setOccasion(occasionParam);
    setSeason(seasonParam);
  }, [occasionParam, seasonParam]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(
    async (currentOccasion, currentSeason, currentExcludes = []) => {
      setLoading(true);
      setError(null);
      setEmptyMessage(null);
      setActionStates({});

      try {
        const response = await getSuggestions({
          occasion: currentOccasion || undefined,
          season: currentSeason || undefined,
          excludeIds: currentExcludes,
          count: 3,
        });

        if (response.message && (!response.outfits || response.outfits.length === 0)) {
          setEmptyMessage(response.message);
          setOutfits([]);
        } else {
          setOutfits(response.outfits || []);
          setEmptyMessage(null);
        }
        setMissing(response.missing || []);
      } catch (err) {
        console.error('Failed to get suggestions:', err);
        setError(err.message || 'Failed to fetch outfit suggestions. Please try again.');
        setOutfits([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch on mount or when URL params change
  useEffect(() => {
    fetchSuggestions(occasionParam, seasonParam, excludeIds);
  }, [occasionParam, seasonParam, fetchSuggestions]);

  // Handle filter submission
  const handleFilterSubmit = (e) => {
    e?.preventDefault();
    const newParams = {};
    if (occasion) newParams.occasion = occasion;
    if (season) newParams.season = season;

    setSearchParams(newParams);
    setExcludeIds([]); // Reset exclusions on explicit filter search
    fetchSuggestions(occasion, season, []);
  };

  // Reset all exclusions
  const handleResetExclusions = () => {
    setExcludeIds([]);
    fetchSuggestions(occasion, season, []);
    showToast('Reset excluded items. Fresh suggestions loaded!');
  };

  // "Try another" action
  const handleTryAnother = async (outfitIndex) => {
    const targetOutfit = outfits[outfitIndex];
    if (!targetOutfit) return;

    const outfitItemIds = targetOutfit.items.map((it) => it.id);
    const newExcludes = Array.from(new Set([...excludeIds, ...outfitItemIds]));
    setExcludeIds(newExcludes);

    setLoading(true);
    try {
      const response = await getSuggestions({
        occasion: occasion || undefined,
        season: season || undefined,
        excludeIds: newExcludes,
        count: 3,
      });

      if (response.message && (!response.outfits || response.outfits.length === 0)) {
        showToast('All items are currently excluded. Resetting suggestions...', 'info');
        setExcludeIds([]);
        await fetchSuggestions(occasion, season, []);
      } else {
        setOutfits(response.outfits || []);
        setMissing(response.missing || []);
        showToast('Generated fresh suggestion combinations! ✨');
      }
    } catch (err) {
      console.error('Try another error:', err);
      showToast(err.message || 'Could not fetch new suggestion', 'error');
    } finally {
      setLoading(false);
    }
  };

  // "Wore this today" action
  const handleWoreToday = async (outfitIndex) => {
    const targetOutfit = outfits[outfitIndex];
    if (!targetOutfit) return;

    setActionStates((prev) => ({
      ...prev,
      [outfitIndex]: { ...prev[outfitIndex], wearing: true },
    }));

    try {
      // Log wear for all items in this outfit
      const promises = targetOutfit.items.map((it) => logItemWear(it.id));
      await Promise.allSettled(promises);

      setActionStates((prev) => ({
        ...prev,
        [outfitIndex]: { ...prev[outfitIndex], wearing: false, worn: true },
      }));
      showToast(`Logged wear for all ${targetOutfit.items.length} items! 🌟`);
    } catch (err) {
      console.error('Failed to log wear:', err);
      setActionStates((prev) => ({
        ...prev,
        [outfitIndex]: { ...prev[outfitIndex], wearing: false },
      }));
      showToast(err.message || 'Failed to log wear for outfit', 'error');
    }
  };

  // "Save as outfit" action
  const handleSaveOutfit = async (outfitIndex) => {
    const targetOutfit = outfits[outfitIndex];
    if (!targetOutfit) return;

    setActionStates((prev) => ({
      ...prev,
      [outfitIndex]: { ...prev[outfitIndex], saving: true },
    }));

    try {
      const defaultName = occasion
        ? `${capitalize(occasion)} look`
        : `Suggested look #${outfitIndex + 1}`;

      await createOutfit({
        name: defaultName,
        occasion: occasion || undefined,
        itemIds: targetOutfit.items.map((it) => it.id),
      });

      setActionStates((prev) => ({
        ...prev,
        [outfitIndex]: { ...prev[outfitIndex], saving: false, saved: true },
      }));
      showToast(`Saved as "${defaultName}"! Check Outfits to view. 👗`);
    } catch (err) {
      console.error('Failed to save outfit:', err);
      setActionStates((prev) => ({
        ...prev,
        [outfitIndex]: { ...prev[outfitIndex], saving: false },
      }));
      showToast(err.message || 'Failed to save outfit', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-sm font-medium border backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : toast.type === 'info'
                ? 'bg-sky-950/90 border-sky-500/50 text-sky-200'
                : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-100 shadow-indigo-500/20'
            }`}
          >
            <span>{toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✨'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-300 via-indigo-100 to-indigo-300 bg-clip-text text-transparent flex items-center gap-2.5">
            <span>✨</span> Outfit Suggestions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Smart wardrobe combinations scored by color harmony, occasion, and freshness
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/outfits"
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
          >
            My Outfits
          </Link>
          <Link
            to="/wardrobe"
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
          >
            Wardrobe
          </Link>
        </div>
      </div>

      {/* Missing Category Notice */}
      {missing.length > 0 && (
        <div className="rounded-2xl bg-amber-950/40 border border-amber-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-xl">💡</span>
            <span>
              Add <strong className="font-semibold capitalize text-amber-100">{missing.join(', ')}</strong> to complete full outfits with shoes & bottoms.
            </span>
          </div>
          <Link
            to="/wardrobe/add"
            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition flex-shrink-0"
          >
            + Add item
          </Link>
        </div>
      )}

      {/* Exclusions active indicator */}
      {excludeIds.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl">
          <span>
            {excludeIds.length} item{excludeIds.length === 1 ? '' : 's'} temporarily excluded from suggestions
          </span>
          <button
            onClick={handleResetExclusions}
            className="text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
          >
            Reset exclusions
          </button>
        </div>
      )}

      {/* Filters Form */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-end gap-3.5"
      >
        {/* Occasion Select */}
        <div className="flex-1 space-y-1.5">
          <label htmlFor="occasion-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Occasion
          </label>
          <select
            id="occasion-select"
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

        {/* Season Select */}
        <div className="flex-1 space-y-1.5">
          <label htmlFor="season-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Season
          </label>
          <select
            id="season-select"
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

        {/* Submit Button */}
        <div className="sm:flex-shrink-0">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <span>✨</span>
            <span>Suggest outfit</span>
          </button>
        </div>
      </form>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-36 bg-slate-800 rounded-lg" />
                <div className="h-6 w-20 bg-slate-800 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-44 bg-slate-800/60 rounded-xl" />
                ))}
              </div>
              <div className="h-8 w-64 bg-slate-800/40 rounded-xl" />
            </div>
          ))}
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
              Unable to Generate Suggestions
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">{error}</p>
          </div>
          <button
            onClick={() => fetchSuggestions(occasion, season, excludeIds)}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Not Enough Items / Empty State */}
      {!loading && !error && outfits.length === 0 && (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/10">
            ✨
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {emptyMessage || 'No Outfits Found'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
              {excludeIds.length > 0
                ? 'All available pieces are currently in the excluded list.'
                : 'Add more tops, bottoms, dresses, or shoes to generate harmonious outfit suggestions.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {excludeIds.length > 0 && (
              <button
                onClick={handleResetExclusions}
                className="px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                Reset excluded items
              </button>
            )}
            <Link
              to="/wardrobe/add"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              <span>➕</span>
              <span>Add wardrobe item</span>
            </Link>
          </div>
        </div>
      )}

      {/* Suggested Outfits List */}
      {!loading && !error && outfits.length > 0 && (
        <div className="space-y-6">
          {outfits.map((outfit, index) => {
            const outfitState = actionStates[index] || {};
            const matchScorePct = Math.round((outfit.score || 0) * 100);

            return (
              <div
                key={index}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden group hover:border-slate-700 transition"
              >
                {/* Outfit Card Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-sm font-bold">
                      #{index + 1}
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        {occasion ? `${capitalize(occasion)} Outfit` : `Suggested Outfit #${index + 1}`}
                      </h2>
                      <div className="text-xs text-slate-400">
                        {outfit.items.length} pieces coordinated
                      </div>
                    </div>
                  </div>

                  {/* Harmony Score Pill */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Match score:</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {matchScorePct}%
                    </span>
                  </div>
                </div>

                {/* Items Row Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {outfit.items.map((item) => {
                    const emoji = CATEGORY_EMOJI[item.category] || '👕';
                    const dotColor = getColorDot(item.color);

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden flex flex-col group/item hover:border-indigo-500/40 transition"
                      >
                        {/* Image Thumbnail */}
                        <div className="aspect-[4/5] bg-slate-800 relative overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-3xl sm:text-4xl">{emoji}</span>
                          )}
                          {/* Category Tag Overlay */}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-950/80 backdrop-blur-sm text-slate-200 border border-slate-700/60">
                            {item.category}
                          </span>
                        </div>

                        {/* Item Details */}
                        <div className="p-3 space-y-1 min-w-0">
                          <Link
                            to={`/wardrobe/${item.id}/edit`}
                            className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-indigo-300 transition truncate block"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: dotColor }}
                            />
                            <span className="capitalize truncate">{item.color}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reasons Chips Strip */}
                {outfit.reasons && outfit.reasons.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-medium">Why it works:</span>
                    {outfit.reasons.map((reason, rIdx) => (
                      <span
                        key={rIdx}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-500/30"
                      >
                        <span className="mr-1 text-[10px]">✓</span> {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
                  {/* Action 1: Wore this today */}
                  <button
                    onClick={() => handleWoreToday(index)}
                    disabled={outfitState.wearing || outfitState.worn}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition inline-flex items-center space-x-1.5 cursor-pointer ${
                      outfitState.worn
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <span>{outfitState.worn ? '✓' : '👟'}</span>
                    <span>{outfitState.worn ? 'Worn today' : outfitState.wearing ? 'Logging...' : 'Wore this today'}</span>
                  </button>

                  {/* Action 2: Save as outfit */}
                  <button
                    onClick={() => handleSaveOutfit(index)}
                    disabled={outfitState.saving || outfitState.saved}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition inline-flex items-center space-x-1.5 cursor-pointer ${
                      outfitState.saved
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 cursor-default'
                        : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    }`}
                  >
                    <span>{outfitState.saved ? '✓' : '💾'}</span>
                    <span>{outfitState.saved ? 'Saved' : outfitState.saving ? 'Saving...' : 'Save as outfit'}</span>
                  </button>

                  {/* Action 3: Try another */}
                  <button
                    onClick={() => handleTryAnother(index)}
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>🔄</span>
                    <span>Try another</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

