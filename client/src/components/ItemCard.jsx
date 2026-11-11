import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { deleteItem } from '../api/items.js';
import { logItemWear } from '../api/wear.js';

// Common color to hex code mapping
const COLOR_MAP = {
  black: '#0f172a',
  white: '#f8fafc',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  pink: '#ec4899',
  purple: '#a855f7',
  orange: '#f97316',
  brown: '#78350f',
  grey: '#6b7280',
  gray: '#6b7280',
  beige: '#e2d5c3',
  navy: '#1e3a8a',
  maroon: '#800000',
};

// Fallback category emojis
const CATEGORY_EMOJI = {
  top: '👕',
  bottom: '👖',
  dress: '👗',
  ethnic: '🥻',
  outerwear: '🧥',
  shoes: '👟',
  accessory: '👜',
};

function getColorStyle(colorStr) {
  if (!colorStr) return { backgroundColor: '#94a3b8' };
  const normalized = colorStr.toLowerCase().trim();

  // Exact match
  if (COLOR_MAP[normalized]) {
    return {
      backgroundColor: COLOR_MAP[normalized],
      border: normalized === 'white' ? '1px solid #cbd5e1' : undefined,
    };
  }

  // Substring match
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(name)) {
      return {
        backgroundColor: hex,
        border: name === 'white' ? '1px solid #cbd5e1' : undefined,
      };
    }
  }

  return { backgroundColor: '#94a3b8' };
}

function formatLastWorn(date) {
  if (!date) return 'Never worn';
  const now = new Date();
  const worn = new Date(date);
  const diffMs = now.getTime() - worn.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Worn today';
  if (diffDays === 1) return 'Last worn yesterday';
  return `Last worn ${diffDays} days ago`;
}

export default function ItemCard({ item, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Local wear tracking states to update card without refetching the grid
  const [wearCount, setWearCount] = useState(item.wearCount || 0);
  const [lastWornAt, setLastWornAt] = useState(item.lastWornAt || null);
  const [isLoggingWear, setIsLoggingWear] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Sync state if item prop changes
  useEffect(() => {
    setWearCount(item.wearCount || 0);
    setLastWornAt(item.lastWornAt || null);
  }, [item.wearCount, item.lastWornAt]);

  // Clean up toast timeout on unmount
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

  const colorStyle = getColorStyle(item.color);
  const categoryKey = item.category?.toLowerCase() || '';
  const emoji = CATEGORY_EMOJI[categoryKey] || '👗';
  const categoryInitial = item.category ? item.category.charAt(0).toUpperCase() : '?';

  return (
    <>
      <div className="group relative rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 shadow-md hover:shadow-indigo-500/10 transition-all duration-200 overflow-hidden flex flex-col justify-between">
        {/* Photo Container with fixed 4:5 aspect ratio */}
        <div className="relative aspect-[4/5] w-full bg-slate-900/60 overflow-hidden flex items-center justify-center">
          {!imgError && item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 p-4 text-center select-none">
              <span className="text-4xl mb-1.5 filter drop-shadow">{emoji}</span>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                {categoryInitial} · {item.category}
              </span>
            </div>
          )}

          {/* Action buttons (Visible on mobile, subtle hover reveal on desktop) */}
          <div className="absolute top-2 right-2 flex items-center space-x-1.5 z-10 bg-slate-900/85 backdrop-blur-md rounded-xl p-1 border border-slate-700/80 shadow-md opacity-100 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
            <Link
              to={`/wardrobe/${item.id}/edit`}
              title="Edit item"
              aria-label={`Edit ${item.name}`}
              className="p-1.5 text-slate-300 hover:text-indigo-400 hover:bg-slate-800/90 rounded-lg transition"
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
              title="Delete item"
              aria-label={`Delete ${item.name}`}
              className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-slate-800/90 rounded-lg transition cursor-pointer"
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

        {/* Card Details & Wear Controls */}
        <div className="p-3.5 sm:p-4 flex flex-col space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-indigo-400 uppercase tracking-wider">
              <span>{item.category}</span>
              <div className="flex items-center space-x-1 text-slate-300 font-normal">
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={colorStyle}
                />
                <span className="capitalize">{item.color}</span>
              </div>
            </div>

            {/* Name */}
            <h3
              className="text-sm font-semibold text-slate-100 truncate"
              title={item.name}
            >
              {item.name}
            </h3>
          </div>

          {/* Season & Occasion Pills */}
          <div className="flex flex-wrap gap-1 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-700/60 capitalize">
              {item.season}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-700/60 capitalize">
              {item.occasion}
            </span>
          </div>

          {/* Wear Stats Line */}
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-300">
              Worn {wearCount} {wearCount === 1 ? 'time' : 'times'}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              {formatLastWorn(lastWornAt)}
            </span>
          </div>

          {/* Wear Action Buttons: "Wore today" + "Pick a date" */}
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleLogWear()}
                disabled={isLoggingWear}
                aria-label={`Log wear for ${item.name}`}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isLoggingWear ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>👔</span>
                    <span>Wore today</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                title="Pick a custom wear date"
                aria-label="Pick wear date"
                className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                  showDatePicker
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-700/80 hover:bg-slate-850'
                }`}
              >
                📅
              </button>
            </div>

            {/* Date Picker Input (Capped at today) */}
            {showDatePicker && (
              <div className="flex items-center space-x-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700 animate-in fade-in duration-150">
                <input
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!selectedDate || isLoggingWear}
                  onClick={() => handleLogWear(selectedDate)}
                  className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition cursor-pointer"
                >
                  Log
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card Toast Notification */}
        {toast && (
          <div
            role="status"
            className={`absolute bottom-3 left-3 right-3 z-30 p-2.5 rounded-xl text-xs font-medium shadow-2xl border backdrop-blur-md flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              toast.type === 'warning'
                ? 'bg-amber-950/95 text-amber-300 border-amber-600/50'
                : toast.type === 'error'
                ? 'bg-red-950/95 text-red-300 border-red-600/50'
                : 'bg-emerald-950/95 text-emerald-300 border-emerald-600/50'
            }`}
          >
            <span className="truncate pr-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-200 text-xs ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
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
                Delete this item?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-slate-200">"{item.name}"</span>? This cannot be undone.
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
