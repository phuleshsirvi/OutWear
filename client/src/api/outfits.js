import apiClient from './client.js';

/**
 * Fetch all outfits for the logged-in user (newest first)
 * @returns {Promise<Array<object>>} List of outfits with items
 */
export async function getOutfits() {
  return apiClient('/outfits', {
    method: 'GET',
  });
}

/**
 * Fetch a single outfit by ID
 * @param {string} id
 * @returns {Promise<object>} Outfit details with items
 */
export async function getOutfit(id) {
  return apiClient(`/outfits/${id}`, {
    method: 'GET',
  });
}

/**
 * Create a new outfit
 * @param {object} data - { name, occasion, itemIds }
 * @returns {Promise<object>} Created outfit
 */
export async function createOutfit(data) {
  return apiClient('/outfits', {
    method: 'POST',
    body: data,
  });
}

/**
 * Update an existing outfit
 * @param {string} id
 * @param {object} data - { name, occasion, itemIds }
 * @returns {Promise<object>} Updated outfit
 */
export async function updateOutfit(id, data) {
  return apiClient(`/outfits/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Delete an outfit
 * @param {string} id
 * @returns {Promise<{ message: string }>} Success message
 */
export async function deleteOutfit(id) {
  return apiClient(`/outfits/${id}`, {
    method: 'DELETE',
  });
}

export default {
  getOutfits,
  getOutfit,
  createOutfit,
  updateOutfit,
  deleteOutfit,
};

