import React, { useState, useCallback, useRef, useEffect } from 'react';
import { formatFileSize } from '../../../../utils/format';
import type { DetectedImage } from './ImageDownloaderView';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageGridProps {
  images: DetectedImage[];
  onToggleSelect: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Format badge color
// ---------------------------------------------------------------------------

const FORMAT_COLORS: Record<string, string> = {
  jpg: 'bg-emerald-500/20 text-emerald-400',
  jpeg: 'bg-emerald-500/20 text-emerald-400',
  png: 'bg-teal-500/20 text-teal-400',
  gif: 'bg-amber-500/20 text-amber-400',
  webp: 'bg-violet-500/20 text-violet-400',
  svg: 'bg-rose-500/20 text-rose-400',
  avif: 'bg-cyan-500/20 text-cyan-400',
  ico: 'bg-slate-500/20 text-slate-400',
};

function getFormatColor(format: string): string {
  return FORMAT_COLORS[format.toLowerCase()] ?? 'bg-forge-bg-tertiary text-forge-text-muted';
}

// ---------------------------------------------------------------------------
// LazyImage - loads image when in viewport
// ---------------------------------------------------------------------------

const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = ({
  src,
  alt,
  className = '',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '100px' },
    );

    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {inView ? (
        <>
          {!loaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-forge-bg-tertiary/60">
              <div className="w-4 h-4 rounded-full border-2 border-accent-primary/30 border-t-accent-primary animate-spin" />
            </div>
          )}
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-forge-bg-tertiary/60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forge-text-muted" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              className={[
                'w-full h-full object-cover transition-opacity duration-300',
                loaded ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              loading="lazy"
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-forge-bg-tertiary/40" />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ImageCard
// ---------------------------------------------------------------------------

const ImageCard: React.FC<{
  image: DetectedImage;
  onToggleSelect: (id: string) => void;
}> = ({ image, onToggleSelect }) => {
  const handleClick = useCallback(() => {
    onToggleSelect(image.id);
  }, [image.id, onToggleSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'relative group rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60',
        image.selected
          ? 'border-accent-primary shadow-[0_0_12px_rgba(16,185,129,0.2)]'
          : 'border-forge-border/50 hover:border-forge-border',
      ].join(' ')}
      style={{ breakInside: 'avoid' }}
    >
      {/* Thumbnail */}
      <div className="relative bg-forge-bg-tertiary/40" style={{ aspectRatio: `${Math.max(image.width, 1)} / ${Math.max(image.height, 1)}`, maxHeight: 200, minHeight: 60 }}>
        <LazyImage
          src={image.src}
          alt={image.alt}
          className="w-full h-full"
        />

        {/* Selection overlay */}
        {image.selected && (
          <div className="absolute inset-0 bg-accent-primary/10 pointer-events-none" />
        )}

        {/* Checkmark */}
        <div
          className={[
            'absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200',
            image.selected
              ? 'bg-accent-primary scale-100 motion-safe:animate-[scaleIn_0.2s_ease-out]'
              : 'bg-forge-bg/70 backdrop-blur-sm border border-forge-border/50 opacity-0 group-hover:opacity-100',
          ].join(' ')}
        >
          {image.selected ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-forge-bg" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <div className="w-2 h-2 rounded-full bg-forge-text-muted/30" />
          )}
        </div>

        {/* Dimensions overlay */}
        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-forge-bg/80 backdrop-blur-sm text-[9px] font-mono text-forge-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          {image.width}&times;{image.height}
        </div>

        {/* File size overlay */}
        {image.fileSize > 0 && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-forge-bg/80 backdrop-blur-sm text-[9px] font-mono text-forge-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
            {formatFileSize(image.fileSize)}
          </div>
        )}

        {/* Format badge */}
        <div
          className={[
            'absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase',
            getFormatColor(image.format),
          ].join(' ')}
        >
          {image.format}
        </div>
      </div>
    </button>
  );
};

// ---------------------------------------------------------------------------
// ImageGrid - Masonry layout
// ---------------------------------------------------------------------------

const ImageGrid: React.FC<ImageGridProps> = ({ images, onToggleSelect }) => {
  return (
    <div
      className="columns-2 gap-2 space-y-2"
      style={{ columnFill: 'balance' }}
    >
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
};

export default React.memo(ImageGrid);
