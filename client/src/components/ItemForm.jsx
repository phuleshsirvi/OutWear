import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ArrowLeft, UploadCloud } from 'lucide-react';
import { CATEGORIES, SEASONS, OCCASIONS } from '../constants/wardrobe.js';
import { getColorInfo } from '../constants/colors.js';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, Badge } from './ui/index.js';

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
  const isEdit = Boolean(initialData?.id || title.toLowerCase().includes('edit'));

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
  const [isDragging, setIsDragging] = useState(false);

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

  const processFile = (file) => {
    setValidationError('');
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSubmitting) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isSubmitting) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemoveNewImage = (e) => {
    e?.stopPropagation();
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
  const activeColorInfo = color.trim() ? getColorInfo(color) : null;

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-6 animate-fade-in-up font-sans">
      {/* Profile-Style Header Card with Breadcrumb */}
      <div className="bg-white/75 border border-white/70 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-semibold text-[#6B7194]">
            <Link to={cancelLink} className="hover:text-[#4F5BD5] transition-colors">
              Wardrobe
            </Link>
            <span>/</span>
            <span className="text-[#1E2140] font-bold">
              {isEdit ? 'Edit item' : 'Add item'}
            </span>
          </nav>
          <div className="flex items-center gap-3 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center text-2xl shadow-xs shrink-0">
              👗
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-[#1E2140] tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7194]">{subtitle}</p>
            </div>
          </div>
        </div>

        <Button
          as={Link}
          to={cancelLink}
          variant="secondary"
          size="sm"
          className="self-start sm:self-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Wardrobe</span>
        </Button>
      </div>

      {/* Global Form Error Alert */}
      {displayError && (
        <div
          role="alert"
          className="rounded-2xl bg-[#FBE3DC] border border-rose-300 p-4 text-xs sm:text-sm text-[#C2492E] flex items-start space-x-3 shadow-xs"
        >
          <span className="text-base leading-none">⚠️</span>
          <span className="font-semibold">{displayError}</span>
        </div>
      )}

      {/* Two Column Layout Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Drag-and-Drop Photo Area with Dashed Indigo Border (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E2140]">
              Item Photo <span className="text-[#6B7194] font-normal lowercase">(optional, max 5 MB)</span>
            </label>
            {imagePreview ? (
              <Badge variant="primary" size="sm">New selected</Badge>
            ) : existingImageUrl ? (
              <Badge variant="neutral" size="sm">Current photo</Badge>
            ) : null}
          </div>

          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            className={`relative rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer select-none group border-2 border-dashed ${
              isDragging
                ? 'border-[#4F5BD5] bg-[#E3E6FB]/50 ring-4 ring-[#4F5BD5]/20 scale-[1.01]'
                : imagePreview || existingImageUrl
                ? 'border-[#4F5BD5]/40 bg-white/70 hover:border-[#4F5BD5] shadow-[0_10px_30px_rgba(99,102,241,0.08)]'
                : 'border-[#4F5BD5]/40 hover:border-[#4F5BD5] bg-white/60 hover:bg-white/80 shadow-[0_10px_30px_rgba(99,102,241,0.06)]'
            } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {/* Visual Photo Area */}
            {imagePreview ? (
              /* Case 1: New file picked */
              <div className="space-y-4">
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white/40 border border-[#4F5BD5]/30 shadow-md">
                  <img
                    src={imagePreview}
                    alt="New preview"
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <p className="text-xs font-semibold text-white truncate" title={imageFile?.name}>
                      {imageFile?.name}
                    </p>
                    <p className="text-[11px] text-[#B8BEF5] font-mono">
                      {(imageFile?.size ? imageFile.size / (1024 * 1024) : 0).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Change photo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleRemoveNewImage}
                  >
                    ✕ Remove
                  </Button>
                </div>
              </div>
            ) : existingImageUrl ? (
              /* Case 2: Existing image */
              <div className="space-y-4">
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white/40 border border-white/80 shadow-md">
                  <img
                    src={existingImageUrl}
                    alt="Current wardrobe item"
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <p className="text-xs font-semibold text-white">Current Photo</p>
                    <p className="text-[11px] text-white/80">Click anywhere to replace with a new one</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="w-full gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Change photo</span>
                </Button>
              </div>
            ) : (
              /* Case 3: Empty Dropzone */
              <div className="py-12 sm:py-16 px-4 text-center flex flex-col items-center justify-center space-y-4 min-h-[320px]">
                <div className="w-16 h-16 rounded-3xl bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center text-3xl shadow-xs group-hover:scale-105 transition-transform duration-200">
                  <UploadCloud className="w-8 h-8 text-[#4F5BD5]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold font-heading text-[#1E2140]">
                    Drag and drop photo here
                  </p>
                  <p className="text-xs text-[#6B7194]">
                    or <span className="text-[#4F5BD5] font-semibold group-hover:underline">browse files</span> from your device
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] text-[#6B7194] font-mono px-3 py-1 rounded-full bg-white/70 border border-white/80 shadow-xs">
                    JPEG, PNG, WebP · Max 5 MB
                  </span>
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

          <p className="text-[11px] text-[#6B7194] text-center">
            Tip: Clean photos with neutral backgrounds look best in outfit combinations.
          </p>
        </div>

        {/* Right Column: Fields in Glass Card Sections (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Section 1: Basics */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <CardTitle>Basics</CardTitle>
              </div>
              <CardDescription>
                Primary identification and wardrobe category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Item Name"
                required
                disabled={isSubmitting}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linen Button-Down Shirt, Straight Leg Jeans"
              />

              <Select
                label="Category"
                required
                disabled={isSubmitting}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatLabel(cat)}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          {/* Card Section 2: Style */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <CardTitle>Style & Aesthetics</CardTitle>
              </div>
              <CardDescription>
                Color, season, and occasion styling tags.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Color with Color Preview Dot */}
              <div>
                <Input
                  label="Color"
                  required
                  disabled={isSubmitting}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Navy Blue, Beige, Olive, Charcoal"
                  suffixIcon={
                    activeColorInfo ? (
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 shadow-xs"
                        style={{ backgroundColor: activeColorInfo.hex }}
                        title={`Detected tone: ${activeColorInfo.hex}`}
                      />
                    ) : null
                  }
                />
              </div>

              {/* Season: Selectable Pills */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#1E2140]">
                  Season <span className="text-[#4F5BD5]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SEASONS.map((seas) => {
                    const isSelected = season === seas;
                    return (
                      <button
                        key={seas}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setSeason(seas)}
                        className={`py-2 px-3 min-h-[44px] rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none text-center flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#4F5BD5] text-white shadow-[0_4px_14px_rgba(79,91,213,0.28)] -translate-y-0.5'
                            : 'bg-white/80 hover:bg-white text-[#6B7194] hover:text-[#1E2140] border border-white/80 shadow-xs'
                        } disabled:opacity-50`}
                      >
                        {formatLabel(seas)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Occasion: Selectable Pills */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#1E2140]">
                  Occasion <span className="text-[#4F5BD5]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OCCASIONS.map((occ) => {
                    const isSelected = occasion === occ;
                    return (
                      <button
                        key={occ}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setOccasion(occ)}
                        className={`py-2 px-3 min-h-[44px] rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none text-center flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#4F5BD5] text-white shadow-[0_4px_14px_rgba(79,91,213,0.28)] -translate-y-0.5'
                            : 'bg-white/80 hover:bg-white text-[#6B7194] hover:text-[#1E2140] border border-white/80 shadow-xs'
                        } disabled:opacity-50`}
                      >
                        {formatLabel(occ)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Section 3: Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-[#E3E6FB] text-[#4F5BD5] flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <CardTitle>Details</CardTitle>
              </div>
              <CardDescription>
                Fabric material composition and cost information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Fabric"
                  disabled={isSubmitting}
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  placeholder="e.g. 100% Cotton, Linen, Wool"
                  helperText="Optional material composition"
                />

                <Input
                  label="Price (₹ / $)"
                  type="number"
                  min="0"
                  step="0.01"
                  prefixIcon="₹"
                  disabled={isSubmitting}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1999.00"
                  helperText="Helps calculate cost-per-wear"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full sm:flex-1 shadow-[0_4px_16px_rgba(79,91,213,0.25)]"
            >
              {isSubmitting ? uploadStatus || 'Saving Item...' : submitButtonText}
            </Button>

            <Button
              as={Link}
              to={cancelLink}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
