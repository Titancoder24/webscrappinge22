import type { DetectedPattern, ExtractionConfig, ExtractionProgress, ExtractionSummary, PaginationConfig, Row } from './extraction';

export type Message =
  | { type: 'SCAN_PAGE' }
  | { type: 'SCAN_RESULT'; patterns: DetectedPattern[] }
  | { type: 'SELECT_PATTERN'; patternId: string }
  | { type: 'SELECTION_CONFIRMED'; patternId: string; selector: string }
  | { type: 'START_EXTRACTION'; config: ExtractionConfig }
  | { type: 'EXTRACTION_PROGRESS'; data: ExtractionProgress }
  | { type: 'EXTRACTION_ROW'; row: Row }
  | { type: 'EXTRACTION_BATCH'; rows: Row[] }
  | { type: 'EXTRACTION_COMPLETE'; summary: ExtractionSummary }
  | { type: 'EXTRACTION_ERROR'; error: string; url?: string }
  | { type: 'PAUSE_EXTRACTION' }
  | { type: 'RESUME_EXTRACTION' }
  | { type: 'STOP_EXTRACTION' }
  | { type: 'HIGHLIGHT_ELEMENTS'; selector: string }
  | { type: 'CLEAR_HIGHLIGHTS' }
  | { type: 'TEST_SELECTOR'; selector: string }
  | { type: 'SELECTOR_TEST_RESULT'; matchCount: number; sampleValues: string[] }
  | { type: 'ACTIVATE_SELECTION_MODE'; tool: string }
  | { type: 'DEACTIVATE_SELECTION_MODE' }
  | { type: 'ELEMENT_CLICKED'; selector: string; patternId: string }
  | { type: 'DETECT_PAGINATION' }
  | { type: 'PAGINATION_RESULT'; configs: PaginationConfig[] }
  | { type: 'NAVIGATE_URL'; url: string }
  | { type: 'SCHEDULE_EXTRACTION'; config: ExtractionConfig; interval: number }
  | { type: 'WEBHOOK_PUSH'; data: Row[]; url: string; headers: Record<string, string> }
  | { type: 'EXTRACT_EMAILS'; url: string; depth: number }
  | { type: 'EXTRACT_IMAGES' }
  | { type: 'EXTRACT_TEXT' }
  | { type: 'PING' }
  | { type: 'PONG' };

export function sendMessage(message: Message): Promise<Message> {
  return chrome.runtime.sendMessage(message);
}

export function sendTabMessage(tabId: number, message: Message): Promise<Message> {
  return chrome.tabs.sendMessage(tabId, message);
}
