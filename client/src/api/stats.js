import apiClient from './client.js';

/**
 * Fetches wardrobe and wear statistics for the authenticated user.
 * @returns {Promise<object>} Detailed stats object
 */
export async function getStats() {
  return apiClient('/stats', {
    method: 'GET',
  });
}

export default {
  getStats,
};

