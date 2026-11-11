import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getItems } from '../api/items.js';
import { getOutfit, createOutfit, updateOutfit } from '../api/outfits.js';
import { CATEGORIES, OCCASIONS } from '../constants/wardrobe.js';

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
        // Fetch wardrobe items
        const items = await getItems();
        if (!isMounted) return;
        setWardrobeItems(Array.isArray(items) ? items : []);

        // If editing an existing outfit, fetch its current details
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
      // Category filter
      if (categoryFilter && item.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      // Search filter (matches name, fabric, color)
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
  const handleToggleItem = useCallback(
    (item) => {
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
    },
    []
  );

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
      <div className="w-full max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading outfit builder...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100">Unable to Open Builder</h2>
          <p className="text-slate-400 text-sm">{loadError}</p>
        </div>
        <div className="pt-2">
          <Link
            to="/outfits"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
          >
            ← Back to Outfits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <Link to="/outfits" className="hover:text-slate-200 transition">
              Outfits
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-medium">
              {isEdit ? 'Edit Outfit' : 'New Outfit'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {isEdit ? 'Edit Outfit' : 'Outfit Builder'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Select between 2 and 12 pieces from your wardrobe to style a complete look
          </p>
        </div>

        <Link
          to="/outfits"
          className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition self-start sm:self-center"
        >
          ← Cancel
        </Link>
      </div>

      {/* Form Error Alert */}
      {submitError && (
        <div
          role="alert"
          className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-sm text-red-400 flex items-start space-x-2"
        >
          <span className="text-base leading-none">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      {/* Outfit Name & Occasion Inputs */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
            1. Outfit Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Outfit Name */}
            <div className="sm:col-span-2">
              <label htmlFor="outfit-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Outfit Name <span className="text-indigo-400">*</span>
              </label>
              <input
                id="outfit-name"
                type="text"
                required
                disabled={isSubmitting}
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Weekend Brunch, Office Minimalist"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
              />
              <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                <span>Must be between 2 and 60 characters</span>
                <span className={name.trim().length > 60 ? 'text-red-400 font-semibold' : ''}>
                  {name.trim().length}/60
                </span>
              </div>
            </div>

            {/* Occasion */}
            <div>
              <label htmlFor="outfit-occasion" className="block text-xs font-medium text-slate-300 mb-1.5">
                Occasion <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <select
                id="outfit-occasion"
                disabled={isSubmitting}
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
              >
                <option value="">Any Occasion</option>
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {formatLabel(occ)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Preview Strip of Selected Items */}
        <div className="bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <div className="flex items-center space-x-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
                2. Selected Items
              </h2>
              {/* Selected Count Indicator */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                  selectedCount < 2
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : selectedCount <= 12
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}
              >
                {selectedCount} selected, need 2-12
              </span>
            </div>

            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="text-xs text-slate-400 hover:text-red-400 transition self-start sm:self-auto cursor-pointer"
              >
                Clear all ({selectedCount})
              </button>
            )}
          </div>

          {selectedCount === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/40 p-6 text-center space-y-1 select-none">
              <span className="text-2xl">✨</span>
              <p className="text-sm text-slate-300 font-medium">
                No items selected yet
              </p>
              <p className="text-xs text-slate-500">
                Tap items from your wardrobe below to start building your outfit (2 to 12 pieces).
              </p>
            </div>
          ) : (
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {selectedItems.map((item, index) => {
                const categoryKey = item.category?.toLowerCase() || '';
                const emoji = CATEGORY_EMOJI[categoryKey] || '👔';

                return (
                  <div
                    key={item.id}
                    className="relative shrink-0 w-28 sm:w-32 rounded-xl bg-slate-900/90 border border-indigo-500/40 p-2 shadow-md flex flex-col space-y-1.5 group"
                  >
                    {/* Item Thumbnail */}
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl select-none">{emoji}</span>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedItem(item.id)}
                        title="Remove from outfit"
                        aria-label={`Remove ${item.name}`}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/90 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center text-xs transition cursor-pointer border border-slate-700 shadow"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Item Name & Category */}
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium text-slate-200 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 capitalize">
                        <span>{item.category}</span>
                        <span className="text-[9px] font-mono text-indigo-400 font-semibold">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Wardrobe Grid with Search & Category Filters */}
        <div className="bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
                3. Choose From Wardrobe
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tap any item to add or remove it from your outfit
              </p>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Showing {filteredWardrobeItems.length} of {wardrobeItems.length} items
            </span>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items by name, color, fabric..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs sm:text-sm transition"
              />
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs select-none">
                🔍
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Select */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs sm:text-sm transition"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Wardrobe Grid */}
          {wardrobeItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/30 p-8 text-center space-y-3">
              <span className="text-3xl">👗</span>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">
                  Your wardrobe is empty
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add items to your wardrobe first so you can start assembling outfits.
                </p>
              </div>
              <Link
                to="/wardrobe/add"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-lg shadow-indigo-600/20"
              >
                + Add Wardrobe Items
              </Link>
            </div>
          ) : filteredWardrobeItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/30 p-8 text-center space-y-2">
              <span className="text-2xl">🔍</span>
              <p className="text-sm font-semibold text-slate-300">
                No items match your filter
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredWardrobeItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);
                const categoryKey = item.category?.toLowerCase() || '';
                const emoji = CATEGORY_EMOJI[categoryKey] || '👗';

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
                    className={`relative rounded-xl overflow-hidden border cursor-pointer select-none transition-all duration-150 flex flex-col ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-500/10'
                        : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900/90'
                    }`}
                  >
                    {/* Item Image (fixed 4:5 aspect ratio) */}
                    <div className="relative aspect-[4/5] w-full bg-slate-950/80 overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-b from-slate-800 to-slate-900">
                          <span className="text-3xl filter drop-shadow">{emoji}</span>
                        </div>
                      )}

                      {/* Checkmark Badge */}
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/40 scale-105'
                            : 'bg-slate-900/80 border border-slate-600 text-transparent text-[10px]'
                        }`}
                      >
                        ✓
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-indigo-400 uppercase tracking-wider font-medium">
                        <span>{item.category}</span>
                        <span className="capitalize text-slate-400">{item.color}</span>
                      </div>
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-indigo-200' : 'text-slate-200'
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
        </div>

        {/* Save Bar */}
        <div className="sticky bottom-4 z-20 rounded-2xl bg-slate-900/95 border border-slate-700 backdrop-blur-md p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-200">
                {isEdit ? 'Update Outfit' : 'Create Outfit'}:
              </span>
              <span className="text-sm text-slate-300 font-medium truncate max-w-[200px]">
                {name.trim() || 'Untitled'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {selectedCount < 2 ? (
                <span className="text-amber-400 font-medium">
                  Select at least {2 - selectedCount} more {2 - selectedCount === 1 ? 'item' : 'items'} to save
                </span>
              ) : selectedCount > 12 ? (
                <span className="text-red-400 font-medium">
                  Please remove {selectedCount - 12} {selectedCount - 12 === 1 ? 'item' : 'items'} (maximum 12)
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">
                  ✓ Ready to save ({selectedCount} items selected)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/outfits"
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm transition border border-slate-700 text-center cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving outfit...</span>
                </>
              ) : (
                <span>{isEdit ? 'Save Changes' : 'Save Outfit'}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

