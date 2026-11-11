import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getItem, updateItem, uploadImage } from '../api/items.js';
import ItemForm from '../components/ItemForm.jsx';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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
  }, [id]);

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
      <div className="w-full max-w-2xl mx-auto py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading item details...</p>
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <div className="w-full max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100">Item Not Found</h2>
          <p className="text-slate-400 text-sm">{loadError || 'The requested item could not be found.'}</p>
        </div>
        <div className="pt-2">
          <Link
            to="/wardrobe"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
          >
            ← Back to Wardrobe
          </Link>
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

