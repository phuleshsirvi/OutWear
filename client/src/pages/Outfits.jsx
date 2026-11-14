import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Plus, Check, X, AlertCircle } from 'lucide-react';
import { getOutfits } from '../api/outfits.js';
import OutfitCard from '../components/OutfitCard.jsx';
import { Button, Badge, EmptyState, Skeleton } from '../components/ui/index.js';

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
    <div className="w-full space-y-6 animate-fade-in-up font-sans">
      {/* Success banner if navigated with flash message */}
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
            className="text-[#4C8A3A] hover:text-[#1E2140] text-xs ml-4 cursor-pointer p-1 rounded-lg hover:bg-white/40 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1E2140] tracking-tight">
              My Outfits
            </h1>
            {!loading && !error && (
              <Badge variant="primary" size="md" className="font-semibold shadow-xs">
                {outfits.length} {outfits.length === 1 ? 'outfit' : 'outfits'}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#6B7194] mt-1 font-sans">
            Curate, organize, and style your wardrobe pieces into complete looks
          </p>
        </div>

        <Button
          as={Link}
          to="/outfits/new"
          variant="primary"
          size="md"
          className="gap-2 shadow-[0_4px_16px_rgba(79,91,213,0.25)] shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Outfit</span>
        </Button>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-fade-in-up">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-white/70 border border-white/60 p-3.5 space-y-3.5 backdrop-blur-xl shadow-[0_10px_30px_rgba(99,102,241,0.06)]"
            >
              <div className="aspect-square w-full rounded-2xl bg-white/50 p-2">
                <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
                  <Skeleton className="rounded-xl w-full h-full" />
                  <Skeleton className="rounded-xl w-full h-full" />
                  <Skeleton className="rounded-xl w-full h-full" />
                  <Skeleton className="rounded-xl w-full h-full" />
                </div>
              </div>
              <div className="p-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
                <div className="pt-2">
                  <Skeleton className="h-10 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="rounded-3xl bg-white/70 border border-rose-200 p-8 sm:p-12 text-center backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4 animate-fade-in-up">
          <div className="w-14 h-14 rounded-full bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold font-heading text-[#1E2140]">Unable to load outfits</h3>
            <p className="text-xs sm:text-sm text-[#6B7194]">{error}</p>
          </div>
          <Button variant="secondary" onClick={fetchUserOutfits}>
            Try again
          </Button>
        </div>
      ) : outfits.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon="👗"
          title="No outfits created yet"
          description="Combine your tops, bottoms, shoes, and accessories into personalized outfits for any occasion."
          actionText="Create your first outfit"
          actionLink="/outfits/new"
          actionAs={Link}
          className="animate-fade-in-up"
        />
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
