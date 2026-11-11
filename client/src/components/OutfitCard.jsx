import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteOutfit } from '../api/outfits.js';

// Fallback category emojis for items without images
const CATEGORY_EMOJI = {
  top: '👕',
  bottom: '👖',
  dress: '👗',
  ethnic: '🥻',
  outerwear: '🧥',
  shoes: '👟',
  accessory: '👜',
};

function formatLabel(str) {
  if (!str) return '';
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

export default function OutfitCard({ outfit, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const items = outfit.items || [];
  const totalCount = items.length;

  const handleDelete = async () => {
    setDeleteError('');
    setIsDeleting(true);

    try {
      await deleteOutfit(outfit.id);
      setShowConfirm(false);
      if (typeof onDelete === 'function') {
        onDelete(outfit.id);
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete outfit. Please try again.');
      setIsDeleting(false);
    }
  };

  // Up to 4 slots for the 2x2 collage
  const collageSlots = [0, 1, 2, 3];
  const hasMoreThanFour = totalCount > 4;

  return (
    <>
      <div className="group relative rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 shadow-md hover:shadow-indigo-500/10 transition-all duration-200 overflow-hidden flex flex-col">
        {/* Collage Container (fixed 1:1 square ratio) */}
        <div className="relative aspect-square w-full bg-slate-900/80 p-2 overflow-hidden">
          <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full">
            {collageSlots.map((slotIndex) => {
              const item = items[slotIndex];
              const isFourthSlotWithMore = slotIndex === 3 && hasMoreThanFour;

              if (!item) {
                // Empty slot placeholder (for outfits with 2 or 3 items)
                return (
                  <div
                    key={slotIndex}
                    className="w-full h-full rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-center text-slate-600 text-lg select-none"
                  >
                    <span>✨</span>
                  </div>
                );
              }

              const categoryKey = item.category?.toLowerCase() || '';
              const emoji = CATEGORY_EMOJI[categoryKey] || '👔';

              return (
                <div
                  key={item.id || slotIndex}
                  className="relative w-full h-full rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800 flex items-center justify-center group/item"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-gradient-to-br from-slate-800/80 to-slate-900/90 select-none">
                      <span className="text-xl sm:text-2xl">{emoji}</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-full px-1">
                        {item.name}
                      </span>
                    </div>
                  )}

                  {/* If more than 4 items, overlay +N on 4th slot */}
                  {isFourthSlotWithMore && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white font-bold text-sm sm:text-base border border-indigo-500/40">
                      +{totalCount - 3}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons (Visible on mobile, subtle hover reveal on desktop) */}
          <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10 bg-slate-900/90 backdrop-blur-md rounded-xl p-1 border border-slate-700/90 shadow-lg opacity-100 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
            <Link
              to={`/outfits/${outfit.id}/edit`}
              title="Edit outfit"
              aria-label={`Edit ${outfit.name}`}
              className="p-1.5 text-slate-300 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => {
                setDeleteError('');
                setShowConfirm(true);
              }}
              title="Delete outfit"
              aria-label={`Delete ${outfit.name}`}
              className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Card Details */}
        <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                className="text-base font-semibold text-slate-100 truncate"
                title={outfit.name}
              >
                {outfit.name}
              </h3>
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-slate-400">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            {outfit.occasion && (
              <p className="text-xs font-medium text-indigo-400 capitalize">
                {formatLabel(outfit.occasion)}
              </p>
            )}
          </div>

          {/* Item summary tags */}
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-400">
            {items.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60 truncate max-w-[120px]"
                title={item.name}
              >
                {item.name}
              </span>
            ))}
            {totalCount > 3 && (
              <span className="px-1.5 py-0.5 text-slate-500 font-mono">
                +{totalCount - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !isDeleting && setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xl">
              🗑️
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-slate-100">
                Delete this outfit?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-slate-200">"{outfit.name}"</span>? This cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-left"
              >
                {deleteError}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm transition border border-slate-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-red-600/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

