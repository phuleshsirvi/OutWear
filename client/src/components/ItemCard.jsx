import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteItem } from '../api/items.js';

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

  // Substring match (e.g. "navy blue" -> navy, "dark grey" -> grey)
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(name)) {
      return {
        backgroundColor: hex,
        border: name === 'white' ? '1px solid #cbd5e1' : undefined,
      };
    }
  }

  // Neutral dot for unknown colors
  return { backgroundColor: '#94a3b8' };
}

export default function ItemCard({ item, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const colorStyle = getColorStyle(item.color);
  const categoryKey = item.category?.toLowerCase() || '';
  const emoji = CATEGORY_EMOJI[categoryKey] || '👗';
  const categoryInitial = item.category ? item.category.charAt(0).toUpperCase() : '?';

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

  return (
    <>
      <div className="group relative rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 shadow-md hover:shadow-indigo-500/10 transition-all duration-200 overflow-hidden flex flex-col">
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

        {/* Card Details */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-2">
          <div className="space-y-1">
            {/* Category */}
            <div className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">
              {item.category}
            </div>

            {/* Name (truncated) */}
            <h3
              className="text-sm font-semibold text-slate-100 truncate"
              title={item.name}
            >
              {item.name}
            </h3>
          </div>

          {/* Color Dot & Name */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-300">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-sm shrink-0"
              style={colorStyle}
            />
            <span className="truncate capitalize">{item.color}</span>
          </div>

          {/* Season & Occasion Pills */}
          <div className="flex flex-wrap gap-1 pt-1 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-700/60 capitalize">
              {item.season}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-700/60 capitalize">
              {item.occasion}
            </span>
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
                Delete this item?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-slate-200">"{item.name}"</span>? This cannot be undone.
              </p>
            </div>

            {/* Error in modal if deletion fails */}
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
