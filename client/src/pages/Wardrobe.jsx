import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { Plus, Shirt, Sparkles, Calendar, AlertCircle, X, Check } from 'lucide-react';
import { getItems, getFilterOptions } from '../api/items.js';
import ItemCard from '../components/ItemCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function Wardrobe() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filter parameters from URL query string
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const color = searchParams.get('color') || '';
  const season = searchParams.get('season') || '';
  const occasion = searchParams.get('occasion') || '';

  const filters = { search, category, color, season, occasion };
  const isFilterActive = Boolean(search || category || color || season || occasion);

  // States
  const [items, setItems] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerMessage, setBannerMessage] = useState(location.state?.message || '');

  // Load available distinct colors for the color filter
  useEffect(() => {
    let isMounted = true;

    async function loadColors() {
      try {
        const data = await getFilterOptions();
        if (isMounted) {
          setAvailableColors(data?.colors || []);
        }
      } catch {
        // Fallback silently if filter colors fail to fetch
      }
    }

    loadColors();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch items whenever URL filter params change; cancel/ignore stale responses
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    async function fetchFilteredItems() {
      try {
        const data = await getItems({
          search,
          category,
          color,
          season,
          occasion,
        });

        if (isMounted) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load wardrobe items');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFilteredItems();

    return () => {
      isMounted = false;
    };
  }, [search, category, color, season, occasion]);

  // Update a single filter in the URL query string
  const handleFilterChange = useCallback(
    (name, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value && typeof value === 'string' && value.trim() !== '') {
            next.set(name, value.trim());
          } else {
            next.delete(name);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Clear all filters from the URL query string
  const handleClearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Remove deleted item from local state without refetching or altering active filters
  const handleItemDeleted = useCallback((deletedId) => {
    setItems((prev) => prev.filter((item) => item.id !== deletedId));
  }, []);

  // Compute 3 KPI metrics: total items, never worn, worn this month
  const stats = useMemo(() => {
    const totalCount = items.length;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const wornThisMonth = items.filter((item) => {
      if (!item.lastWornAt) return false;
      const d = new Date(item.lastWornAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;

    const neverWorn = items.filter((item) => !item.wearCount || item.wearCount === 0).length;

    return {
      totalCount,
      wornThisMonth,
      neverWorn,
    };
  }, [items]);

  return (
    <div className="w-full space-y-6 animate-fade-in-up font-sans">
      {/* Success banner if navigated from AddItem */}
      {bannerMessage && (
        <div
          role="status"
          className="w-full rounded-2xl bg-[#E3F2D9]/90 border border-[#A8D5A2] p-4 text-xs sm:text-sm text-[#4C8A3A] flex items-center justify-between shadow-xs backdrop-blur-xl animate-fade-in-up"
        >
          <div className="flex items-center space-x-2.5">
            <Check className="w-4 h-4 text-[#4C8A3A]" />
            <span className="font-medium">{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage('')}
            aria-label="Dismiss banner"
            className="text-[#4C8A3A] hover:text-[#1E2140] text-xs ml-4 cursor-pointer p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Row: Title with Count Pill & Indigo "New item" Button with Plus Icon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1E2140] tracking-tight">
              My Wardrobe
            </h1>
            {!loading && !error && (
              <Badge variant="primary" size="md" className="font-semibold shadow-xs">
                {isFilterActive
                  ? `Showing ${items.length} ${items.length === 1 ? 'item' : 'items'}`
                  : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#6B7194] mt-1 font-sans">
            Browse, search, and curate your personal clothing collection
          </p>
        </div>

        <Button
          as={Link}
          to="/wardrobe/add"
          variant="primary"
          size="md"
          className="gap-2 shadow-[0_4px_16px_rgba(79,91,213,0.25)] shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New item</span>
        </Button>
      </div>

      {/* Row of 3 Small KPI Cards: Total Items, Never Worn, Worn This Month */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 animate-fade-in-up">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 animate-fade-in-up">
          {/* 1. Total Items */}
          <div className="bg-white/70 border border-white/60 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(99,102,241,0.06)] flex items-center justify-between transition-all duration-200 hover:shadow-[0_12px_36px_rgba(99,102,241,0.10)]">
            <div>
              <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider block">
                Total Items
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1E2140] mt-1">
                {stats.totalCount}
              </div>
              <span className="text-xs text-[#6B7194] mt-0.5 block">
                Pieces in your closet
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center shadow-xs shrink-0">
              <Shirt className="w-6 h-6" />
            </div>
          </div>

          {/* 2. Never Worn */}
          <div className="bg-white/70 border border-white/60 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(99,102,241,0.06)] flex items-center justify-between transition-all duration-200 hover:shadow-[0_12px_36px_rgba(99,102,241,0.10)]">
            <div>
              <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider block">
                Never Worn
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-heading text-[#9A6410] mt-1">
                {stats.neverWorn}
              </div>
              <span className="text-xs text-[#6B7194] mt-0.5 block">
                Awaiting their debut
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FCEBD0] text-[#9A6410] flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          {/* 3. Worn This Month */}
          <div className="bg-white/70 border border-white/60 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(99,102,241,0.06)] flex items-center justify-between transition-all duration-200 hover:shadow-[0_12px_36px_rgba(99,102,241,0.10)]">
            <div>
              <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider block">
                Worn This Month
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-heading text-[#4C8A3A] mt-1">
                {stats.wornThisMonth}
              </div>
              <span className="text-xs text-[#6B7194] mt-0.5 block">
                In active rotation
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E3F2D9] text-[#4C8A3A] flex items-center justify-center shadow-xs shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        availableColors={availableColors}
      />

      {/* Content Area */}
      {loading ? (
        /* Loading Skeletons matching the new ItemCard shape */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-white/70 border border-white/60 p-3 space-y-3 backdrop-blur-xl shadow-[0_10px_30px_rgba(99,102,241,0.06)]"
            >
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <div className="space-y-2 p-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
                <div className="pt-1">
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="pt-1">
                  <Skeleton className="h-10 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State in Light Glassmorphic Style */
        <div className="rounded-3xl bg-white/70 border border-rose-200 p-8 sm:p-12 text-center backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4 animate-fade-in-up">
          <div className="w-14 h-14 rounded-full bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold font-heading text-[#1E2140]">Unable to load wardrobe</h3>
            <p className="text-xs sm:text-sm text-[#6B7194]">{error}</p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setLoading(true);
              setError('');
              getItems({ search, category, color, season, occasion })
                .then((data) => setItems(Array.isArray(data) ? data : []))
                .catch((err) => setError(err.message || 'Failed to load wardrobe items'))
                .finally(() => setLoading(false));
            }}
          >
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        isFilterActive ? (
          /* Empty State: No items match active filters */
          <EmptyState
            icon="🔍"
            title="No matching clothes found"
            description="No items match your active filters. Try adjusting your search query or clearing some filters."
            className="animate-fade-in-up"
          >
            <div className="pt-1 flex justify-center">
              <Button variant="primary" size="md" onClick={handleClearFilters}>
                Clear all filters
              </Button>
            </div>
          </EmptyState>
        ) : (
          /* Empty State: Wardrobe is truly empty */
          <EmptyState
            icon="👗"
            title="Your wardrobe is empty"
            description="Start building your digital closet by adding your favorite tops, bottoms, shoes, dresses, and accessories."
            className="animate-fade-in-up"
          >
            <div className="pt-1 flex justify-center">
              <Button as={Link} to="/wardrobe/add" variant="primary" size="md" className="gap-2">
                <Plus className="w-4 h-4" />
                <span>New item</span>
              </Button>
            </div>
          </EmptyState>
        )
      ) : (
        /* Items Grid with ItemCards in Light Glassmorphism Product Card Style */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
          {items.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              onDelete={handleItemDeleted}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
