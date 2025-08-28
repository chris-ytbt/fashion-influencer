"use client";

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import ProductUrls from '@/components/ProductUrls';
import ImageCountSelector from '@/components/ImageCountSelector';
import GenerateButton from '@/components/GenerateButton';
import ResultsDisplay from '@/components/ResultsDisplay';

export default function Home() {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [productUrls, setProductUrls] = useState<string[]>(['']);
  const [imageCount, setImageCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!userImage) {
      setError('Please upload a user image');
      return;
    }

    const validUrls = productUrls.filter(url => url.trim() !== '');
    if (validUrls.length === 0) {
      setError('Please add at least one product URL');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const formData = new FormData();
      formData.append('user_image', userImage);
      formData.append('product_urls', validUrls.join(','));
      formData.append('image_count', imageCount.toString());

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/generate-images`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedImages(result.images);
      } else {
        setError(result.error || 'Failed to generate images');
      }
    } catch {
      setError('Network error: Please make sure the backend server is running');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Generate Influencer Images
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Transform your photos into professional fashion influencer images using AI
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Drop your picture</h2>
              <ImageUpload
                onImageSelect={setUserImage}
                selectedImage={userImage}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Product urls</h2>
              <ProductUrls
                urls={productUrls}
                onUrlsChange={setProductUrls}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Image count</h2>
              <ImageCountSelector
                count={imageCount}
                onCountChange={setImageCount}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <GenerateButton
                onClick={handleGenerate}
                isGenerating={isGenerating}
                disabled={!userImage || productUrls.every(url => url.trim() === '')}
              />
              {error && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <ResultsDisplay
              images={generatedImages}
              isLoading={isGenerating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
