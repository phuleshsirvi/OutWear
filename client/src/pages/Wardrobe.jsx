import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getItems } from '../api/items.js';
import ItemCard from '../components/ItemCard.jsx';

export default function Wardrobe() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerMessage, setBannerMessage] = useState(location.state?.message || '');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load wardrobe items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="w-full space-y-6">
      {/* Success banner if navigated from AddItem */}
      {bannerMessage && (
        <div
          role="status"
          className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-400 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <span>✓</span>
            <span>{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage('')}
            className="text-emerald-400 hover:text-emerald-300 text-xs ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              My Wardrobe
            </h1>
            {!loading && !error && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-medium">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Browse and organize your personal clothing collection
          </p>
        </div>

        <Link
          to="/wardrobe/add"
          className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer space-x-2 shrink-0"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>Add item</span>
        </Link>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden animate-pulse flex flex-col"
            >
              <div className="aspect-[4/5] w-full bg-slate-700/50" />
              <div className="p-3.5 sm:p-4 space-y-2.5">
                <div className="h-2.5 bg-slate-700/50 rounded w-1/3" />
                <div className="h-4 bg-slate-700/60 rounded w-3/4" />
                <div className="h-2.5 bg-slate-700/40 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">Unable to load wardrobe</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              {error}
            </p>
          </div>
          <button
            onClick={fetchItems}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-800/30 border border-dashed border-slate-700/80 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl">
            👗
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">Your wardrobe is empty</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              Start building your digital closet by adding your favorite tops, bottoms, shoes, and accessories.
            </p>
          </div>
          <Link
            to="/wardrobe/add"
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer inline-flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Your First Item</span>
          </Link>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
