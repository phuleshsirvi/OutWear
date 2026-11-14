import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle2, AlertCircle, AlertOctagon } from 'lucide-react';
import { CATEGORIES, OCCASIONS, SEASONS } from '../constants/wardrobe.js';
import { getFilterOptions } from '../api/items.js';
import { checkDuplicate } from '../api/duplicates.js';
import { getColorInfo } from '../constants/colors.js';
import { Button, StatusPill, Input, Select, Skeleton } from '../components/ui/index.js';

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

  const activeColorInfo = color.trim() ? getColorInfo(color) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-[#1E2140] flex items-center gap-2.5">
            <span>🛍️</span>
            <span>Before You Buy</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7194] mt-1 font-sans">
            Check your closet before buying to prevent duplicate purchases and buyer's remorse
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button as={Link} to="/wardrobe" variant="secondary" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Wardrobe</span>
          </Button>
          <Button as={Link} to="/underused" variant="ghost" size="sm">
            Underused Items
          </Button>
        </div>
      </div>

      {/* FORM CARD */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/75 border border-white/70 rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(99,102,241,0.08)] space-y-4 backdrop-blur-xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Category Select */}
          <div>
            <Select
              id="buy-category"
              label="Category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_EMOJI[cat] || '👕'} {capitalize(cat)}
                </option>
              ))}
            </Select>
          </div>

          {/* Color Input with Datalist */}
          <div className="relative">
            <Input
              id="buy-color"
              label="Color"
              required
              list="owned-colors"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Black, Navy, Maroon"
              aria-label="Color"
              suffixIcon={
                activeColorInfo ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-xs"
                    style={{ backgroundColor: activeColorInfo.hex }}
                  />
                ) : null
              }
            />
            <datalist id="owned-colors">
              {ownedColors.map((c) => (
                <option key={c} value={capitalize(c)} />
              ))}
            </datalist>
          </div>

          {/* Occasion (Optional) */}
          <div>
            <Select
              id="buy-occasion"
              label="Occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              aria-label="Occasion"
            >
              <option value="">Any Occasion</option>
              {OCCASIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {capitalize(occ)}
                </option>
              ))}
            </Select>
          </div>

          {/* Season (Optional) */}
          <div>
            <Select
              id="buy-season"
              label="Season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              aria-label="Season"
            >
              <option value="">Any Season</option>
              {SEASONS.map((sea) => (
                <option key={sea} value={sea}>
                  {capitalize(sea)}
                </option>
              ))}
            </Select>
          </div>

          {/* Fabric (Optional) */}
          <div>
            <Input
              id="buy-fabric"
              label="Fabric"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              placeholder="e.g. Cotton, Linen, Wool"
              maxLength={40}
              aria-label="Fabric"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !color.trim()}
            loading={loading}
            className="w-full sm:w-auto shadow-[0_4px_16px_rgba(79,91,213,0.25)] font-bold gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Check My Wardrobe</span>
          </Button>
        </div>
      </form>

      {/* Initial Idle State (Before search) */}
      {!hasSearched && !loading && (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center text-3xl shadow-xs">
            🧐
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-heading text-[#1E2140]">Smart Wardrobe Check</h2>
            <p className="text-sm text-[#6B7194] max-w-md mx-auto">
              Thinking about buying something new? Select the category and color above to instantly check your existing closet for duplicates or neglected pieces.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-3xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
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
                Duplicate Check Failed
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7194]">{error}</p>
            </div>
            <Button variant="primary" onClick={handleSubmit}>
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!loading && !error && result && (
        <div className="space-y-6">
          {/* VERDICT BANNER IN A SOFT TINTED CARD:
              Green (go), Amber (think), Red (skip) with icon and clear text */}
          <div
            className={`rounded-3xl p-6 sm:p-7 border flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 backdrop-blur-xl shadow-xs transition-all ${
              result.verdict.level === 'go'
                ? 'bg-[#E3F2D9]/90 border-[#A8D5A2] text-[#4C8A3A]'
                : result.verdict.level === 'think'
                ? 'bg-[#FCEBD0]/90 border-[#F5C98A] text-[#9A6410]'
                : 'bg-[#FBE3DC]/90 border-rose-300 text-[#C2492E]'
            }`}
          >
            {/* Verdict Icon Circle */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs ${
                result.verdict.level === 'go'
                  ? 'bg-white text-[#4C8A3A]'
                  : result.verdict.level === 'think'
                  ? 'bg-white text-[#9A6410]'
                  : 'bg-white text-[#C2492E]'
              }`}
            >
              {result.verdict.level === 'go' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : result.verdict.level === 'think' ? (
                <AlertCircle className="w-8 h-8" />
              ) : (
                <AlertOctagon className="w-8 h-8" />
              )}
            </div>

            {/* Verdict Text */}
            <div className="space-y-1 min-w-0 flex-1">
              <span
                className={`text-xs font-black uppercase tracking-wider block font-heading ${
                  result.verdict.level === 'go'
                    ? 'text-[#4C8A3A]'
                    : result.verdict.level === 'think'
                    ? 'text-[#9A6410]'
                    : 'text-[#C2492E]'
                }`}
              >
                {result.verdict.level === 'go'
                  ? 'Verdict: Go for it!'
                  : result.verdict.level === 'think'
                  ? 'Verdict: Think twice'
                  : 'Verdict: Skip this purchase'}
              </span>

              <h2 className="text-lg sm:text-xl font-bold font-heading leading-snug text-[#1E2140]">
                {result.verdict.message}
              </h2>
            </div>
          </div>

          {/* Stats Breakdown Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <div className="bg-white/75 border border-white/70 rounded-2xl p-4 text-center shadow-xs">
              <div className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading">
                Exact Matches
              </div>
              <div className="text-2xl font-black font-heading text-[#1E2140] mt-1">
                {result.exactCount}
              </div>
            </div>

            <div className="bg-white/75 border border-white/70 rounded-2xl p-4 text-center shadow-xs">
              <div className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading">
                Similar Items
              </div>
              <div className="text-2xl font-black font-heading text-[#4F5BD5] mt-1">
                {result.similarCount}
              </div>
            </div>

            <div className="bg-white/75 border border-white/70 rounded-2xl p-4 text-center shadow-xs">
              <div className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading">
                Total in Category
              </div>
              <div className="text-2xl font-black font-heading text-[#1E2140] mt-1">
                {result.stats.totalInCategory}
              </div>
            </div>

            <div className="bg-white/75 border border-white/70 rounded-2xl p-4 text-center shadow-xs">
              <div className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading">
                Worn Often (≥5)
              </div>
              <div className="text-2xl font-black font-heading text-[#4C8A3A] mt-1">
                {result.stats.wornOften}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white/75 border border-white/70 rounded-2xl p-4 text-center shadow-xs">
              <div className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider font-heading">
                Rarely Worn (≤1)
              </div>
              <div className="text-2xl font-black font-heading text-[#C2492E] mt-1">
                {result.stats.rarelyWorn}
              </div>
            </div>
          </div>

          {/* MATCHING ITEMS IN THE PRODUCT CARD STYLE */}
          {result.matches.length === 0 ? (
            <div className="bg-white/75 border border-white/70 rounded-3xl p-10 text-center space-y-3 shadow-xs backdrop-blur-xl">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-bold font-heading text-[#1E2140]">
                No Existing Duplicates Found
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7194] max-w-md mx-auto">
                You don't currently have anything similar to this {color} {category}. Adding it will expand your wardrobe palette!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6B7194] px-1">
                <span className="font-bold text-[#1E2140] uppercase tracking-wider font-heading">
                  Similar Items in Your Wardrobe ({result.matches.length})
                </span>
                <span className="font-mono">Ranked by similarity</span>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {result.matches.map((item) => {
                  const emoji = CATEGORY_EMOJI[item.category] || '👕';
                  const colorInfo = getColorInfo(item.color);
                  const matchPct = Math.round(item.score * 100);

                  return (
                    <div
                      key={item.id}
                      className="bg-white/75 border border-white/70 hover:border-white rounded-3xl overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1 shadow-[0_10px_30px_rgba(99,102,241,0.06)] hover:shadow-[0_14px_40px_rgba(99,102,241,0.12)] backdrop-blur-xl p-3 space-y-3"
                    >
                      {/* Product Card Inner Frame (aspect 4/5) */}
                      <div className="aspect-[4/5] bg-white/40 rounded-2xl relative overflow-hidden flex items-center justify-center border border-white/60">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-white/50">
                            <span className="text-4xl filter drop-shadow-xs">{emoji}</span>
                          </div>
                        )}

                        {/* Soft bottom gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                        {/* Top Match Badge: "Exact match" and "Similar" pills */}
                        <div className="absolute top-2.5 left-2.5">
                          <StatusPill
                            variant={item.matchType === 'exact' ? 'green' : 'blue'}
                            size="sm"
                            dot
                            className="shadow-xs"
                          >
                            {item.matchType === 'exact' ? 'Exact match' : 'Similar'}
                          </StatusPill>
                        </div>

                        {/* Similarity Score Tag */}
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-black font-mono bg-white/90 backdrop-blur-md text-[#1E2140] border border-white/90 shadow-2xs">
                          {matchPct}% match
                        </span>
                      </div>

                      {/* Content Details */}
                      <div className="p-1 flex-1 flex flex-col justify-between space-y-2.5">
                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/wardrobe/${item.id}/edit`}
                            className="text-xs sm:text-sm font-bold font-heading text-[#1E2140] group-hover:text-[#4F5BD5] transition-colors truncate block"
                            title={item.name}
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center space-x-1.5 text-xs text-[#6B7194] min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                              style={{ backgroundColor: colorInfo.hex }}
                            />
                            <span className="capitalize truncate">{item.color}</span>
                          </div>
                        </div>

                        {/* Usage Metrics */}
                        <div className="pt-2 border-t border-[#E3E6FB]/80 text-[11px] text-[#6B7194] space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Wear count:</span>
                            <span
                              className={`font-semibold font-mono ${
                                item.wearCount >= 5
                                  ? 'text-[#4C8A3A]'
                                  : item.wearCount <= 1
                                  ? 'text-[#C2492E]'
                                  : 'text-[#1E2140]'
                              }`}
                            >
                              {item.wearCount} {item.wearCount === 1 ? 'time' : 'times'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#6B7194] truncate">
                            {formatLastWorn(item.lastWornAt)}
                          </div>
                        </div>

                        {/* View in Wardrobe Button */}
                        <div className="pt-1">
                          <Button
                            as={Link}
                            to={`/wardrobe/${item.id}/edit`}
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            View in wardrobe
                          </Button>
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
