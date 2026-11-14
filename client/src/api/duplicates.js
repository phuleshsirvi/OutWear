import apiClient from './client.js';

/**
 * Checks wardrobe for duplicates before making a purchase.
 * @param {object} data
 * @param {string} data.category - required
 * @param {string} data.color - required
 * @param {string} [data.occasion] - optional
 * @param {string} [data.season] - optional
 * @param {string} [data.fabric] - optional
 * @returns {Promise<{
 *   exactCount: number,
 *   similarCount: number,
 *   matches: Array<object>,
 *   stats: { totalInCategory: number, wornOften: number, rarelyWorn: number },
 *   verdict: { level: 'go' | 'think' | 'skip', message: string }
 * }>}
 */
export async function checkDuplicate(data) {
  return apiClient('/duplicates/check', {
    method: 'POST',
    body: data,
  });
}

export default {
  checkDuplicate,
};

