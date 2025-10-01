import { getStorageInstance } from './config';

// Test Firebase Storage connection
export const testStorageConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Firebase Storage connection...');
    const { storage } = await getStorageInstance();
    const { ref } = await import('firebase/storage');
    // Try to get a reference (this will fail if storage isn't set up)
    const testRef = ref(storage, 'test/connection');
    console.log('✅ Storage reference created successfully:', testRef.fullPath);

    return true;
  } catch (error) {
    console.error('❌ Storage connection failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('storage/app-deleted')) {
        console.log('🔧 Storage not initialized. Need to set up Firebase Storage in console.');
        return false;
      }
      if (error.message.includes('storage/unauthorized')) {
        console.log('🔧 Storage permissions issue. Check Firebase rules.');
        return false;
      }
    }

    return false;
  }
};

// Simplified upload function for testing
export const testImageUpload = async (file: File): Promise<string> => {
  console.log('🧪 Testing image upload with file:', file.name, file.size, 'bytes');
  // Always use base64 for testing
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Very small thumbnail for testing
      const size = 100;
      canvas.width = size;
      canvas.height = size;

      // Draw and compress heavily
      ctx?.drawImage(img, 0, 0, size, size);
      const tinyBase64 = canvas.toDataURL('image/jpeg', 0.1); // 10% quality

      console.log('✅ Test image processed:', tinyBase64.length, 'characters');

      if (tinyBase64.length > 1500) {
        reject(new Error(`Image still too large: ${tinyBase64.length} characters`));
      } else {
        resolve(tinyBase64);
      }
    };

    img.onerror = () => reject(new Error('Failed to process image'));

    const reader = new FileReader();
    reader.onload = (e) => img.src = e.target?.result as string;
    reader.readAsDataURL(file);
  });
};