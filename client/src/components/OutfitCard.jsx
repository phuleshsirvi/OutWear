import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Calendar, Check } from 'lucide-react';
import { deleteOutfit } from '../api/outfits.js';
import { logOutfitWear } from '../api/wear.js';
import { Button, Badge, Modal, Toast } from './ui/index.js';

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

// Map occasion to status badge variant
const OCCASION_BADGE_MAP = {
  formal: 'primary',
  party: 'red',
  casual: 'blue',
  work: 'primary',
  festive: 'amber',
  sports: 'green',
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

  // Wear logging states
  const [isLoggingWear, setIsLoggingWear] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const items = outfit.items || [];
  const totalCount = items.length;

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const handleLogWear = async (customDate) => {
    setIsLoggingWear(true);
    try {
      const dateToLog = customDate || undefined;
      await logOutfitWear(outfit.id, dateToLog);

      setShowDatePicker(false);
      setSelectedDate('');

      const label = customDate ? `Logged for ${customDate}` : 'Logged for today';
      showToast(`✓ Outfit wear ${label.toLowerCase()}!`, 'success');
    } catch (err) {
      if (err.status === 409 || err.message?.includes('Already logged')) {
        showToast('⚠️ Already logged for this day', 'warning');
      } else {
        showToast(err.message || 'Failed to log outfit wear', 'error');
      }
    } finally {
      setIsLoggingWear(false);
    }
  };

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

  const occasionVariant = outfit.occasion
    ? OCCASION_BADGE_MAP[outfit.occasion.toLowerCase()] || 'neutral'
    : 'neutral';

  return (
    <>
      <div className="group relative rounded-3xl bg-white/75 border border-white/70 hover:border-white shadow-[0_10px_35px_rgba(99,102,241,0.08)] hover:shadow-[0_14px_45px_rgba(99,102,241,0.14)] transition-all duration-300 overflow-hidden flex flex-col justify-between backdrop-blur-xl hover:-translate-y-1 font-sans p-3 sm:p-3.5 space-y-3">
        {/* Collage Container (fixed 1:1 square ratio) */}
        <div className="relative aspect-square w-full bg-white/40 p-2 overflow-hidden rounded-2xl border border-white/60">
          <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
            {collageSlots.map((slotIndex) => {
              const item = items[slotIndex];
              const isFourthSlotWithMore = slotIndex === 3 && hasMoreThanFour;

              if (!item) {
                // Empty slot placeholder (for outfits with 2 or 3 items)
                return (
                  <div
                    key={slotIndex}
                    className="w-full h-full rounded-xl bg-white/60 border border-white/80 flex items-center justify-center text-[#6B7194] text-lg select-none"
                  >
                    <span className="opacity-40">✨</span>
                  </div>
                );
              }

              const categoryKey = item.category?.toLowerCase() || '';
              const emoji = CATEGORY_EMOJI[categoryKey] || '👔';

              return (
                <div
                  key={item.id || slotIndex}
                  className="relative w-full h-full rounded-xl overflow-hidden bg-white/80 border border-white/90 flex items-center justify-center group/item"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-white/50 select-none">
                      <span className="text-xl sm:text-2xl filter drop-shadow-xs">{emoji}</span>
                      <span className="text-[10px] text-[#6B7194] font-medium truncate max-w-full px-1">
                        {item.name}
                      </span>
                    </div>
                  )}

                  {/* If more than 4 items, overlay +N on 4th slot */}
                  {isFourthSlotWithMore && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white font-heading font-bold text-base sm:text-lg rounded-xl">
                      +{totalCount - 3}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Round Icon Action Buttons (Visible on mobile, subtle hover reveal on desktop) */}
          <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10 bg-white/90 backdrop-blur-md rounded-full p-1 border border-white/90 shadow-sm opacity-100 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
            <Link
              to={`/outfits/${outfit.id}/edit`}
              title="Edit outfit"
              aria-label={`Edit ${outfit.name}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7194] hover:text-[#4F5BD5] hover:bg-[#E3E6FB]/60 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setDeleteError('');
                setShowConfirm(true);
              }}
              title="Delete outfit"
              aria-label={`Delete ${outfit.name}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7194] hover:text-[#C2492E] hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Details */}
        <div className="px-1 flex flex-col space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                className="text-base font-bold font-heading text-[#1E2140] truncate"
                title={outfit.name}
              >
                {outfit.name}
              </h3>
              <span className="text-xs font-semibold text-[#6B7194] shrink-0">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {outfit.occasion && (
              <div>
                <Badge variant={occasionVariant} size="sm" pill>
                  {formatLabel(outfit.occasion)}
                </Badge>
              </div>
            )}
          </div>

          {/* Item summary tags */}
          <div className="flex flex-wrap gap-1 text-[11px] text-[#6B7194]">
            {items.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="px-2 py-0.5 rounded-lg bg-white/70 border border-white/80 shadow-xs truncate max-w-[120px]"
                title={item.name}
              >
                {item.name}
              </span>
            ))}
            {totalCount > 3 && (
              <span className="px-1.5 py-0.5 text-[#6B7194] font-medium text-[11px]">
                +{totalCount - 3} more
              </span>
            )}
          </div>

          {/* Outfit Wear Action Buttons: White "Wore today" Button + Pick a date */}
          <div className="pt-2 border-t border-[#E3E6FB]/80 space-y-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleLogWear()}
                disabled={isLoggingWear}
                aria-label={`Log wear for outfit ${outfit.name}`}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl bg-white hover:bg-white/90 text-[#1E2140] border border-white/90 shadow-xs hover:shadow-md transition-all duration-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-[#4C8A3A]" />
                <span>{isLoggingWear ? 'Logging...' : 'Wore today'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                title="Pick custom wear date"
                aria-label="Pick outfit wear date"
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-2xl border text-xs transition-all duration-200 cursor-pointer shrink-0 shadow-xs ${
                  showDatePicker
                    ? 'bg-[#4F5BD5] text-white border-[#4F5BD5] shadow-md shadow-[#4F5BD5]/20'
                    : 'bg-white hover:bg-white/90 text-[#6B7194] hover:text-[#1E2140] border-white/90'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            {/* Date Picker Input */}
            {showDatePicker && (
              <div className="flex items-center space-x-2 p-2 rounded-2xl bg-white/90 border border-white/90 shadow-sm animate-fade-in-up">
                <input
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#E3E6FB] text-[#1E2140] text-xs focus:ring-2 focus:ring-[#4F5BD5]/25 focus:border-[#4F5BD5] focus:outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedDate || isLoggingWear}
                  onClick={() => handleLogWear(selectedDate)}
                >
                  Log
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => !isDeleting && setShowConfirm(false)}
        title="Delete Outfit?"
        description={`Are you sure you want to delete "${outfit.name}"? This action cannot be undone.`}
      >
        <div className="space-y-4 pt-1 font-sans">
          <p className="text-xs text-[#6B7194]">
            Note: Only the outfit grouping will be deleted. Individual clothing items will remain in your wardrobe safely.
          </p>

          {deleteError && (
            <div
              role="alert"
              className="text-xs text-[#C2492E] bg-[#FBE3DC] border border-rose-300 rounded-xl p-3"
            >
              ⚠️ {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isDeleting}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              loading={isDeleting}
              onClick={handleDelete}
            >
              Delete Outfit
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
