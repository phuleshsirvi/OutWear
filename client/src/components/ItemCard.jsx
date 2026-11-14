import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Check, Calendar } from 'lucide-react';
import { deleteItem } from '../api/items.js';
import { logItemWear } from '../api/wear.js';
import { getColorInfo } from '../constants/colors.js';
import { StatusPill } from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import Toast from './ui/Toast.jsx';

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

export default function ItemCard({ item, onDelete, className = '', style = {} }) {
  const [imgError, setImgError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Local wear tracking states
  const [wearCount, setWearCount] = useState(item.wearCount || 0);
  const [, setLastWornAt] = useState(item.lastWornAt || null);
  const [isLoggingWear, setIsLoggingWear] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setWearCount(item.wearCount || 0);
    setLastWornAt(item.lastWornAt || null);
  }, [item.wearCount, item.lastWornAt]);

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
      const updated = await logItemWear(item.id, dateToLog);

      setWearCount(updated.wearCount);
      setLastWornAt(updated.lastWornAt);
      setShowDatePicker(false);
      setSelectedDate('');

      const label = customDate ? `Logged for ${customDate}` : 'Logged for today';
      showToast(`✓ ${label}! (Worn ${updated.wearCount}x)`, 'success');
    } catch (err) {
      if (err.status === 409 || err.message?.includes('Already logged')) {
        showToast('⚠️ Already logged for this day', 'warning');
      } else {
        showToast(err.message || 'Failed to log wear', 'error');
      }
    } finally {
      setIsLoggingWear(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    setIsDeleting(true);

    try {
      await deleteItem(item.id);
      setShowConfirm(false);
      if (typeof onDelete === 'function') {
        onDelete(item.id);
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete item. Please try again.');
      setIsDeleting(false);
    }
  };

  const colorInfo = getColorInfo(item.color);
  const categoryKey = item.category?.toLowerCase() || '';
  const emoji = CATEGORY_EMOJI[categoryKey] || '👗';

  // Status pill logic per design specification:
  // "Never worn" amber, "Rarely worn" blue, "Worn N times" green
  let statusVariant = 'amber';
  let statusText = 'Never worn';
  if (wearCount >= 3) {
    statusVariant = 'green';
    statusText = `Worn ${wearCount} times`;
  } else if (wearCount > 0) {
    statusVariant = 'blue';
    statusText = 'Rarely worn';
  }

  return (
    <>
      <div
        style={style}
        className={`group relative rounded-3xl bg-white/75 border border-white/70 backdrop-blur-xl shadow-[0_10px_35px_rgba(99,102,241,0.08)] hover:shadow-[0_16px_45px_rgba(99,102,241,0.15)] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between p-3.5 select-none font-sans ${className}`}
      >
        {/* Photo Container in Rounded Inner Frame (4/5 aspect ratio) */}
        <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white/60 border border-white/80 shadow-inner flex items-center justify-center">
          {!imgError && item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#E3E6FB]/50 to-[#CFE6E0]/40 p-4 text-center select-none">
              <span className="text-4xl mb-1 filter drop-shadow-xs">{emoji}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7194]">
                {item.category}
              </span>
            </div>
          )}

          {/* Edit & Delete Action Buttons (Visible on Mobile, subtle hover reveal on Desktop) */}
          <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10 opacity-100 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
            <Link
              to={`/wardrobe/${item.id}/edit`}
              title="Edit item"
              aria-label={`Edit ${item.name}`}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#1E2140] hover:text-[#4F5BD5] shadow-sm border border-white/80 flex items-center justify-center transition focus:outline-none"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setDeleteError('');
                setShowConfirm(true);
              }}
              title="Delete item"
              aria-label={`Delete ${item.name}`}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-[#FBE3DC] text-[#1E2140] hover:text-[#C2492E] shadow-sm border border-white/80 flex items-center justify-center transition cursor-pointer focus:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="pt-3 pb-1 flex flex-col space-y-2.5">
          {/* Item Name */}
          <h3
            className="text-sm sm:text-base font-bold font-heading text-[#1E2140] truncate leading-tight"
            title={item.name}
          >
            {item.name}
          </h3>

          {/* Muted Subtitle (category, season) */}
          <p className="text-xs text-[#6B7194] capitalize truncate">
            {formatLabel(item.category)} • {formatLabel(item.season || 'All-season')}
          </p>

          {/* Color Dot with Color Name + StatusPill */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span
                className={`w-3 h-3 rounded-full shrink-0 shadow-xs ${colorInfo.ringClass}`}
                style={{ backgroundColor: colorInfo.hex }}
              />
              <span className="text-xs font-semibold text-[#1E2140] capitalize truncate">
                {item.color}
              </span>
            </div>

            <StatusPill variant={statusVariant} size="sm" dot>
              {statusText}
            </StatusPill>
          </div>
        </div>

        {/* Full-width White Rounded "Wore Today" Button with Icon */}
        <div className="pt-2 border-t border-white/50 space-y-2">
          <div className="flex items-center space-x-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleLogWear()}
              disabled={isLoggingWear}
              aria-label={`Log wear for ${item.name}`}
              className="flex-1 font-semibold text-xs shadow-xs justify-center"
            >
              <Check className="w-3.5 h-3.5 text-[#4F5BD5]" />
              <span>{isLoggingWear ? 'Logging...' : 'Wore today'}</span>
            </Button>

            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Pick wear date"
              aria-label="Pick wear date"
              className={`min-w-[36px] min-h-[36px] p-1.5 rounded-xl border text-xs transition cursor-pointer select-none flex items-center justify-center shrink-0 ${
                showDatePicker
                  ? 'bg-[#4F5BD5] text-white border-[#4F5BD5] shadow-xs'
                  : 'bg-white/80 text-[#6B7194] hover:text-[#1E2140] hover:bg-white border-white/80'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Date Picker Input */}
          {showDatePicker && (
            <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-white/95 border border-white/80 shadow-md animate-fade-in">
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-2.5 py-1 rounded-xl bg-white border border-[#DDE0F7] text-[#1E2140] text-xs focus:ring-2 focus:ring-[#4F5BD5]/30 focus:outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedDate || isLoggingWear}
                onClick={() => handleLogWear(selectedDate)}
                className="px-3 py-1 text-xs"
              >
                Log
              </Button>
            </div>
          )}
        </div>

        {/* Card Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => !isDeleting && setShowConfirm(false)}
        title="Delete Item"
        description={`Are you sure you want to remove "${item.name}" from your wardrobe? This cannot be undone.`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2">
          {deleteError && (
            <div
              role="alert"
              className="text-xs text-[#C2492E] bg-[#FBE3DC] border border-[#F6D0C5] rounded-2xl p-3"
            >
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              disabled={isDeleting}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={isDeleting}
              disabled={isDeleting}
              onClick={handleDelete}
            >
              Delete Item
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
