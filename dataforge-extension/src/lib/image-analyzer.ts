/**
 * ImageAnalyzer – Image detection and categorization for DataForge.
 *
 * Detects all images on a page from multiple sources:
 *  - <img> elements
 *  - CSS background-image properties
 *  - <picture> / <source> elements
 *  - Lazy-loaded images (data-src, data-lazy, etc.)
 *  - Inline SVGs
 *  - OpenGraph and Twitter Card meta images
 *
 * Categorizes images by size, type, and format, and extracts metadata
 * including alt text, dimensions, title, and estimated file size.
 *
 * Zero dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Size category based on pixel dimensions. */
export type ImageSizeCategory = 'thumbnail' | 'medium' | 'large' | 'full';

/** Semantic type based on heuristic analysis. */
export type ImageTypeCategory = 'photo' | 'icon' | 'logo' | 'banner' | 'avatar' | 'background' | 'decorative' | 'unknown';

/** Detected image format. */
export type ImageFormat = 'jpeg' | 'png' | 'gif' | 'webp' | 'avif' | 'svg' | 'bmp' | 'ico' | 'tiff' | 'unknown';

/** Source origin of the detected image. */
export type ImageSource = 'img' | 'css-background' | 'picture' | 'lazy-load' | 'svg-inline' | 'og-meta' | 'twitter-meta';

/** Complete information about a detected image. */
export interface ImageInfo {
  /** Resolved absolute URL of the image. */
  url: string;
  /** Source type where the image was found. */
  source: ImageSource;
  /** Size category based on dimensions. */
  sizeCategory: ImageSizeCategory;
  /** Semantic type category. */
  typeCategory: ImageTypeCategory;
  /** Detected format from URL or content-type. */
  format: ImageFormat;
  /** Alt text if available. */
  alt: string;
  /** Title attribute if available. */
  title: string;
  /** Natural width in pixels (0 if unknown). */
  width: number;
  /** Natural height in pixels (0 if unknown). */
  height: number;
  /** Estimated file size in bytes (0 if unknown). */
  estimatedSize: number;
  /** Whether the image is currently in the viewport. */
  inViewport: boolean;
  /** The DOM element this image belongs to, if applicable. */
  element: Element | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Lazy-load attribute names commonly used by frameworks and plugins. */
const LAZY_ATTRS = [
  'data-src', 'data-lazy-src', 'data-original', 'data-srcset',
  'data-lazy', 'data-bg', 'data-background', 'data-image',
  'data-full-src', 'data-hi-res-src', 'loading-src',
];

/** Size thresholds for categorization (in pixels, using max dimension). */
const SIZE_THRESHOLDS = {
  thumbnail: 150,
  medium: 500,
  large: 1200,
  // Anything above 1200 is "full"
};

/** Filename patterns that indicate icon usage. */
const ICON_PATTERNS = /(?:favicon|icon|sprite|logo-small|ico-|icn-)/i;
/** Filename patterns that indicate logo usage. */
const LOGO_PATTERNS = /(?:logo|brand|masthead)/i;
/** Filename patterns that indicate banner usage. */
const BANNER_PATTERNS = /(?:banner|hero|jumbotron|cover|header-image|featured)/i;
/** Filename patterns that indicate avatar usage. */
const AVATAR_PATTERNS = /(?:avatar|profile|user-pic|gravatar|headshot)/i;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a potentially relative URL against the document's base URL.
 */
function resolveImageUrl(url: string, doc: Document): string {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  try {
    return new URL(url, doc.baseURI).href;
  } catch {
    return url;
  }
}

/**
 * Detect image format from URL path.
 */
function detectFormat(url: string): ImageFormat {
  if (!url) return 'unknown';
  if (url.startsWith('data:image/svg') || url.endsWith('.svg')) return 'svg';
  if (url.startsWith('data:image/png')) return 'png';
  if (url.startsWith('data:image/gif')) return 'gif';
  if (url.startsWith('data:image/webp')) return 'webp';
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) return 'jpeg';
  if (url.startsWith('data:image/avif')) return 'avif';

  // Extract file extension from URL path, ignoring query params
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'jpeg';
    if (pathname.endsWith('.png')) return 'png';
    if (pathname.endsWith('.gif')) return 'gif';
    if (pathname.endsWith('.webp')) return 'webp';
    if (pathname.endsWith('.avif')) return 'avif';
    if (pathname.endsWith('.svg')) return 'svg';
    if (pathname.endsWith('.bmp')) return 'bmp';
    if (pathname.endsWith('.ico')) return 'ico';
    if (pathname.endsWith('.tiff') || pathname.endsWith('.tif')) return 'tiff';
  } catch {
    // Not a valid URL – try simple extension matching
    const lower = url.toLowerCase();
    if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'jpeg';
    if (lower.includes('.png')) return 'png';
    if (lower.includes('.webp')) return 'webp';
  }

  return 'unknown';
}

/**
 * Categorize size based on dimensions.
 */
function categorizeSizeFromDimensions(width: number, height: number): ImageSizeCategory {
  const maxDim = Math.max(width, height);
  if (maxDim === 0) return 'unknown' as ImageSizeCategory;
  if (maxDim <= SIZE_THRESHOLDS.thumbnail) return 'thumbnail';
  if (maxDim <= SIZE_THRESHOLDS.medium) return 'medium';
  if (maxDim <= SIZE_THRESHOLDS.large) return 'large';
  return 'full';
}

/**
 * Detect the semantic type of an image from URL, element attributes, and context.
 */
function categorizeType(
  url: string,
  element: Element | null,
  width: number,
  height: number,
): ImageTypeCategory {
  const urlLower = url.toLowerCase();

  // Check URL patterns first
  if (ICON_PATTERNS.test(urlLower)) return 'icon';
  if (LOGO_PATTERNS.test(urlLower)) return 'logo';
  if (BANNER_PATTERNS.test(urlLower)) return 'banner';
  if (AVATAR_PATTERNS.test(urlLower)) return 'avatar';

  // Check element attributes
  if (element) {
    const ident = (
      (element.id || '') + ' ' +
      (typeof element.className === 'string' ? element.className : '') + ' ' +
      (element.getAttribute('alt') || '') + ' ' +
      (element.getAttribute('role') || '')
    ).toLowerCase();

    if (ident.includes('logo') || ident.includes('brand')) return 'logo';
    if (ident.includes('icon') || ident.includes('sprite')) return 'icon';
    if (ident.includes('banner') || ident.includes('hero')) return 'banner';
    if (ident.includes('avatar') || ident.includes('profile')) return 'avatar';

    // Check if it's a decorative image
    const role = element.getAttribute('role');
    if (role === 'presentation' || role === 'none') return 'decorative';
    if (element.getAttribute('alt') === '' && element.getAttribute('aria-hidden') === 'true') {
      return 'decorative';
    }

    // Check parent element for context
    const parent = element.parentElement;
    if (parent) {
      const parentIdent = (
        (parent.id || '') + ' ' +
        (typeof parent.className === 'string' ? parent.className : '')
      ).toLowerCase();
      if (parentIdent.includes('logo')) return 'logo';
      if (parentIdent.includes('avatar') || parentIdent.includes('author')) return 'avatar';
    }
  }

  // Size-based heuristics
  if (width > 0 && height > 0) {
    const area = width * height;
    const ratio = width / height;

    // Icons are typically small and squarish
    if (area < 2500 && ratio > 0.7 && ratio < 1.3) return 'icon';
    // Banners are wide
    if (ratio > 3 && width > 400) return 'banner';
    // Avatars are typically small squares
    if (area < 40000 && ratio > 0.8 && ratio < 1.2 && width < 200) return 'avatar';
  }

  // Default: assume photo
  return 'photo';
}

/**
 * Estimate image file size based on dimensions and format.
 * This is a rough heuristic when actual size is unknown.
 */
function estimateFileSize(width: number, height: number, format: ImageFormat): number {
  if (width === 0 || height === 0) return 0;
  const pixels = width * height;

  // Rough compression ratios by format (bytes per pixel)
  const bytesPerPixel: Record<ImageFormat, number> = {
    jpeg: 0.3,
    png: 1.0,
    gif: 0.5,
    webp: 0.2,
    avif: 0.15,
    svg: 0, // SVGs are not pixel-based
    bmp: 3.0,
    ico: 1.0,
    tiff: 2.5,
    unknown: 0.5,
  };

  return Math.round(pixels * (bytesPerPixel[format] || 0.5));
}

/**
 * Check if an element's bounding rect is within the viewport.
 */
function isInViewport(el: Element): boolean {
  try {
    const rect = el.getBoundingClientRect();
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    const viewW = window.innerWidth || document.documentElement.clientWidth;
    return rect.top < viewH && rect.bottom > 0 && rect.left < viewW && rect.right > 0;
  } catch {
    return false;
  }
}

/**
 * Extract URL from a CSS background-image value.
 * Handles: url("..."), url('...'), url(...)
 */
function extractBgUrl(value: string): string | null {
  const match = value.match(/url\(\s*["']?\s*([^"')]+?)\s*["']?\s*\)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

/**
 * Detect images from <img> elements.
 */
function detectImgElements(doc: Document, results: Map<string, ImageInfo>): void {
  const imgs = doc.querySelectorAll('img');
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i] as HTMLImageElement;
    const src = img.currentSrc || img.src;
    if (!src) continue;

    const url = resolveImageUrl(src, doc);
    if (!url || url === 'about:blank') continue;
    if (results.has(url)) continue;

    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    const format = detectFormat(url);

    results.set(url, {
      url,
      source: 'img',
      sizeCategory: categorizeSizeFromDimensions(width, height),
      typeCategory: categorizeType(url, img, width, height),
      format,
      alt: img.alt || '',
      title: img.title || '',
      width,
      height,
      estimatedSize: estimateFileSize(width, height, format),
      inViewport: isInViewport(img),
      element: img,
    });
  }
}

/**
 * Detect images from CSS background-image properties.
 */
function detectCssBackgrounds(doc: Document, results: Map<string, ImageInfo>): void {
  // Only check elements that are likely to have background images
  const candidates = doc.querySelectorAll(
    'div, section, header, footer, aside, span, a, li, td, th, figure',
  );

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i];
    let bgImage: string;
    try {
      const style = getComputedStyle(el);
      bgImage = style.backgroundImage;
    } catch {
      continue;
    }

    if (!bgImage || bgImage === 'none') continue;

    const bgUrl = extractBgUrl(bgImage);
    if (!bgUrl) continue;

    const url = resolveImageUrl(bgUrl, doc);
    if (!url || results.has(url)) continue;

    const format = detectFormat(url);
    let width = 0;
    let height = 0;
    try {
      const rect = el.getBoundingClientRect();
      width = Math.round(rect.width);
      height = Math.round(rect.height);
    } catch {
      // skip
    }

    results.set(url, {
      url,
      source: 'css-background',
      sizeCategory: categorizeSizeFromDimensions(width, height),
      typeCategory: 'background',
      format,
      alt: '',
      title: el.getAttribute('title') || '',
      width,
      height,
      estimatedSize: estimateFileSize(width, height, format),
      inViewport: isInViewport(el),
      element: el,
    });
  }
}

/**
 * Detect images from <picture> and <source> elements.
 */
function detectPictureElements(doc: Document, results: Map<string, ImageInfo>): void {
  const pictures = doc.querySelectorAll('picture');
  for (let i = 0; i < pictures.length; i++) {
    const picture = pictures[i];
    const sources = picture.querySelectorAll('source');

    for (let j = 0; j < sources.length; j++) {
      const source = sources[j] as HTMLSourceElement;
      const srcset = source.srcset;
      if (!srcset) continue;

      // Parse srcset – take the first URL
      const firstUrl = srcset.split(',')[0].trim().split(/\s+/)[0];
      if (!firstUrl) continue;

      const url = resolveImageUrl(firstUrl, doc);
      if (!url || results.has(url)) continue;

      const format = detectFormat(url);
      // Try to get dimensions from the <img> inside the picture
      const img = picture.querySelector('img') as HTMLImageElement | null;
      const width = img?.naturalWidth || img?.width || 0;
      const height = img?.naturalHeight || img?.height || 0;

      results.set(url, {
        url,
        source: 'picture',
        sizeCategory: categorizeSizeFromDimensions(width, height),
        typeCategory: categorizeType(url, picture, width, height),
        format,
        alt: img?.alt || '',
        title: img?.title || '',
        width,
        height,
        estimatedSize: estimateFileSize(width, height, format),
        inViewport: isInViewport(picture),
        element: picture,
      });
    }
  }
}

/**
 * Detect lazy-loaded images from data attributes.
 */
function detectLazyImages(doc: Document, results: Map<string, ImageInfo>): void {
  // Build a selector from all lazy-load attributes
  const selectorParts = LAZY_ATTRS.map((attr) => `[${attr}]`);
  const selector = selectorParts.join(',');

  let elements: NodeListOf<Element>;
  try {
    elements = doc.querySelectorAll(selector);
  } catch {
    return;
  }

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];

    for (const attr of LAZY_ATTRS) {
      const value = el.getAttribute(attr);
      if (!value) continue;

      // Skip data: URLs that are placeholders
      if (value.startsWith('data:image/svg') && value.length < 200) continue;
      if (value.startsWith('data:image/gif;base64,R0lGOD')) continue;

      const url = resolveImageUrl(value, doc);
      if (!url || results.has(url)) continue;

      const format = detectFormat(url);
      const img = el as HTMLImageElement;
      const width = img.naturalWidth || img.width || parseInt(el.getAttribute('width') || '0', 10) || 0;
      const height = img.naturalHeight || img.height || parseInt(el.getAttribute('height') || '0', 10) || 0;

      results.set(url, {
        url,
        source: 'lazy-load',
        sizeCategory: categorizeSizeFromDimensions(width, height),
        typeCategory: categorizeType(url, el, width, height),
        format,
        alt: el.getAttribute('alt') || '',
        title: el.getAttribute('title') || '',
        width,
        height,
        estimatedSize: estimateFileSize(width, height, format),
        inViewport: isInViewport(el),
        element: el,
      });
    }
  }
}

/**
 * Detect inline SVG elements.
 */
function detectInlineSvgs(doc: Document, results: Map<string, ImageInfo>): void {
  const svgs = doc.querySelectorAll('svg');
  for (let i = 0; i < svgs.length; i++) {
    const svg = svgs[i];

    // Skip tiny/icon SVGs (likely decorative)
    let width = 0;
    let height = 0;
    try {
      const rect = svg.getBoundingClientRect();
      width = Math.round(rect.width);
      height = Math.round(rect.height);
    } catch {
      continue;
    }

    // Skip very small SVGs (likely icons/sprites)
    if (width < 20 && height < 20) continue;

    // Generate a data URL for the SVG
    const serializer = new XMLSerializer();
    let svgString: string;
    try {
      svgString = serializer.serializeToString(svg);
    } catch {
      continue;
    }

    const url = 'data:image/svg+xml,' + encodeURIComponent(svgString).slice(0, 100) + '...';
    // Use a hash of the SVG content as a dedup key
    const key = 'inline-svg-' + i + '-' + svgString.length;

    if (results.has(key)) continue;

    results.set(key, {
      url: 'data:image/svg+xml,' + encodeURIComponent(svgString),
      source: 'svg-inline',
      sizeCategory: categorizeSizeFromDimensions(width, height),
      typeCategory: categorizeType('', svg, width, height),
      format: 'svg',
      alt: svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || '',
      title: svg.getAttribute('title') || '',
      width,
      height,
      estimatedSize: new Blob([svgString]).size,
      inViewport: isInViewport(svg),
      element: svg,
    });
  }
}

/**
 * Detect OpenGraph and Twitter Card meta images.
 */
function detectMetaImages(doc: Document, results: Map<string, ImageInfo>): void {
  const ogMetas = [
    { selector: 'meta[property="og:image"]', source: 'og-meta' as ImageSource },
    { selector: 'meta[property="og:image:url"]', source: 'og-meta' as ImageSource },
    { selector: 'meta[name="twitter:image"]', source: 'twitter-meta' as ImageSource },
    { selector: 'meta[name="twitter:image:src"]', source: 'twitter-meta' as ImageSource },
  ];

  for (const { selector, source } of ogMetas) {
    try {
      const el = doc.querySelector(selector);
      if (!el) continue;

      const content = el.getAttribute('content');
      if (!content) continue;

      const url = resolveImageUrl(content, doc);
      if (!url || results.has(url)) continue;

      const format = detectFormat(url);

      // Try to get width/height from companion meta tags
      let width = 0;
      let height = 0;
      if (source === 'og-meta') {
        const widthMeta = doc.querySelector('meta[property="og:image:width"]');
        const heightMeta = doc.querySelector('meta[property="og:image:height"]');
        width = parseInt(widthMeta?.getAttribute('content') || '0', 10) || 0;
        height = parseInt(heightMeta?.getAttribute('content') || '0', 10) || 0;
      }

      results.set(url, {
        url,
        source,
        sizeCategory: width > 0 && height > 0
          ? categorizeSizeFromDimensions(width, height)
          : 'large', // OG images are typically large
        typeCategory: 'photo',
        format,
        alt: '',
        title: '',
        width,
        height,
        estimatedSize: estimateFileSize(width, height, format),
        inViewport: false,
        element: null,
      });
    } catch {
      // skip
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze all images in a document.
 *
 * Detects images from multiple sources (img tags, CSS backgrounds, picture
 * elements, lazy-loaded images, inline SVGs, and meta tags), categorizes
 * them by size and type, and extracts metadata.
 *
 * @param doc - The Document to analyze
 * @returns Array of ImageInfo objects, sorted by estimated size (largest first)
 */
export function analyzeImages(doc: Document): ImageInfo[] {
  if (!doc || !doc.documentElement) {
    return [];
  }

  const results = new Map<string, ImageInfo>();

  // Run all detectors, each deduplicates via the shared Map
  detectImgElements(doc, results);
  detectPictureElements(doc, results);
  detectLazyImages(doc, results);
  detectCssBackgrounds(doc, results);
  detectInlineSvgs(doc, results);
  detectMetaImages(doc, results);

  // Convert to array and sort by estimated size (largest first)
  const images = Array.from(results.values());
  images.sort((a, b) => b.estimatedSize - a.estimatedSize);

  return images;
}
