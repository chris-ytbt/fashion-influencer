"use client";

import { useState } from 'react';

interface ResultsDisplayProps {
  images: string[];
  isLoading: boolean;
}

export default function ResultsDisplay({ images, isLoading }: ResultsDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleDownload = async (image: string, index: number) => {
    setDownloadingIndex(index);
    try {
      // Robust download: convert to Blob and use an object URL
      const toBlob = async (src: string): Promise<Blob> => {
        // If it's a data URL or http(s) URL, fetch will return a Blob reliably
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Fetch failed with ${res.status}`);
        return await res.blob();
      };

      const blob = await toBlob(image);

      // Determine extension based on MIME type
      const mime = blob.type || (image.startsWith('data:') ? (image.match(/^data:([^;]+);/)?.[1] || '') : '');
      const ext = mime.includes('png') ? 'png' : mime.includes('svg') ? 'svg' : mime.includes('webp') ? 'webp' : 'jpg';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fashion-influencer-image-${index + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setDownloadingIndex(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="animate-spin h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Generating your fashion influencer images...</span>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          No images generated yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Upload your photo and add product URLs to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Generated {images.length} image{images.length > 1 ? 's' : ''}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Generated fashion influencer image ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => handleImageClick(image)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                  <button
                    onClick={() => handleImageClick(image)}
                    className="px-3 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(image, index)}
                    disabled={downloadingIndex === index}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {downloadingIndex === index ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for full-size image view */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Full size generated image"
              className="max-w-full max-h-full rounded-lg"
              onClick={handleCloseModal}
            />
          </div>
        </div>
      )}
    </>
  );
}