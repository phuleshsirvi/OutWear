import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getItem, updateItem, uploadImage } from '../api/items.js';
import ItemForm from '../components/ItemForm.jsx';
import Button from '../components/ui/Button.jsx';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Fetch the item on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError('');

    async function fetchItem() {
      try {
        const data = await getItem(id);
        if (isMounted) {
          setItem(data);
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404) {
            setLoadError('Item not found or does not belong to you.');
          } else {
            setLoadError(err.message || 'Failed to load wardrobe item.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchItem();

    return () => {
      isMounted = false;
    };
  }, [id, retryCount]);

  const handleSubmit = async ({ formData, imageFile }) => {
    setSubmitError('');
    setIsSubmitting(true);
    setUploadStatus('Saving changes...');

    try {
      let finalImageUrl = item?.imageUrl;
      let finalImagePublicId = item?.imagePublicId;

      // If user selected a new image file, upload it to Cloudinary first
      if (imageFile) {
        setUploadStatus('Uploading new image to Cloudinary...');
        const uploadResult = await uploadImage(imageFile);
        finalImageUrl = uploadResult.imageUrl;
        finalImagePublicId = uploadResult.imagePublicId;
      }

      setUploadStatus('Updating wardrobe item...');
      const payload = {
        ...formData,
        imageUrl: finalImageUrl || undefined,
        imagePublicId: finalImagePublicId || undefined,
      };

      await updateItem(id, payload);

      // Redirect to /wardrobe with success banner
      navigate('/wardrobe', {
        state: { message: `"${formData.name}" has been updated successfully!` },
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to update item. Please try again.');
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 flex flex-col items-center justify-center space-y-4 font-sans animate-fade-in-up">
        <div className="w-10 h-10 border-4 border-[#4F5BD5]/20 border-t-[#4F5BD5] rounded-full animate-spin" />
        <p className="text-[#6B7194] text-sm">Loading item details...</p>
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <div className="w-full max-w-md mx-auto py-16 text-center space-y-4 font-sans animate-fade-in-up">
        <div className="rounded-3xl bg-white/75 border border-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center text-2xl shadow-xs">
            ⚠️
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-heading text-[#1E2140]">Item Not Found</h2>
            <p className="text-[#6B7194] text-sm">{loadError || 'The requested item could not be found.'}</p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setRetryCount((c) => c + 1)}
            >
              Try again
            </Button>
            <Button
              as={Link}
              to="/wardrobe"
              variant="secondary"
              size="md"
            >
              ← Back to Wardrobe
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ItemForm
      initialData={item}
      title="Edit Wardrobe Item"
      subtitle={`Updating "${item.name}"`}
      submitButtonText="Save Changes"
      cancelLink="/wardrobe"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      uploadStatus={uploadStatus}
      error={submitError}
    />
  );
}

