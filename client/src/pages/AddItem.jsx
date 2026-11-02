import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CATEGORIES, SEASONS, OCCASIONS } from '../constants/wardrobe.js';
import { uploadImage, createItem } from '../api/items.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Helper to format string values into Title Case for select options
function formatLabel(str) {
  if (!str) return '';
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

export default function AddItem() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form input states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [color, setColor] = useState('');
  const [season, setSeason] = useState(SEASONS[0]);
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [fabric, setFabric] = useState('');
  const [price, setPrice] = useState('');

  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // UI status states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Handle client-side image selection & validation
  const handleImageChange = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Check file size (max 5 MB)
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum allowed size is 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!name.trim()) {
      setError('Please provide an item name.');
      return;
    }

    if (!color.trim()) {
      setError('Please specify a color.');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('Saving item...');

    try {
      let uploadedImageUrl = null;
      let uploadedImagePublicId = null;

      // 1. Upload photo first if one was chosen
      if (imageFile) {
        setUploadStatus('Uploading image to Cloudinary...');
        const uploadResult = await uploadImage(imageFile);
        uploadedImageUrl = uploadResult.imageUrl;
        uploadedImagePublicId = uploadResult.imagePublicId;
      }

      // 2. Create the wardrobe item with returned image details
      setUploadStatus('Creating wardrobe item...');
      const payload = {
        name: name.trim(),
        category,
        color: color.trim().toLowerCase(),
        season,
        occasion,
        fabric: fabric.trim() || undefined,
        price: price !== '' ? parseFloat(price) : undefined,
        imageUrl: uploadedImageUrl || undefined,
        imagePublicId: uploadedImagePublicId || undefined,
      };

      await createItem(payload);

      setSuccess('Item added to your wardrobe successfully!');
      setUploadStatus('');

      // Redirect to /wardrobe with success message
      setTimeout(() => {
        navigate('/wardrobe', {
          state: { message: `"${name.trim()}" has been added to your wardrobe!` },
        });
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to add item. Please try again.');
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-8">
      <div className="bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Add Wardrobe Item
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Add a new clothing item, shoes, or accessory to your collection
            </p>
          </div>
          <Link
            to="/wardrobe"
            className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← Cancel
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-sm text-red-400 flex items-start space-x-2"
          >
            <span className="text-base leading-none">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div
            role="status"
            className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-400 flex items-start space-x-2"
          >
            <span className="text-base leading-none">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Add Item Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1.5">
              Item Name <span className="text-indigo-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              disabled={isSubmitting}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linen Button-Down Shirt"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
            />
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-xs font-medium text-slate-300 mb-1.5">
                Category <span className="text-indigo-400">*</span>
              </label>
              <select
                id="category"
                required
                disabled={isSubmitting}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatLabel(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="color" className="block text-xs font-medium text-slate-300 mb-1.5">
                Color <span className="text-indigo-400">*</span>
              </label>
              <input
                id="color"
                type="text"
                required
                disabled={isSubmitting}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Navy Blue, Beige, Olive"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
              />
            </div>
          </div>

          {/* Season & Occasion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="season" className="block text-xs font-medium text-slate-300 mb-1.5">
                Season <span className="text-indigo-400">*</span>
              </label>
              <select
                id="season"
                required
                disabled={isSubmitting}
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
              >
                {SEASONS.map((seas) => (
                  <option key={seas} value={seas}>
                    {formatLabel(seas)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="occasion" className="block text-xs font-medium text-slate-300 mb-1.5">
                Occasion <span className="text-indigo-400">*</span>
              </label>
              <select
                id="occasion"
                required
                disabled={isSubmitting}
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
              >
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {formatLabel(occ)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fabric & Price (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fabric" className="block text-xs font-medium text-slate-300 mb-1.5">
                Fabric <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="fabric"
                type="text"
                disabled={isSubmitting}
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. Cotton, Linen, Wool, Silk"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-xs font-medium text-slate-300 mb-1.5">
                Price (₹ / $) <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                disabled={isSubmitting}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 49.99"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition disabled:opacity-50"
              />
            </div>
          </div>

          {/* Photo Picker with Image Preview */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Item Photo <span className="text-slate-500 font-normal">(Optional, max 5 MB)</span>
            </label>

            {!imagePreview ? (
              <div
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-900/40 hover:bg-slate-900/70 group ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition">
                  📸
                </div>
                <p className="text-sm text-slate-300 font-medium">
                  Click to select an image
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, and WebP (up to 5 MB)
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950/60 p-3 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <img
                  src={imagePreview}
                  alt="Item preview"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-800"
                />
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <p className="text-xs font-medium text-slate-200 truncate max-w-[240px]">
                    {imageFile?.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(imageFile?.size ? imageFile.size / (1024 * 1024) : 0).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                    className="inline-flex items-center text-xs text-red-400 hover:text-red-300 transition pt-1 cursor-pointer disabled:opacity-50"
                  >
                    ✕ Remove image
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isSubmitting}
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{uploadStatus || 'Adding item...'}</span>
                </>
              ) : (
                <span>Add Item to Wardrobe</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

