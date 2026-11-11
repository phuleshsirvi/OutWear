import apiClient from './client.js';

/**
 * Log a wear event for a specific wardrobe item
 * @param {string} itemId
 * @param {string|Date} [date] - Optional date (ISO string or YYYY-MM-DD)
 * @returns {Promise<object>} Updated item details
 */
export async function logItemWear(itemId, date) {
  const body = date ? { date } : {};
  return apiClient(`/wear/item/${itemId}`, {
    method: 'POST',
    body,
  });
}

/**
 * Log a wear event for an outfit and its constituent items
 * @param {string} outfitId
 * @param {string|Date} [date] - Optional date (ISO string or YYYY-MM-DD)
 * @returns {Promise<object>} Updated outfit details with items
 */
export async function logOutfitWear(outfitId, date) {
  const body = date ? { date } : {};
  return apiClient(`/wear/outfit/${outfitId}`, {
    method: 'POST',
    body,
  });
}

/**
 * Fetch wear history for the authenticated user
 * @param {number} [limit=30]
 * @returns {Promise<Array<object>>} List of wear log entries
 */
export async function getWearHistory(limit = 30) {
  return apiClient(`/wear/history?limit=${limit}`, {
    method: 'GET',
  });
}

/**
 * Delete a wear log entry (undo wear event)
 * @param {string} logId
 * @returns {Promise<{ message: string }>} Success response
 */
export async function deleteWearLog(logId) {
  return apiClient(`/wear/${logId}`, {
    method: 'DELETE',
  });
}

export default {
  logItemWear,
  logOutfitWear,
  getWearHistory,
  deleteWearLog,
};

