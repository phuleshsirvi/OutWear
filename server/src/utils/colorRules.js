/**
 * Color harmony and pairing rules for OutWear outfit suggestions.
 */

// Color families definition
export const FAMILIES = {
  neutral: [
    'black',
    'white',
    'grey',
    'gray',
    'beige',
    'cream',
    'navy',
    'brown',
    'tan',
    'denim',
  ],
  warm: [
    'red',
    'orange',
    'yellow',
    'maroon',
    'pink',
    'mustard',
  ],
  cool: [
    'blue',
    'green',
    'purple',
    'teal',
    'lavender',
  ],
};

// Flatten to color -> family lookup map for fast O(1) checks
export const COLOR_FAMILY_MAP = {};
for (const [family, colors] of Object.entries(FAMILIES)) {
  for (const color of colors) {
    COLOR_FAMILY_MAP[color.toLowerCase()] = family;
  }
}

/**
 * Returns the color family for a given color string:
 * 'neutral', 'warm', 'cool', or null if unknown.
 */
export function getColorFamily(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return null;
  const normalized = colorStr.trim().toLowerCase();

  // 1. Direct lookup
  if (COLOR_FAMILY_MAP[normalized]) {
    return COLOR_FAMILY_MAP[normalized];
  }

  // 2. Substring matching (e.g. "dark blue", "light grey")
  for (const [colorName, family] of Object.entries(COLOR_FAMILY_MAP)) {
    if (normalized.includes(colorName)) {
      return family;
    }
  }

  return null;
}

/**
 * Calculates color harmony score between two colors:
 * - neutral + anything = 1.0
 * - same color = 0.7 (when non-neutral)
 * - same family (non-neutral) = 0.8
 * - warm + cool = 0.4
 * - unknown colors = 0.6
 *
 * @param {string} colorA
 * @param {string} colorB
 * @returns {number} Score from 0 to 1
 */
export function colorScore(colorA, colorB) {
  const normA = (colorA || '').trim().toLowerCase();
  const normB = (colorB || '').trim().toLowerCase();

  const familyA = getColorFamily(normA);
  const familyB = getColorFamily(normB);

  // Rule 1: neutral + anything = 1.0
  if (familyA === 'neutral' || familyB === 'neutral') {
    return 1.0;
  }

  // Rule 5: unknown colors = 0.6 (if either is unknown and neither is neutral)
  if (!familyA || !familyB) {
    return 0.6;
  }

  // Rule 2: same color = 0.7
  if (normA === normB) {
    return 0.7;
  }

  // Rule 3: same family (non-neutral) = 0.8
  if (familyA === familyB) {
    return 0.8;
  }

  // Rule 4: warm + cool = 0.4
  if (
    (familyA === 'warm' && familyB === 'cool') ||
    (familyA === 'cool' && familyB === 'warm')
  ) {
    return 0.4;
  }

  return 0.6;
}

/**
 * Returns a human-friendly pairing reason for two colors.
 */
export function getColorPairReason(colorA, colorB) {
  const normA = (colorA || '').trim().toLowerCase();
  const normB = (colorB || '').trim().toLowerCase();
  const capA = normA.charAt(0).toUpperCase() + normA.slice(1);
  const capB = normB.charAt(0).toUpperCase() + normB.slice(1);

  const familyA = getColorFamily(normA);
  const familyB = getColorFamily(normB);

  if (familyA === 'neutral' && familyB === 'neutral') {
    return `${capA} and ${capB} pair neutrally`;
  }
  if (familyA === 'neutral' || familyB === 'neutral') {
    return `${capA} pairs effortlessly with neutral ${capB.toLowerCase()}`;
  }
  if (normA === normB) {
    return `Monochrome ${capA.toLowerCase()} styling`;
  }
  if (familyA === familyB) {
    return `Harmonious ${familyA} tones (${capA} & ${capB})`;
  }
  if (
    (familyA === 'warm' && familyB === 'cool') ||
    (familyA === 'cool' && familyB === 'warm')
  ) {
    return `High-contrast ${capA} and ${capB} combination`;
  }
  return `Balanced color contrast (${capA} & ${capB})`;
}

export default {
  FAMILIES,
  COLOR_FAMILY_MAP,
  getColorFamily,
  colorScore,
  getColorPairReason,
};

