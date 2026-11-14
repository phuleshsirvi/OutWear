import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { SEASONS, OCCASIONS } from '../constants/wardrobe.js';
import { getColorInfo } from '../constants/colors.js';
import PillTabs from './ui/PillTabs.jsx';
import Select from './ui/Select.jsx';

function formatLabel(str) {
  if (!str) return '';
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

const CATEGORY_TABS = [
  { id: '', label: 'All' },
  { id: 'top', label: 'Tops' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'dress', label: 'Dresses' },
  { id: 'ethnic', label: 'Ethnic' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessory', label: 'Accessories' },
];

export default function FilterBar({
  filters = { search: '', category: '', color: '', season: '', occasion: '' },
  onFilterChange,
  onClearFilters,
  availableColors = [],
}) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Synchronize local search input when external search filter changes
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Debounce search input by 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== searchInput.trim()) {
        onFilterChange('search', searchInput.trim());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFilterChange]);

  // Calculate active filters array for removable chips
  const activeFilters = Object.entries(filters)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(([key, value]) => ({ key, value }));

  const activeCount = activeFilters.length;

  const handleClear = () => {
    setSearchInput('');
    onClearFilters();
  };

  const handleRemoveFilter = (filterKey) => {
    if (filterKey === 'search') {
      setSearchInput('');
    }
    onFilterChange(filterKey, '');
  };

  return (
    <div className="w-full bg-white/70 border border-white/60 backdrop-blur-xl rounded-3xl p-4 sm:p-5 shadow-[0_10px_35px_rgba(99,102,241,0.08)] space-y-4 font-sans">
      {/* Search Bar Row */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7194]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search clothes by name, fabric, or color..."
          className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-2xl bg-white/80 hover:bg-white focus:bg-white border border-white/80 text-[#1E2140] placeholder-[#6B7194] focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]/25 focus:border-[#4F5BD5] text-xs sm:text-sm shadow-xs transition-all duration-200"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              onFilterChange('search', '');
            }}
            className="absolute inset-y-0 right-0 pr-3.5 min-w-[44px] flex items-center justify-center text-[#6B7194] hover:text-[#1E2140] transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category PillTabs (Horizontally scrollable on mobile) */}
      <div className="pt-0.5">
        <PillTabs
          tabs={CATEGORY_TABS}
          activeTab={filters.category || ''}
          onChange={(tabId) => onFilterChange('category', tabId)}
          aria-label="Filter clothes by category"
        />
      </div>

      {/* Select Dropdowns for Color, Season, Occasion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-0.5">
        <div>
          <label htmlFor="filter-color" className="sr-only">
            Color
          </label>
          <Select
            id="filter-color"
            value={filters.color || ''}
            onChange={(e) => onFilterChange('color', e.target.value)}
            aria-label="Filter by color"
          >
            <option value="">All Colors</option>
            {availableColors.map((col) => (
              <option key={col} value={col} className="capitalize">
                {col}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-season" className="sr-only">
            Season
          </label>
          <Select
            id="filter-season"
            value={filters.season || ''}
            onChange={(e) => onFilterChange('season', e.target.value)}
            aria-label="Filter by season"
          >
            <option value="">All Seasons</option>
            {SEASONS.map((seas) => (
              <option key={seas} value={seas}>
                {formatLabel(seas)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-occasion" className="sr-only">
            Occasion
          </label>
          <Select
            id="filter-occasion"
            value={filters.occasion || ''}
            onChange={(e) => onFilterChange('occasion', e.target.value)}
            aria-label="Filter by occasion"
          >
            <option value="">All Occasions</option>
            {OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>
                {formatLabel(occ)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Removable Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E3E6FB]">
          <span className="text-[11px] font-bold text-[#6B7194] uppercase tracking-wider mr-1">
            Active:
          </span>

          {activeFilters.map(({ key, value }) => {
            const isColorFilter = key === 'color';
            const colorInfo = isColorFilter ? getColorInfo(value) : null;
            const displayLabel =
              key === 'category'
                ? 'Category'
                : key === 'season'
                ? 'Season'
                : key === 'occasion'
                ? 'Occasion'
                : key === 'search'
                ? 'Search'
                : key;

            return (
              <span
                key={key}
                className="inline-flex items-center space-x-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-[#1E2140] border border-white shadow-xs backdrop-blur-md"
              >
                {isColorFilter && colorInfo && (
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block mr-0.5 border border-black/10 shadow-xs"
                    style={{ backgroundColor: colorInfo.hex }}
                  />
                )}
                <span className="text-[11px] text-[#6B7194] uppercase font-bold">
                  {displayLabel}:
                </span>
                <span className="capitalize font-medium text-[#1E2140]">
                  {key === 'search' ? `"${value}"` : formatLabel(value)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFilter(key)}
                  aria-label={`Remove filter ${key} ${value}`}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[#6B7194] hover:text-[#C2492E] hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}

          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-[#4F5BD5] hover:text-[#3B5FB0] font-semibold underline underline-offset-4 cursor-pointer ml-2 py-1 px-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            Clear all ({activeCount})
          </button>
        </div>
      )}
    </div>
  );
}
