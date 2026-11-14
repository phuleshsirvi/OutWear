import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, RotateCcw, Check, Bookmark, ArrowLeft, AlertCircle } from 'lucide-react';
import { OCCASIONS, SEASONS } from '../constants/wardrobe.js';
import { getSuggestions } from '../api/suggestions.js';
import { logItemWear } from '../api/wear.js';
import { createOutfit } from '../api/outfits.js';
import { getColorInfo } from '../constants/colors.js';
import { Button, Badge, Toast, EmptyState, Skeleton, Select, IconButton } from '../components/ui/index.js';

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

// Pastel accent variants for reason chips
const REASON_VARIANTS = ['lavender', 'blue', 'green', 'amber'];

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatLabel(str) {
  if (!str) return '';
  return str.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

/**
 * Circular progress ring component showing outfit score
 */
function ScoreRing({ score = 0, size = 52, strokeWidth = 4 }) {
  const pct = Math.round(score * 100);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
      title={`Outfit harmony score: ${pct}%`}
    >
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E3E6FB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4F5BD5"
          className="transition-all duration-700 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-extrabold font-mono text-[#1E2140] leading-none">
          {pct}%
        </span>
        <span className="text-[8px] text-[#4F5BD5] font-bold tracking-tighter uppercase leading-none mt-0.5">
          Match
        </span>
      </div>
    </div>
  );
}

export default function Suggest() {
  const [searchParams, setSearchParams] = useSearchParams();
  const carouselRef = useRef(null);

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
  const [actionStates, setActionStates] = useState({});

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
  }, [occasionParam, seasonParam, fetchSuggestions, excludeIds]);

  // Scroll controls for desktop carousel
  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = direction === 'left' ? -480 : 480;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Handle filter submission
  const handleFilterSubmit = (e) => {
    e?.preventDefault();
    const newParams = {};
    if (occasion) newParams.occasion = occasion;
    if (season) newParams.season = season;

    setSearchParams(newParams);
    setExcludeIds([]);
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
        ? `${capitalize(occasion)} Look`
        : `Suggested Look #${outfitIndex + 1}`;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans animate-fade-in-up">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-[#1E2140] flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-[#4F5BD5]" />
            <span>Outfit Suggestions</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7194] mt-1 font-sans">
            Smart wardrobe combinations scored by color harmony, occasion, and freshness
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button as={Link} to="/outfits" variant="secondary" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>My Outfits</span>
          </Button>
          <Button as={Link} to="/wardrobe" variant="ghost" size="sm">
            Wardrobe
          </Button>
        </div>
      </div>

      {/* Missing Category Notice */}
      {missing.length > 0 && (
        <div className="rounded-3xl bg-[#FCEBD0]/90 border border-[#F5C98A] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#9A6410] backdrop-blur-xl shadow-xs">
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-2xl">💡</span>
            <span>
              Add <strong className="font-bold capitalize text-[#1E2140]">{missing.join(', ')}</strong> to unlock more complete looks with shoes & bottoms.
            </span>
          </div>
          <Button as={Link} to="/wardrobe/add" variant="secondary" size="sm" className="shrink-0">
            + Add item
          </Button>
        </div>
      )}

      {/* Exclusions active indicator */}
      {excludeIds.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[#6B7194] bg-white/70 border border-white/80 px-4 py-2.5 rounded-2xl shadow-xs backdrop-blur-md">
          <span>
            {excludeIds.length} {excludeIds.length === 1 ? 'item' : 'items'} temporarily excluded from suggestions
          </span>
          <button
            type="button"
            onClick={handleResetExclusions}
            className="text-[#4F5BD5] hover:text-[#3B5FB0] font-bold underline cursor-pointer"
          >
            Reset exclusions
          </button>
        </div>
      )}

      {/* Filters Form with Selects and Indigo "Suggest Outfit" Button */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white/75 border border-white/70 rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex flex-col sm:flex-row sm:items-end gap-4 backdrop-blur-xl"
      >
        {/* Occasion Select */}
        <div className="flex-1">
          <Select
            id="occasion-select"
            label="Occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            aria-label="Filter by occasion"
          >
            <option value="">Any Occasion</option>
            {OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>
                {formatLabel(occ)}
              </option>
            ))}
          </Select>
        </div>

        {/* Season Select */}
        <div className="flex-1">
          <Select
            id="season-select"
            label="Season"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            aria-label="Filter by season"
          >
            <option value="">Any Season</option>
            {SEASONS.map((sea) => (
              <option key={sea} value={sea}>
                {formatLabel(sea)}
              </option>
            ))}
          </Select>
        </div>

        {/* Indigo "Suggest outfit" Button with Sparkle Icon */}
        <div className="sm:shrink-0">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto shadow-[0_4px_16px_rgba(79,91,213,0.25)] font-bold gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Suggest Outfit</span>
          </Button>
        </div>
      </form>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex items-stretch gap-6 overflow-hidden">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="w-[88vw] sm:w-[500px] shrink-0 bg-white/70 border border-white/60 rounded-3xl p-6 space-y-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-44 rounded-xl" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <div className="flex space-x-3 overflow-hidden">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-44 w-32 rounded-2xl shrink-0" />
                ))}
              </div>
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans animate-fade-in-up">
          <div className="rounded-3xl bg-white/75 border border-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-heading text-[#1E2140]">
                Unable to Generate Suggestions
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7194]">{error}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => fetchSuggestions(occasion, season, excludeIds)}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && outfits.length === 0 && (
        <EmptyState
          icon="✨"
          title={emptyMessage || 'No Outfits Found'}
          description={
            excludeIds.length > 0
              ? 'All available pieces are currently in the excluded list.'
              : 'Add more tops, bottoms, dresses, or shoes to generate harmonious outfit suggestions.'
          }
          actionText="Add wardrobe item"
          actionLink="/wardrobe/add"
          actionAs={Link}
        >
          {excludeIds.length > 0 && (
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetExclusions}
              >
                Reset excluded items
              </Button>
            </div>
          )}
        </EmptyState>
      )}

      {/* OUTFIT RESULTS: HORIZONTAL ROW OF GLASS CARDS (CAROUSEL WITH ARROWS ON DESKTOP, SWIPE ON MOBILE) */}
      {!loading && !error && outfits.length > 0 && (
        <div className="space-y-3">
          {/* Carousel Header with Navigation Arrows on Desktop */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7194] font-heading">
                Recommended Looks ({outfits.length})
              </span>
              <span className="text-xs text-[#6B7194]">· Swipe or scroll to explore</span>
            </div>

            {/* Desktop Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-2">
              <IconButton
                onClick={() => scrollCarousel('left')}
                aria-label="Previous outfit suggestion"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 text-[#1E2140]" />
              </IconButton>
              <IconButton
                onClick={() => scrollCarousel('right')}
                aria-label="Next outfit suggestion"
                size="sm"
              >
                <ChevronRight className="w-4 h-4 text-[#1E2140]" />
              </IconButton>
            </div>
          </div>

          {/* Carousel Scroll Container */}
          <div
            ref={carouselRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none px-1"
          >
            {outfits.map((outfit, index) => {
              const outfitState = actionStates[index] || {};

              return (
                <div
                  key={index}
                  className="snap-start shrink-0 w-[90vw] sm:w-[480px] lg:w-[540px] bg-white/75 border border-white/70 hover:border-white rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(99,102,241,0.08)] hover:shadow-[0_14px_45px_rgba(99,102,241,0.14)] backdrop-blur-xl flex flex-col justify-between space-y-5 transition-all duration-300 font-sans"
                >
                  {/* Card Header with Score Ring */}
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#E3E6FB]/80">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center text-xs font-black font-mono shadow-xs shrink-0">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold font-heading text-[#1E2140] truncate">
                          {occasion ? `${capitalize(occasion)} Outfit` : `Curated Look #${index + 1}`}
                        </h2>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <Badge variant="primary" size="sm">
                            {outfit.items.length} pieces coordinated
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Small Score Ring in Corner */}
                    <ScoreRing score={outfit.score} size={50} strokeWidth={4} />
                  </div>

                  {/* Item Photos & Names */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {outfit.items.map((item) => {
                        const emoji = CATEGORY_EMOJI[item.category] || '👕';
                        const colorInfo = getColorInfo(item.color);

                        return (
                          <div
                            key={item.id}
                            className="w-28 sm:w-32 shrink-0 rounded-2xl overflow-hidden bg-white/60 border border-white/90 shadow-xs flex flex-col group/item transition-transform hover:-translate-y-0.5"
                          >
                            {/* Photo with 4:5 aspect ratio */}
                            <div className="aspect-[4/5] bg-white/40 relative overflow-hidden flex items-center justify-center">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <span className="text-3xl select-none">{emoji}</span>
                              )}
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/80 backdrop-blur-md text-[#1E2140] border border-white/80">
                                {item.category}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="p-2 space-y-0.5 bg-white/80 min-w-0">
                              <Link
                                to={`/wardrobe/${item.id}/edit`}
                                className="text-xs font-bold font-heading text-[#1E2140] hover:text-[#4F5BD5] transition-colors truncate block"
                                title={item.name}
                              >
                                {item.name}
                              </Link>
                              <div className="flex items-center space-x-1 text-[10px] text-[#6B7194]">
                                <span
                                  className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: colorInfo.hex }}
                                />
                                <span className="capitalize truncate">{item.color}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reason Chips as Pastel Pills */}
                  {outfit.reasons && outfit.reasons.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading block">
                        Why this works:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {outfit.reasons.map((reason, rIdx) => {
                          const variant = REASON_VARIANTS[rIdx % REASON_VARIANTS.length];
                          return (
                            <Badge
                              key={rIdx}
                              variant={variant}
                              size="sm"
                              dot
                            >
                              {reason}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Three Actions: Wore this today, Save as outfit, Try another */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-[#E3E6FB]/80">
                    {/* Action 1: Wore this today */}
                    <Button
                      variant={outfitState.worn ? 'secondary' : 'primary'}
                      size="md"
                      onClick={() => handleWoreToday(index)}
                      disabled={outfitState.wearing || outfitState.worn}
                      loading={outfitState.wearing}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>{outfitState.worn ? 'Worn Today' : 'Wore this today'}</span>
                    </Button>

                    {/* Action 2: Save as outfit */}
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleSaveOutfit(index)}
                      disabled={outfitState.saving || outfitState.saved}
                      loading={outfitState.saving}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      <Bookmark className="w-4 h-4 text-[#4F5BD5]" />
                      <span>{outfitState.saved ? 'Saved' : 'Save as outfit'}</span>
                    </Button>

                    {/* Action 3: Try another */}
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => handleTryAnother(index)}
                      className="gap-1.5 text-xs sm:text-sm text-[#6B7194] hover:text-[#1E2140]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Try another</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
