import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, SEASONS, OCCASIONS } from '../constants/wardrobe.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function formatLabel(str) {
  if (!str) return '';
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

export default function ItemForm({
  initialData = {},
  onSubmit,
  isSubmitting = false,
  uploadStatus = '',
  error: externalError = '',
  title = 'Wardrobe Item',
  subtitle = 'Manage clothing item details',
  submitButtonText = 'Save Item',
  cancelLink = '/wardrobe',
}) {
  const fileInputRef = useRef(null);

  // Form input states
  const [name, setName] = useState(initialData.name || '');
  const [category, setCategory] = useState(initialData.category || CATEGORIES[0]);
  const [color, setColor] = useState(initialData.color || '');
  const [season, setSeason] = useState(initialData.season || SEASONS[0]);
  const [occasion, setOccasion] = useState(initialData.occasion || OCCASIONS[0]);
  const [fabric, setFabric] = useState(initialData.fabric || '');
  const [price, setPrice] = useState(
    initialData.price !== undefined && initialData.price !== null ? String(initialData.price) : ''
  );

  // Existing image info from initialData
  const [existingImageUrl, setExistingImageUrl] = useState(initialData.imageUrl || null);

  // New image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Local validation error
  const [validationError, setValidationError] = useState('');

  // Sync if initialData changes (e.g. when data finishes fetching)
  useEffect(() => {
    if (initialData.name !== undefined) setName(initialData.name || '');
    if (initialData.category) setCategory(initialData.category);
    if (initialData.color !== undefined) setColor(initialData.color || '');
    if (initialData.season) setSeason(initialData.season);
    if (initialData.occasion) setOccasion(initialData.occasion);
    if (initialData.fabric !== undefined) setFabric(initialData.fabric || '');
    if (initialData.price !== undefined && initialData.price !== null) {
      setPrice(String(initialData.price));
    }
    if (initialData.imageUrl !== undefined) {
      setExistingImageUrl(initialData.imageUrl);
    }
  }, [initialData]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    setValidationError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setValidationError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError('File is too large. Maximum allowed size is 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveNewImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Please provide an item name.');
      return;
    }

    if (!color.trim()) {
      setValidationError('Please specify a color.');
      return;
    }

    const formData = {
      name: name.trim(),
      category,
      color: color.trim().toLowerCase(),
      season,
      occasion,
      fabric: fabric.trim() || undefined,
      price: price !== '' ? parseFloat(price) : undefined,
    };

    onSubmit({
      formData,
      imageFile,
      existingImageUrl,
    });
  };

  const displayError = validationError || externalError;

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-8">
      <div className="bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">{subtitle}</p>
          </div>
          <Link
            to={cancelLink}
            className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← Cancel
          </Link>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div
            role="alert"
            className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-sm text-red-400 flex items-start space-x-2"
          >
            <span className="text-base leading-none">⚠️</span>
            <span>{displayError}</span>
          </div>
        )}

        {/* Form */}
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

          {/* Fabric & Price */}
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

          {/* Photo Section with Current Photo / New Photo Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Item Photo <span className="text-slate-500 font-normal">(Optional, max 5 MB)</span>
            </label>

            {/* Case 1: A new image file has been chosen */}
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-indigo-500/40 bg-slate-950/60 p-3 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <img
                  src={imagePreview}
                  alt="New photo preview"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-indigo-500/30"
                />
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    New Photo Selected
                  </span>
                  <p className="text-xs font-medium text-slate-200 truncate max-w-[240px]">
                    {imageFile?.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(imageFile?.size ? imageFile.size / (1024 * 1024) : 0).toFixed(2)} MB
                  </p>
                  <div className="flex items-center justify-center sm:justify-start space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={() => !isSubmitting && fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer disabled:opacity-50"
                    >
                      Choose different photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveNewImage}
                      disabled={isSubmitting}
                      className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer disabled:opacity-50"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : existingImageUrl ? (
              /* Case 2: Has existing photo from Cloudinary and no new file chosen */
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950/60 p-3 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <img
                  src={existingImageUrl}
                  alt="Current item photo"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-800"
                />
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Current Photo
                  </span>
                  <p className="text-xs text-slate-400">
                    Keep this photo or select a new one to replace it.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => !isSubmitting && fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      📷 Change photo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Case 3: No photo at all */
              <div
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-900/40 hover:bg-slate-900/70 group ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition">
                  📸
                </div>
                <p className="text-sm text-slate-300 font-medium">Click to select an image</p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, and WebP (up to 5 MB)
                </p>
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
                  <span>{uploadStatus || 'Saving...'}</span>
                </>
              ) : (
                <span>{submitButtonText}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

