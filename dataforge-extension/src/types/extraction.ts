export type ToolType = 'list-extractor' | 'page-extractor' | 'email-extractor' | 'image-downloader' | 'text-extractor' | 'templates';

export type ExtractionStatus = 'idle' | 'selecting' | 'configuring' | 'running' | 'paused' | 'completed' | 'error';

export type DataType = 'text' | 'number' | 'price' | 'url' | 'image' | 'email' | 'date' | 'rating' | 'phone' | 'location';

export type PatternCategory = 'product' | 'review' | 'listing' | 'article' | 'table-row' | 'card' | 'feed-item' | 'generic';

export type PaginationMode = 'auto-scroll' | 'click-next' | 'url-pattern' | 'load-more' | 'api-intercept' | 'manual-urls';

export interface DetectedPattern {
  id: string;
  selector: string;
  itemCount: number;
  sampleElements: string[];
  confidence: number;
  category: PatternCategory;
  fields: DetectedField[];
  boundingRect: { top: number; left: number; width: number; height: number };
  visualArea: number;
}

export interface DetectedField {
  id: string;
  name: string;
  relativeSelector: string;
  sampleValues: string[];
  dataType: DataType;
  confidence: number;
  enabled: boolean;
}

export interface ExtractionConfig {
  id: string;
  patternSelector: string;
  fields: DetectedField[];
  pagination: PaginationConfig;
  maxItems: number;
  maxPages: number;
  delayBetweenPages: number;
}

export interface PaginationConfig {
  mode: PaginationMode;
  selector?: string;
  urlPattern?: string;
  maxPages: number;
  delayMs: number;
  scrollTarget?: string;
  scrollSpeed?: 'slow' | 'medium' | 'fast';
  apiEndpoint?: string;
  apiPageParam?: string;
  manualUrls?: string[];
  confidence: number;
}

export interface Row {
  id: string;
  data: Record<string, string | number | null>;
  sourceUrl: string;
  extractedAt: number;
}

export interface ExtractionProgress {
  items: number;
  pages: number;
  elapsed: number;
  speed: number;
  errors: number;
  estimatedRemaining: number;
}

export interface ExtractionSummary {
  totalItems: number;
  totalPages: number;
  totalTime: number;
  avgSpeed: number;
  errors: number;
  dataSize: number;
}
