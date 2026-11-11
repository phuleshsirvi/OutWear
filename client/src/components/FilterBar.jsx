import { useState, useEffect } from 'react';
import { CATEGORIES, SEASONS, OCCASIONS } from '../constants/wardrobe.js';

function formatLabel(str) {
  if (!str) return '';
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

export default function FilterBar({
  filters = { search: '', category: '', color: '', season: '', occasion: '' },
  onFilterChange,
  onClearFilters,
  availableColors = [],
}) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Synchronize local search input when external search filter changes (e.g., cleared)
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

  // Calculate active filter count
  const activeCount = Object.entries(filters).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  ).length;

  const handleClear = () => {
    setSearchInput('');
    onClearFilters();
  };

  return (
    <div className="w-full bg-slate-800/80 border border-slate-700/80 backdrop-blur rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3">
      {/* Search Input Row with Mobile Filter Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, fabric, or color..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs sm:text-sm transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onFilterChange('search', '');
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className={`md:hidden flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer shrink-0 ${
            activeCount > 0
              ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
          aria-expanded={isMobileOpen}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </button>

        {/* Desktop Clear Filters button (when active) */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="hidden md:inline-flex items-center px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-indigo-400 hover:bg-slate-900/70 border border-slate-700/60 transition cursor-pointer shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Select Dropdowns (always visible on md+, collapsible on mobile) */}
      <div
        className={`${
          isMobileOpen ? 'grid' : 'hidden md:grid'
        } grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1`}
      >
        {/* Category Filter */}
        <div>
          <label htmlFor="filter-category" className="sr-only">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {formatLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Color Filter */}
        <div>
          <label htmlFor="filter-color" className="sr-only">
            Color
          </label>
          <select
            id="filter-color"
            value={filters.color || ''}
            onChange={(e) => onFilterChange('color', e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition capitalize"
          >
            <option value="">All Colors</option>
            {availableColors.map((col) => (
              <option key={col} value={col} className="capitalize">
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Season Filter */}
        <div>
          <label htmlFor="filter-season" className="sr-only">
            Season
          </label>
          <select
            id="filter-season"
            value={filters.season || ''}
            onChange={(e) => onFilterChange('season', e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          >
            <option value="">All Seasons</option>
            {SEASONS.map((seas) => (
              <option key={seas} value={seas}>
                {formatLabel(seas)}
              </option>
            ))}
          </select>
        </div>

        {/* Occasion Filter */}
        <div>
          <label htmlFor="filter-occasion" className="sr-only">
            Occasion
          </label>
          <select
            id="filter-occasion"
            value={filters.occasion || ''}
            onChange={(e) => onFilterChange('occasion', e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          >
            <option value="">All Occasions</option>
            {OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>
                {formatLabel(occ)}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Clear Filters Button in dropdowns */}
        {activeCount > 0 && (
          <div className="col-span-2 sm:col-span-2 md:hidden pt-1">
            <button
              type="button"
              onClick={handleClear}
              className="w-full py-1.5 px-3 rounded-xl text-xs text-center text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700/80 transition"
            >
              Clear all filters ({activeCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

