import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImage, createItem } from '../api/items.js';
import ItemForm from '../components/ItemForm.jsx';

export default function AddItem() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleSubmit = async ({ formData, imageFile }) => {
    setError('');
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
        ...formData,
        imageUrl: uploadedImageUrl || undefined,
        imagePublicId: uploadedImagePublicId || undefined,
      };

      await createItem(payload);

      // Redirect to /wardrobe with success banner
      navigate('/wardrobe', {
        state: { message: `"${formData.name}" has been added to your wardrobe!` },
      });
    } catch (err) {
      setError(err.message || 'Failed to add item. Please try again.');
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <ItemForm
      title="Add Wardrobe Item"
      subtitle="Add a new clothing item, shoes, or accessory to your collection"
      submitButtonText="Add Item to Wardrobe"
      cancelLink="/wardrobe"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      uploadStatus={uploadStatus}
      error={error}
    />
  );
}
