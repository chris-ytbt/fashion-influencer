"use client";

import { useCallback } from 'react';

interface ProductUrlsProps {
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
}

export default function ProductUrls({ urls, onUrlsChange }: ProductUrlsProps) {
  const handleUrlChange = useCallback((index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    onUrlsChange(newUrls);
  }, [urls, onUrlsChange]);

  const handleAddUrl = useCallback(() => {
    onUrlsChange([...urls, '']);
  }, [urls, onUrlsChange]);

  const handleRemoveUrl = useCallback((index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      onUrlsChange(newUrls);
    }
  }, [urls, onUrlsChange]);

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (not required)
    try {
      new URL(url);
      return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {urls.map((url, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              url:
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
              placeholder="https://example.com/product-image.jpg"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                url && !isValidUrl(url)
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
            />
            {url && !isValidUrl(url) && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Please enter a valid image URL (jpg, jpeg, png, gif, webp)
              </p>
            )}
          </div>
          <button
            onClick={() => handleRemoveUrl(index)}
            disabled={urls.length === 1}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
              urls.length === 1
                ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title="Remove URL"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}

      <button
        onClick={handleAddUrl}
        className="flex items-center space-x-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Add another product URL</span>
      </button>

      {urls.filter(url => url.trim()).length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {urls.filter(url => url.trim()).length} product URL(s) added
        </div>
      )}
    </div>
  );
}