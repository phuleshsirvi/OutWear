/**
 * Fashion color-to-hex mapping and dot styles with subtle rings
 * for maximum visibility on dark surfaces.
 */
export const FASHION_COLOR_HEX = {
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
  grey: '#64748b',
  gray: '#64748b',
  beige: '#e2d5c3',
  navy: '#1e3a8a',
  maroon: '#800000',
  cream: '#fffdd0',
  olive: '#556b2f',
  teal: '#0d9488',
  lavender: '#e6e6fa',
  tan: '#d2b48c',
  khaki: '#c3b091',
  coral: '#ff7f50',
  gold: '#ffd700',
  silver: '#cbd5e1',
  charcoal: '#334155',
  burgundy: '#800020',
};

/**
 * Returns color hex code, glow rgba, and visible border ring classes.
 * Ensures black, white, and dark tones stay distinctly visible against deep navy surfaces.
 */
export function getColorInfo(colorStr) {
  if (!colorStr) {
    return {
      hex: '#94a3b8',
      ringClass: 'ring-1.5 ring-slate-600/60',
      glow: 'rgba(148, 163, 184, 0.25)',
    };
  }

  const norm = colorStr.toLowerCase().trim();

  // Exact or substring match
  let hex = FASHION_COLOR_HEX[norm];
  if (!hex) {
    for (const [name, value] of Object.entries(FASHION_COLOR_HEX)) {
      if (norm.includes(name)) {
        hex = value;
        break;
      }
    }
  }
  hex = hex || '#94a3b8';

  const isLight = norm === 'white' || norm === 'cream' || norm === 'beige' || norm === 'silver';
  const isDark = norm === 'black' || norm === 'charcoal' || norm === 'navy' || norm === 'maroon';

  const ringClass = isLight
    ? 'ring-1.5 ring-slate-500/80 shadow-sm'
    : isDark
    ? 'ring-1.5 ring-slate-600/90 shadow-sm'
    : 'ring-1.5 ring-white/20 shadow-sm';

  return {
    hex,
    ringClass,
    isLight,
    isDark,
    glow: hex,
  };
}

export default {
  FASHION_COLOR_HEX,
  getColorInfo,
};

