/**
 * ImagePreview -- Floating image preview popup for image URL cells.
 *
 * Appears when hovering a cell that contains an image URL.
 * Positioned near the cursor/cell, max 200x200px.
 * Shows loading spinner while the image loads and a broken-image
 * icon on error. Reads position and URL from the data table store.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useDataTableStore } from './useDataTableStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ImagePreview: React.FC = () => {
  const previewImageUrl = useDataTableStore((s) => s.previewImageUrl);
  const previewPosition = useDataTableStore((s) => s.previewPosition);

  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Reset status when URL changes
  useEffect(() => {
    if (previewImageUrl) {
      setStatus('loading');
    }
  }, [previewImageUrl]);

  const handleLoad = useCallback(() => setStatus('loaded'), []);
  const handleError = useCallback(() => setStatus('error'), []);

  if (!previewImageUrl || !previewPosition) return null;

  // Clamp position so the preview stays within the viewport
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 220 : 400;
  const maxY = typeof window !== 'undefined' ? window.innerHeight - 220 : 400;
  const x = Math.min(previewPosition.x, maxX);
  const y = Math.max(8, Math.min(previewPosition.y, maxY));

  return (
    <div
      className="fixed z-[9999] pointer-events-none animate-fade-in"
      style={{ left: x, top: y }}
      role="img"
      aria-label="Image preview"
    >
      <div className="w-[200px] h-[200px] rounded-lg border border-forge-border bg-forge-bg-secondary shadow-xl overflow-hidden flex items-center justify-center">
        {/* Loading state */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-forge-bg-secondary">
            <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-2 text-forge-text-muted/50">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
              <line x1="2" y1="2" x2="22" y2="22" className="text-status-error/60" />
            </svg>
            <span className="text-[10px]">Failed to load</span>
          </div>
        )}

        {/* Image */}
        <img
          src={previewImageUrl}
          alt="Preview"
          className={[
            'max-w-[200px] max-h-[200px] object-contain transition-opacity duration-150',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          onLoad={handleLoad}
          onError={handleError}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* URL label */}
      <div className="mt-1 px-1.5 py-0.5 rounded bg-forge-bg-tertiary/90 border border-forge-border/50 text-[9px] text-forge-text-secondary truncate max-w-[200px]">
        {previewImageUrl.split('/').pop()?.split('?')[0] ?? 'image'}
      </div>
    </div>
  );
};

export default ImagePreview;
