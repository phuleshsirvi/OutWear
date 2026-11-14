import apiClient from './client.js';

/**
 * Fetch smart outfit suggestions based on occasion, season, and exclusions.
 * @param {object} params
 * @param {string} [params.occasion]
 * @param {string} [params.season]
 * @param {Array<string>} [params.excludeIds]
 * @param {number} [params.count=3]
 * @returns {Promise<{ outfits: Array<object>, missing: Array<string>, message?: string }>}
 */
export async function getSuggestions({
  occasion,
  season,
  excludeIds = [],
  count = 3,
} = {}) {
  const body = {
    count,
    excludeIds: Array.isArray(excludeIds) ? excludeIds : [],
  };

  if (occasion && occasion !== 'all') {
    body.occasion = occasion;
  }
  if (season && season !== 'all') {
    body.season = season;
  }

  return apiClient('/suggestions', {
    method: 'POST',
    body,
  });
}

export default {
  getSuggestions,
};

