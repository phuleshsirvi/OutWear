import apiClient from './client.js';

/**
 * Upload an image file to Cloudinary via server upload endpoint
 * - Sends multipart/form-data with field name "image"
 * - Does NOT manually set Content-Type header (browser sets boundary)
 * - Uses credentials: "include" via apiClient
 * @param {File} file
 * @returns {Promise<{ imageUrl: string, imagePublicId: string }>}
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  return apiClient('/uploads/image', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Create a new wardrobe item
 * @param {object} data
 * @returns {Promise<object>} Created item
 */
export async function createItem(data) {
  return apiClient('/items', {
    method: 'POST',
    body: data,
  });
}

/**
 * Fetch wardrobe items for the authenticated user with optional filters
 * Sends non-empty filters as a query string (skipping empty/null values)
 * @param {object} [params] - { search, category, color, season, occasion }
 * @returns {Promise<Array<object>>} List of items
 */
export async function getItems(params = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.append(key, String(value).trim());
    }
  }

  const queryString = query.toString();
  const endpoint = queryString ? `/items?${queryString}` : '/items';

  return apiClient(endpoint, {
    method: 'GET',
  });
}

/**
 * Fetch filter options (available colors) for the authenticated user
 * @returns {Promise<{ colors: string[] }>}
 */
export async function getFilterOptions() {
  return apiClient('/items/filters', {
    method: 'GET',
  });
}

/**
 * Fetch a single wardrobe item by ID
 * @param {string} id
 * @returns {Promise<object>} Item details
 */
export async function getItem(id) {
  return apiClient(`/items/${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing wardrobe item
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>} Updated item
 */
export async function updateItem(id, data) {
  return apiClient(`/items/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Delete a wardrobe item
 * @param {string} id
 * @returns {Promise<{ message: string }>} Success message
 */
export async function deleteItem(id) {
  return apiClient(`/items/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch underused items for the authenticated user
 * @param {object} [params] - { days: 30|60|90, category?: string }
 * @returns {Promise<{ summary: object, items: Array<object> }>}
 */
export async function getUnderused(params = {}) {
  const query = new URLSearchParams();

  if (params.days) query.append('days', String(params.days));
  if (params.category && params.category.trim()) {
    query.append('category', params.category.trim());
  }

  const qs = query.toString();
  const endpoint = qs ? `/items/underused?${qs}` : '/items/underused';

  return apiClient(endpoint, { method: 'GET' });
}

export default {
  uploadImage,
  createItem,
  getItems,
  getFilterOptions,
  getItem,
  updateItem,
  deleteItem,
  getUnderused,
};
