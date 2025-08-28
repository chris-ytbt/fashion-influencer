"use client";

interface ImageCountSelectorProps {
  count: number;
  onCountChange: (count: number) => void;
}

export default function ImageCountSelector({ count, onCountChange }: ImageCountSelectorProps) {
  const options = [1, 2, 3, 4];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Number of images to generate:
      </label>
      <select
        value={count}
        onChange={(e) => onCountChange(parseInt(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option} image{option > 1 ? 's' : ''}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Generate 1-4 images in a single batch. More images may take longer to process.
      </p>
    </div>
  );
}