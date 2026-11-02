import { useState } from 'react';

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

export default function ItemCard({ item }) {
  const [imgError, setImgError] = useState(false);

  const colorStyle = getColorStyle(item.color);
  const categoryKey = item.category?.toLowerCase() || '';
  const emoji = CATEGORY_EMOJI[categoryKey] || '👗';
  const categoryInitial = item.category ? item.category.charAt(0).toUpperCase() : '?';

  return (
    <div className="group rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 shadow-md hover:shadow-indigo-500/10 transition-all duration-200 overflow-hidden flex flex-col">
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
            <span className="text-4xl mb-1.5 filter drop-shadow">
              {emoji}
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              {categoryInitial} · {item.category}
            </span>
          </div>
        )}
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
  );
}

