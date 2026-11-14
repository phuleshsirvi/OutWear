import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, X, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { getItems } from '../api/items.js';
import { getOutfit, createOutfit, updateOutfit } from '../api/outfits.js';
import { CATEGORIES, OCCASIONS } from '../constants/wardrobe.js';
import { getColorInfo } from '../constants/colors.js';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, Badge, EmptyState } from '../components/ui/index.js';

function formatLabel(str) {
  if (!str) return '';
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

const CATEGORY_EMOJI = {
  top: '👕',
  bottom: '👖',
  dress: '👗',
  ethnic: '🥻',
  outerwear: '🧥',
  shoes: '👟',
  accessory: '👜',
};

export default function OutfitBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Form states
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // Wardrobe inventory & page loading states
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Search & Category filter inside the builder
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Submit states
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load wardrobe items (and outfit details if edit mode)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError('');

    async function loadData() {
      try {
        const items = await getItems();
        if (!isMounted) return;
        setWardrobeItems(Array.isArray(items) ? items : []);

        if (isEdit) {
          const outfit = await getOutfit(id);
          if (!isMounted) return;
          setName(outfit.name || '');
          setOccasion(outfit.occasion || '');
          setSelectedItems(Array.isArray(outfit.items) ? outfit.items : []);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.status === 404) {
          setLoadError('Outfit not found or does not belong to you.');
        } else {
          setLoadError(err.message || 'Failed to load data for outfit builder.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  // Selected item IDs set for fast O(1) membership checks
  const selectedItemIds = useMemo(() => {
    return new Set(selectedItems.map((item) => item.id));
  }, [selectedItems]);

  // Filter wardrobe items for the grid by search and category
  const filteredWardrobeItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wardrobeItems.filter((item) => {
      if (categoryFilter && item.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (q) {
        const matchName = item.name?.toLowerCase().includes(q);
        const matchFabric = item.fabric?.toLowerCase().includes(q);
        const matchColor = item.color?.toLowerCase().includes(q);
        if (!matchName && !matchFabric && !matchColor) {
          return false;
        }
      }
      return true;
    });
  }, [wardrobeItems, search, categoryFilter]);

  // Toggle item selection
  const handleToggleItem = useCallback((item) => {
    setSubmitError('');
    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        if (prev.length >= 12) {
          setSubmitError('Maximum 12 items allowed per outfit.');
          return prev;
        }
        return [...prev, item];
      }
    });
  }, []);

  // Remove single item from selected list
  const handleRemoveSelectedItem = useCallback((itemId) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // Validation
  const selectedCount = selectedItems.length;
  const isNameValid = name.trim().length >= 2 && name.trim().length <= 60;
  const isCountValid = selectedCount >= 2 && selectedCount <= 12;
  const isFormValid = isNameValid && isCountValid;

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        occasion: occasion ? occasion.trim().toLowerCase() : undefined,
        itemIds: selectedItems.map((i) => i.id),
      };

      if (isEdit) {
        await updateOutfit(id, payload);
        navigate('/outfits', {
          state: { message: `"${name.trim()}" outfit updated successfully!` },
        });
      } else {
        await createOutfit(payload);
        navigate('/outfits', {
          state: { message: `"${name.trim()}" outfit created successfully!` },
        });
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to save outfit. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 flex flex-col items-center justify-center space-y-4 font-sans animate-fade-in-up">
        <div className="w-10 h-10 border-4 border-[#4F5BD5]/20 border-t-[#4F5BD5] rounded-full animate-spin" />
        <p className="text-[#6B7194] text-sm">Loading outfit builder...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-md mx-auto py-16 text-center space-y-4 font-sans animate-fade-in-up">
        <div className="rounded-3xl bg-white/75 border border-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-heading text-[#1E2140]">Unable to Open Builder</h2>
            <p className="text-[#6B7194] text-sm">{loadError}</p>
          </div>
          <div className="pt-2">
            <Button as={Link} to="/outfits" variant="primary">
              ← Back to Outfits
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-6 font-sans animate-fade-in-up">
      {/* Top Header */}
      <div className="bg-white/75 border border-white/70 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-semibold text-[#6B7194]">
            <Link to="/outfits" className="hover:text-[#4F5BD5] transition-colors">
              Outfits
            </Link>
            <span>/</span>
            <span className="text-[#1E2140] font-bold">
              {isEdit ? 'Edit Outfit' : 'New Outfit'}
            </span>
          </nav>
          <div className="flex items-center gap-3 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center text-2xl shadow-xs shrink-0">
              ✨
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-[#1E2140] tracking-tight">
                {isEdit ? 'Edit Outfit' : 'Outfit Builder'}
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7194]">
                Select between 2 and 12 pieces from your wardrobe to style a complete look
              </p>
            </div>
          </div>
        </div>

        <Button as={Link} to="/outfits" variant="secondary" size="sm" className="self-start sm:self-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </Button>
      </div>

      {/* Form Error Alert */}
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl bg-[#FBE3DC] border border-rose-300 p-4 text-xs sm:text-sm text-[#C2492E] flex items-start space-x-3 shadow-xs"
        >
          <span className="text-base leading-none">⚠️</span>
          <span className="font-semibold">{submitError}</span>
        </div>
      )}

      {/* STICKY GLASS PREVIEW STRIP AT TOP */}
      <div className="sticky top-18 sm:top-20 z-30 bg-white/80 backdrop-blur-xl border border-white/70 rounded-3xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(99,102,241,0.12)] space-y-4">
        {/* Strip Header: Counter Pill (turns green when valid) + Clear button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3E6FB]/80 pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7194] font-heading">
              Curated Look
            </span>

            {/* Selection counter pill that turns green when valid */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 border shadow-xs ${
                isCountValid
                  ? 'bg-[#E3F2D9] text-[#4C8A3A] border-[#A8D5A2]'
                  : selectedCount < 2
                  ? 'bg-[#FCEBD0] text-[#9A6410] border-[#F5C98A]'
                  : 'bg-[#FBE3DC] text-[#C2492E] border-rose-300'
              }`}
            >
              {isCountValid
                ? `✓ ${selectedCount} of 12 items (Ready!)`
                : selectedCount < 2
                ? `${selectedCount} / 12 items (Pick at least 2)`
                : `Too many: ${selectedCount} / 12 items (Max 12)`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="text-xs text-[#6B7194] hover:text-[#C2492E] transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-50 font-semibold"
              >
                Clear all ({selectedCount})
              </button>
            )}
          </div>
        </div>

        {/* Overlapping Rounded Tiles Strip */}
        <div className="min-h-[70px] flex items-center">
          {selectedCount === 0 ? (
            <div className="w-full py-3.5 px-4 rounded-2xl border border-dashed border-[#E3E6FB] bg-white/50 text-center text-xs text-[#6B7194] flex items-center justify-center space-x-2">
              <span className="text-base">✨</span>
              <span>No items selected yet. Tap pieces from your wardrobe below to start styling.</span>
            </div>
          ) : (
            <div className="w-full flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none">
              {/* Overlapping tiles container */}
              <div className="flex items-center -space-x-3 sm:-space-x-4 pl-1 hover:space-x-1 transition-all duration-200">
                {selectedItems.map((item, idx) => {
                  const categoryKey = item.category?.toLowerCase() || '';
                  const emoji = CATEGORY_EMOJI[categoryKey] || '👔';

                  return (
                    <div
                      key={item.id}
                      className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white shadow-[0_4px_16px_rgba(99,102,241,0.15)] group shrink-0 bg-white transition-transform duration-200 hover:scale-110 hover:z-30 cursor-pointer"
                      onClick={() => handleRemoveSelectedItem(item.id)}
                      title={`Remove "${item.name}"`}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-white/60">
                          <span className="text-xl sm:text-2xl">{emoji}</span>
                        </div>
                      )}

                      {/* Number badge */}
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-white bg-black/60 px-1 rounded">
                        #{idx + 1}
                      </span>

                      {/* Hover Remove Overlay */}
                      <div className="absolute inset-0 bg-[#C2492E]/80 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-[#6B7194] shrink-0 pl-3">
                Click any tile to remove
              </div>
            </div>
          )}
        </div>

        {/* Outfit Name, Occasion & Save Button Row */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-end">
          <div className="sm:col-span-6">
            <Input
              id="outfit-name"
              label="Outfit Name"
              required
              disabled={isSubmitting}
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Weekend Brunch, Minimalist Monday"
              helperText={`${name.trim().length}/60 chars (min 2)`}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              id="outfit-occasion"
              label="Occasion"
              disabled={isSubmitting}
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              helperText="Optional context tag"
            >
              <option value="">Any Occasion</option>
              {OCCASIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {formatLabel(occ)}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!isFormValid || isSubmitting}
              loading={isSubmitting}
              className="w-full shadow-[0_4px_16px_rgba(79,91,213,0.25)]"
            >
              <span>{isEdit ? 'Save Changes' : 'Save Outfit'}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* WARDROBE SELECTION GRID */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Choose from Wardrobe</CardTitle>
              <CardDescription>
                Tap pieces to add or remove them from this outfit
              </CardDescription>
            </div>
            <Badge variant="primary" size="sm">
              Showing {filteredWardrobeItems.length} of {wardrobeItems.length} items
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search & Category Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pieces by name, color, fabric..."
                prefixIcon={<Search className="w-4 h-4 text-[#6B7194]" />}
                suffixIcon={
                  search ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                      className="text-[#6B7194] hover:text-[#1E2140] cursor-pointer pointer-events-auto min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null
                }
              />
            </div>

            <div>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatLabel(cat)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Wardrobe Items Grid */}
          {wardrobeItems.length === 0 ? (
            <EmptyState
              icon="👗"
              title="Your wardrobe is empty"
              description="Add clothes to your wardrobe first so you can start assembling outfits."
              actionText="Add Wardrobe Items"
              actionLink="/wardrobe/add"
              actionAs={Link}
            />
          ) : filteredWardrobeItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E3E6FB] bg-white/40 p-8 text-center space-y-2">
              <span className="text-2xl">🔍</span>
              <p className="text-sm font-semibold font-heading text-[#1E2140]">
                No items match your filter
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredWardrobeItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);
                const categoryKey = item.category?.toLowerCase() || '';
                const emoji = CATEGORY_EMOJI[categoryKey] || '👗';
                const colorInfo = getColorInfo(item.color);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleItem(item);
                      }
                    }}
                    className={`relative rounded-2xl overflow-hidden border cursor-pointer select-none transition-all duration-200 flex flex-col group ${
                      isSelected
                        ? 'border-[#4F5BD5] ring-3 ring-[#4F5BD5]/30 bg-white shadow-[0_8px_25px_rgba(79,91,213,0.18)] -translate-y-0.5'
                        : 'border-white/80 bg-white/70 hover:border-white hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Item Image with 4:5 aspect ratio */}
                    <div className="relative aspect-[4/5] w-full bg-white/40 overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-white/50">
                          <span className="text-3xl filter drop-shadow-xs">{emoji}</span>
                        </div>
                      )}

                      {/* Soft gradient overlay at bottom of photo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                      {/* Indigo Check Badge */}
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#4F5BD5] text-white font-bold text-xs shadow-md shadow-[#4F5BD5]/40 scale-105'
                            : 'bg-white/80 border border-white/90 text-transparent text-[10px]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#4F5BD5] font-bold uppercase tracking-wider">
                          {item.category}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-xs"
                            style={{ backgroundColor: colorInfo.hex }}
                          />
                          <span className="capitalize text-[#6B7194] truncate max-w-[60px]">
                            {item.color}
                          </span>
                        </div>
                      </div>

                      <p
                        className={`text-xs font-semibold font-heading truncate ${
                          isSelected ? 'text-[#4F5BD5]' : 'text-[#1E2140]'
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </p>
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
