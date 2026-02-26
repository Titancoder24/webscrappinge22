import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '../../../store';
import ImageGrid from './ImageGrid';
import CategoryFilter from './CategoryFilter';
import DownloadProgress from './DownloadProgress';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import { sendRuntimeMessage, getActiveTab } from '../../../../utils/chrome-api';
import { generatePrefixedId } from '../../../../utils/id';
import { formatFileSize } from '../../../../utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImageCategory = 'all' | 'photos' | 'icons' | 'logos' | 'banners' | 'svg';

export interface DetectedImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
  category: ImageCategory;
  selected: boolean;
}

export type DownloadMode = 'zip' | 'individual';

export interface DownloadState {
  isDownloading: boolean;
  mode: DownloadMode;
  completed: number;
  total: number;
  currentFile: string;
  errors: string[];
  zipReady: boolean;
  zipUrl: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categorizeImage(img: { width: number; height: number; src: string; format: string }): ImageCategory {
  if (img.format === 'svg' || img.src.endsWith('.svg')) return 'svg';

  const ratio = img.width / Math.max(img.height, 1);

  // Icons: small and roughly square
  if (img.width <= 64 && img.height <= 64) return 'icons';

  // Logos: medium, wider than tall
  if (img.width <= 300 && img.height <= 100 && ratio > 1.5) return 'logos';

  // Banners: very wide
  if (ratio > 3 && img.width > 300) return 'banners';

  // Photos: everything else above a certain size
  if (img.width >= 200 && img.height >= 200) return 'photos';

  return 'photos';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ImageDownloaderView: React.FC = () => {
  const { error, setError } = useStore();

  // Detection state
  const [images, setImages] = useState<DetectedImage[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState<ImageCategory>('all');
  const [minWidth, setMinWidth] = useState(0);
  const [minHeight, setMinHeight] = useState(0);

  // Download state
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    mode: 'zip',
    completed: 0,
    total: 0,
    currentFile: '',
    errors: [],
    zipReady: false,
    zipUrl: null,
  });

  // Filename pattern
  const [filenamePattern, setFilenamePattern] = useState('{original}');

  // Scan page for images
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    setImages([]);

    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        setError('No active tab found');
        setIsScanning(false);
        return;
      }

      const response = await sendRuntimeMessage<{
        images?: Array<{
          src: string;
          alt: string;
          width: number;
          height: number;
          fileSize: number;
          format: string;
        }>;
        error?: string;
      }>({ type: 'EXTRACT_IMAGES' });

      if (response?.error) {
        setError(response.error);
        setIsScanning(false);
        return;
      }

      const detected: DetectedImage[] = (response?.images ?? []).map((img) => ({
        id: generatePrefixedId('img'),
        src: img.src,
        alt: img.alt || '',
        width: img.width || 0,
        height: img.height || 0,
        fileSize: img.fileSize || 0,
        format: img.format || 'unknown',
        category: categorizeImage(img),
        selected: false,
      }));

      setImages(detected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan page');
    } finally {
      setIsScanning(false);
    }
  }, [setError]);

  // Auto-scan on mount
  useEffect(() => {
    handleScan();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered images
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (activeCategory !== 'all' && img.category !== activeCategory) return false;
      if (img.width < minWidth) return false;
      if (img.height < minHeight) return false;
      return true;
    });
  }, [images, activeCategory, minWidth, minHeight]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ImageCategory, number> = {
      all: images.length,
      photos: 0,
      icons: 0,
      logos: 0,
      banners: 0,
      svg: 0,
    };

    for (const img of images) {
      if (img.category in counts && img.category !== 'all') {
        counts[img.category]++;
      }
    }

    return counts;
  }, [images]);

  // Selection
  const selectedImages = useMemo(
    () => filteredImages.filter((img) => img.selected),
    [filteredImages],
  );

  const handleToggleSelect = useCallback((id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, selected: !img.selected } : img)),
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const filteredIds = new Set(filteredImages.map((img) => img.id));
    const allSelected = filteredImages.every((img) => img.selected);

    setImages((prev) =>
      prev.map((img) =>
        filteredIds.has(img.id) ? { ...img, selected: !allSelected } : img,
      ),
    );
  }, [filteredImages]);

  const handleSelectByCategory = useCallback(
    (category: ImageCategory) => {
      setImages((prev) =>
        prev.map((img) =>
          img.category === category ? { ...img, selected: true } : img,
        ),
      );
    },
    [],
  );

  const handleDeselectAll = useCallback(() => {
    setImages((prev) => prev.map((img) => ({ ...img, selected: false })));
  }, []);

  // Download
  const handleDownload = useCallback(
    async (mode: DownloadMode) => {
      if (selectedImages.length === 0) return;

      setDownloadState({
        isDownloading: true,
        mode,
        completed: 0,
        total: selectedImages.length,
        currentFile: '',
        errors: [],
        zipReady: false,
        zipUrl: null,
      });

      try {
        const response = await sendRuntimeMessage<{
          zipUrl?: string;
          error?: string;
          errors?: string[];
        }>({
          type: 'DOWNLOAD_IMAGES',
          images: selectedImages.map((img) => ({
            src: img.src,
            filename: filenamePattern
              .replace('{original}', img.src.split('/').pop()?.split('?')[0] || 'image')
              .replace('{index}', String(selectedImages.indexOf(img) + 1))
              .replace('{width}', String(img.width))
              .replace('{height}', String(img.height)),
          })),
          mode,
        });

        setDownloadState((prev) => ({
          ...prev,
          isDownloading: false,
          completed: prev.total,
          zipReady: mode === 'zip' && !!response?.zipUrl,
          zipUrl: response?.zipUrl ?? null,
          errors: response?.errors ?? [],
        }));
      } catch (err) {
        setDownloadState((prev) => ({
          ...prev,
          isDownloading: false,
          errors: [...prev.errors, err instanceof Error ? err.message : 'Download failed'],
        }));
      }
    },
    [selectedImages, filenamePattern],
  );

  const totalSelectedSize = useMemo(
    () => selectedImages.reduce((sum, img) => sum + img.fileSize, 0),
    [selectedImages],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-forge-text flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Images
          {images.length > 0 && (
            <Badge variant="default">{images.length}</Badge>
          )}
        </h2>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleScan}
          loading={isScanning}
        >
          {isScanning ? 'Scanning' : 'Rescan'}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent">
        <div className="flex flex-col gap-3">
          {/* Category filter tabs */}
          {images.length > 0 && (
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              counts={categoryCounts}
            />
          )}

          {/* Size filter */}
          {images.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-forge-text-muted uppercase">Min W</label>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={minWidth}
                  onChange={(e) => setMinWidth(Number(e.target.value))}
                  className="w-16 h-1 rounded-full appearance-none bg-forge-border accent-accent-primary"
                />
                <span className="text-[10px] font-mono text-forge-text-muted w-8">{minWidth}px</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-forge-text-muted uppercase">Min H</label>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={minHeight}
                  onChange={(e) => setMinHeight(Number(e.target.value))}
                  className="w-16 h-1 rounded-full appearance-none bg-forge-border accent-accent-primary"
                />
                <span className="text-[10px] font-mono text-forge-text-muted w-8">{minHeight}px</span>
              </div>
            </div>
          )}

          {/* Selection actions bar */}
          {filteredImages.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="font-medium text-accent-primary hover:text-accent-tertiary transition-colors"
              >
                {filteredImages.every((img) => img.selected) ? 'Deselect all' : 'Select all'}
              </button>
              <span className="text-forge-text-muted">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="font-medium text-forge-text-muted hover:text-forge-text-secondary transition-colors"
              >
                None
              </button>
              {selectedImages.length > 0 && (
                <>
                  <span className="text-forge-text-muted">|</span>
                  <span className="text-forge-text-secondary font-medium">
                    {selectedImages.length} selected
                  </span>
                  {totalSelectedSize > 0 && (
                    <span className="text-forge-text-muted font-mono text-[10px]">
                      ({formatFileSize(totalSelectedSize)})
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Scanning state */}
          {isScanning && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-accent-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-primary animate-spin" />
                <div className="absolute inset-3 rounded-full bg-accent-primary/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-primary" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-forge-text-secondary">Detecting images...</p>
            </div>
          )}

          {/* Empty state */}
          {!isScanning && images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-forge-bg-tertiary flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-forge-text-muted" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-sm font-medium text-forge-text-secondary">No images found</p>
              <p className="text-xs text-forge-text-muted text-center max-w-[200px]">
                Navigate to a page with images and click Rescan
              </p>
            </div>
          )}

          {/* Image grid */}
          {!isScanning && filteredImages.length > 0 && (
            <ImageGrid
              images={filteredImages}
              onToggleSelect={handleToggleSelect}
            />
          )}

          {/* Filename pattern */}
          {selectedImages.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
                Filename Pattern
              </label>
              <input
                type="text"
                value={filenamePattern}
                onChange={(e) => setFilenamePattern(e.target.value)}
                placeholder="{original}"
                className="h-8 px-3 rounded-lg bg-forge-bg-secondary border border-forge-border text-xs text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
              <p className="text-[9px] text-forge-text-muted">
                Variables: {'{original}'}, {'{index}'}, {'{width}'}, {'{height}'}
              </p>
            </div>
          )}

          {/* Download buttons */}
          {selectedImages.length > 0 && !downloadState.isDownloading && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownload('zip')}
                iconLeft={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                }
              >
                Download ZIP ({selectedImages.length})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload('individual')}
              >
                Individual
              </Button>
            </div>
          )}

          {/* Download progress */}
          {(downloadState.isDownloading || downloadState.zipReady) && (
            <DownloadProgress state={downloadState} />
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageDownloaderView;
