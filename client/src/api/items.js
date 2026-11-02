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
 * Fetch all wardrobe items for the authenticated user
 * @returns {Promise<Array<object>>} List of items
 */
export async function getItems() {
  return apiClient('/items', {
    method: 'GET',
  });
}

export default {
  uploadImage,
  createItem,
  getItems,
};
