"use client";

import { useEffect, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import ProductUrls from '@/components/ProductUrls';
import ImageCountSelector from '@/components/ImageCountSelector';
import GenerateButton from '@/components/GenerateButton';
import ResultsDisplay from '@/components/ResultsDisplay';
import { getCurrentPromptId, getPromptById } from '@/lib/settings';

export default function Home() {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [productUrls, setProductUrls] = useState<string[]>(['']);
  const [imageCount, setImageCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [promptInput, setPromptInput] = useState<string>('');

  const validateImageUrl = async (url: string): Promise<boolean> => {
    const trimmed = url.trim();
    try {
      const head = await fetch(trimmed, { method: 'HEAD' });
      const ctH = head.headers.get('Content-Type') || '';
      if (head.ok && ctH.toLowerCase().startsWith('image/')) return true;
    } catch {}
    try {
      const resp = await fetch(trimmed, { method: 'GET' });
      const ct = resp.headers.get('Content-Type') || '';
      if (resp.ok && ct.toLowerCase().startsWith('image/')) return true;
    } catch {}
    // Fallback: HTMLImageElement load
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = trimmed;
    });
    return ok;
  };

  const handleGenerate = async () => {
    if (!userImage) {
      setError('Please upload a user image');
      return;
    }

    // Filter non-empty URLs; they will have been validated in the UI component
    const validUrls = productUrls.map(u => u.trim()).filter(u => u.length > 0);

    // Pre-validate provided URLs; block if any invalid
    for (const u of validUrls) {
      const ok = await validateImageUrl(u);
      if (!ok) {
        setError('One or more product URLs are not valid images');
        return;
      }
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const formData = new FormData();
      formData.append('user_image', userImage);
      formData.append('product_urls', validUrls.join(','));
      formData.append('image_count', imageCount.toString());

      // Determine prompt: user input > saved currentSetting > default
      const manual = promptInput.trim();
      let promptToUse = '';
      if (manual.length > 0) {
        promptToUse = manual;
      } else {
        const currentId = getCurrentPromptId();
        promptToUse = getPromptById(currentId).content;
      }
      formData.append('prompt', promptToUse);

      // Call our Next.js API proxy route (server-to-server forwards to Python backend)
      const response = await fetch(`/api/generate-images`, {
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
              <h2 className="text-xl font-semibold mb-4">Prompt</h2>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Optional: Enter a prompt to override the default or saved one"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-28 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">If left empty, your saved current prompt from Settings (or the default) will be used.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Product urls</h2>
              <ProductUrls
                urls={productUrls}
                onUrlsChange={setProductUrls}
                onValidationChange={(hasInvalid) => setError(prev => hasInvalid ? 'One or more product URLs are not valid images' : (prev === 'One or more product URLs are not valid images' ? null : prev))}
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
                disabled={!userImage || (error === 'One or more product URLs are not valid images')}
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
