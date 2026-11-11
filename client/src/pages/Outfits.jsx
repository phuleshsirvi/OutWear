import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getOutfits } from '../api/outfits.js';
import OutfitCard from '../components/OutfitCard.jsx';

export default function Outfits() {
  const location = useLocation();
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerMessage, setBannerMessage] = useState(location.state?.message || '');

  const fetchUserOutfits = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOutfits();
      setOutfits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load outfits. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserOutfits();
  }, [fetchUserOutfits]);

  const handleOutfitDeleted = useCallback((deletedId) => {
    setOutfits((prev) => prev.filter((o) => o.id !== deletedId));
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Success banner if navigated with flash message */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              My Outfits
            </h1>
            {!loading && !error && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-medium">
                {outfits.length} {outfits.length === 1 ? 'outfit' : 'outfits'}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Curate, organize, and style your wardrobe pieces into complete looks
          </p>
        </div>

        <Link
          to="/outfits/new"
          className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer space-x-2 shrink-0"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>New outfit</span>
        </Link>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden animate-pulse flex flex-col"
            >
              <div className="aspect-square w-full bg-slate-700/50 p-2">
                <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full">
                  <div className="bg-slate-700/60 rounded-xl" />
                  <div className="bg-slate-700/60 rounded-xl" />
                  <div className="bg-slate-700/60 rounded-xl" />
                  <div className="bg-slate-700/60 rounded-xl" />
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="h-4 bg-slate-700/60 rounded w-2/3" />
                <div className="h-3 bg-slate-700/40 rounded w-1/3" />
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
            <h3 className="text-lg font-semibold text-slate-100">Unable to load outfits</h3>
            <p className="text-slate-400 text-sm max-w-sm">{error}</p>
          </div>
          <button
            onClick={fetchUserOutfits}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : outfits.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-800/30 border border-dashed border-slate-700/80 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl">
            👔
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">No outfits created yet</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              Combine your tops, bottoms, shoes, and accessories into personalized outfits for any occasion.
            </p>
          </div>
          <Link
            to="/outfits/new"
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer inline-flex items-center space-x-2"
          >
            <span>+</span>
            <span>Create your first outfit</span>
          </Link>
        </div>
      ) : (
        /* Outfits Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              onDelete={handleOutfitDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
