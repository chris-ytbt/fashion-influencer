"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ProductUrlsProps {
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  onValidationChange?: (hasInvalid: boolean) => void;
}

export default function ProductUrls({ urls, onUrlsChange, onValidationChange }: ProductUrlsProps) {
  const [statuses, setStatuses] = useState<Array<'idle' | 'validating' | 'valid' | 'invalid'>>(
    () => urls.map(() => 'idle')
  );
  const debounceTimers = useRef<Record<number, number | undefined>>({});

  useEffect(() => {
    // keep statuses array length in sync with urls
    setStatuses(prev => {
      if (prev.length === urls.length) return prev;
      const next = [...prev];
      while (next.length < urls.length) next.push('idle');
      while (next.length > urls.length) next.pop();
      return next;
    });
  }, [urls.length]);

  useEffect(() => {
    if (onValidationChange) {
      const hasInvalid = urls.some((u, i) => u.trim() && statuses[i] === 'invalid');
      onValidationChange(hasInvalid);
    }
  }, [urls, statuses, onValidationChange]);

  const handleUrlChange = useCallback((index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    onUrlsChange(newUrls);
    // reset status and debounce validate
    setStatuses(s => {
      const copy = [...s];
      copy[index] = value.trim() ? 'validating' : 'idle';
      return copy;
    });
    // debounce
    if (debounceTimers.current[index]) {
      window.clearTimeout(debounceTimers.current[index]);
    }
    debounceTimers.current[index] = window.setTimeout(() => {
      validateUrl(index, value).catch(() => {
        // ignore
      });
    }, 500);
  }, [urls, onUrlsChange]);

  const handleAddUrl = useCallback(() => {
    onUrlsChange([...urls, '']);
  }, [urls, onUrlsChange]);

  const handleRemoveUrl = useCallback((index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      onUrlsChange(newUrls);
      setStatuses(s => s.filter((_, i) => i !== index));
    }
  }, [urls, onUrlsChange]);

  const validateUrl = useCallback(async (index: number, url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatuses(s => {
        const copy = [...s];
        copy[index] = 'idle';
        return copy;
      });
      return;
    }
    // basic URL parse check
    try { new URL(trimmed); } catch {
      setStatuses(s => { const copy = [...s]; copy[index] = 'invalid'; return copy; });
      return;
    }
    setStatuses(s => { const copy = [...s]; copy[index] = 'validating'; return copy; });
    try {
      // Try HEAD first; some CDNs may not allow HEAD => fallback to GET
      let ok = false;
      try {
        const headResp = await fetch(trimmed, { method: 'HEAD' });
        const ct = headResp.headers.get('Content-Type') || '';
        ok = headResp.ok && ct.toLowerCase().startsWith('image/');
      } catch {
        // ignore and fallback
      }
      if (!ok) {
        try {
          const resp = await fetch(trimmed, { method: 'GET' });
          const ct = resp.headers.get('Content-Type') || '';
          ok = resp.ok && ct.toLowerCase().startsWith('image/');
        } catch {
          ok = false;
        }
      }
      if (!ok) {
        // Fallback: attempt to load via HTMLImageElement which works cross-origin for load event
        ok = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = trimmed;
        });
      }
      setStatuses(s => {
        const copy = [...s];
        copy[index] = ok ? 'valid' : 'invalid';
        return copy;
      });
    } catch {
      setStatuses(s => { const copy = [...s]; copy[index] = 'invalid'; return copy; });
    }
  }, []);

  const anyInvalid = useMemo(() => urls.some((u, i) => u.trim() && statuses[i] === 'invalid'), [urls, statuses]);

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
              onBlur={() => validateUrl(index, url)}
              placeholder="https://example.com/product-image"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                url.trim() && statuses[index] === 'invalid'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : statuses[index] === 'validating'
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
            />
            {url.trim() && statuses[index] === 'invalid' && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                This URL does not return a valid image.
              </p>
            )}
            {url.trim() && statuses[index] === 'validating' && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Validating URL…
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
          {urls.filter(url => url.trim()).length} product URL(s) added{anyInvalid ? ' • some invalid' : ''}
        </div>
      )}
    </div>
  );
}