import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useStore } from '../../../store';
import TextPreview from './TextPreview';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import { sendRuntimeMessage, getActiveTab } from '../../../../utils/chrome-api';
import { generatePrefixedId } from '../../../../utils/id';
import { formatNumber } from '../../../../utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OutputFormat = 'markdown' | 'plaintext' | 'json';

export interface ExtractedText {
  id: string;
  url: string;
  title: string;
  author: string;
  date: string;
  body: string;
  wordCount: number;
  readingTime: number;
  language: string;
  extractedAt: number;
}

export type TextExtractionStatus = 'idle' | 'extracting' | 'completed' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function estimateReadingTime(wordCount: number): number {
  // Average reading speed: 200-250 words per minute
  return Math.ceil(wordCount / 225);
}

function convertToFormat(text: ExtractedText, format: OutputFormat): string {
  switch (format) {
    case 'markdown':
      return [
        `# ${text.title}`,
        '',
        text.author ? `**Author:** ${text.author}` : '',
        text.date ? `**Date:** ${text.date}` : '',
        text.language ? `**Language:** ${text.language}` : '',
        `**Word Count:** ${formatNumber(text.wordCount)}`,
        `**Reading Time:** ${text.readingTime} min`,
        '',
        '---',
        '',
        text.body,
      ]
        .filter(Boolean)
        .join('\n');

    case 'plaintext':
      return [
        text.title,
        '='.repeat(text.title.length),
        '',
        text.author ? `Author: ${text.author}` : '',
        text.date ? `Date: ${text.date}` : '',
        `Word Count: ${text.wordCount}`,
        `Reading Time: ${text.readingTime} min`,
        '',
        text.body,
      ]
        .filter(Boolean)
        .join('\n');

    case 'json':
      return JSON.stringify(
        {
          title: text.title,
          author: text.author || null,
          date: text.date || null,
          language: text.language || null,
          wordCount: text.wordCount,
          readingTimeMinutes: text.readingTime,
          url: text.url,
          extractedAt: new Date(text.extractedAt).toISOString(),
          body: text.body,
        },
        null,
        2,
      );

    default:
      return text.body;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TextExtractorView: React.FC = () => {
  const { error, setError } = useStore();

  // Mode
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');

  // Output config
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [typewriterEnabled, setTypewriterEnabled] = useState(false);

  // Extraction state
  const [status, setStatus] = useState<TextExtractionStatus>('idle');
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const abortRef = useRef(false);

  // Active text for preview
  const activeText = useMemo(
    () => extractedTexts.find((t) => t.id === activeTextId) ?? extractedTexts[0] ?? null,
    [extractedTexts, activeTextId],
  );

  // Formatted output
  const formattedOutput = useMemo(
    () => (activeText ? convertToFormat(activeText, outputFormat) : ''),
    [activeText, outputFormat],
  );

  // Extract from current page
  const handleExtractCurrent = useCallback(async () => {
    setError(null);
    setStatus('extracting');

    try {
      const tab = await getActiveTab();
      if (!tab?.id || !tab.url) {
        setError('No active tab found');
        setStatus('error');
        return;
      }

      const response = await sendRuntimeMessage<{
        title?: string;
        author?: string;
        date?: string;
        body?: string;
        language?: string;
        error?: string;
      }>({ type: 'EXTRACT_TEXT' });

      if (response?.error) {
        setError(response.error);
        setStatus('error');
        return;
      }

      const body = response?.body ?? '';
      const wordCount = body.split(/\s+/).filter(Boolean).length;

      const extracted: ExtractedText = {
        id: generatePrefixedId('txt'),
        url: tab.url,
        title: response?.title ?? tab.title ?? 'Untitled',
        author: response?.author ?? '',
        date: response?.date ?? '',
        body,
        wordCount,
        readingTime: estimateReadingTime(wordCount),
        language: response?.language ?? '',
        extractedAt: Date.now(),
      };

      setExtractedTexts([extracted]);
      setActiveTextId(extracted.id);
      setStatus('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
      setStatus('error');
    }
  }, [setError]);

  // Bulk extraction
  const handleBulkExtract = useCallback(async () => {
    const urls = bulkUrls
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      setError('Enter at least one URL');
      return;
    }

    setError(null);
    setStatus('extracting');
    setExtractedTexts([]);
    abortRef.current = false;

    const results: ExtractedText[] = [];

    for (const url of urls) {
      if (abortRef.current) break;

      try {
        const response = await sendRuntimeMessage<{
          title?: string;
          author?: string;
          date?: string;
          body?: string;
          language?: string;
        }>({
          type: 'EXTRACT_TEXT',
          url,
        });

        const body = response?.body ?? '';
        const wordCount = body.split(/\s+/).filter(Boolean).length;

        const extracted: ExtractedText = {
          id: generatePrefixedId('txt'),
          url,
          title: response?.title ?? 'Untitled',
          author: response?.author ?? '',
          date: response?.date ?? '',
          body,
          wordCount,
          readingTime: estimateReadingTime(wordCount),
          language: response?.language ?? '',
          extractedAt: Date.now(),
        };

        results.push(extracted);
        setExtractedTexts([...results]);

        if (!activeTextId && results.length === 1) {
          setActiveTextId(extracted.id);
        }
      } catch {
        // Continue with next URL on error
      }
    }

    setStatus('completed');
  }, [bulkUrls, activeTextId, setError]);

  // Stop bulk extraction
  const handleStop = useCallback(() => {
    abortRef.current = true;
    setStatus('completed');
  }, []);

  // Export current text
  const handleExport = useCallback(() => {
    if (!activeText) return;

    const formatted = convertToFormat(activeText, outputFormat);
    const mimeMap: Record<OutputFormat, string> = {
      markdown: 'text/markdown',
      plaintext: 'text/plain',
      json: 'application/json',
    };
    const extMap: Record<OutputFormat, string> = {
      markdown: '.md',
      plaintext: '.txt',
      json: '.json',
    };

    const blob = new Blob([formatted], { type: `${mimeMap[outputFormat]}; charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeText.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}${extMap[outputFormat]}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeText, outputFormat]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!formattedOutput) return;
    try {
      await navigator.clipboard.writeText(formattedOutput);
    } catch {
      // Silent fail
    }
  }, [formattedOutput]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-forge-text flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Text Extractor
        </h2>

        {/* Bulk mode toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-[10px] font-semibold text-forge-text-muted uppercase">Bulk</span>
          <div
            className={[
              'relative w-8 h-4.5 rounded-full transition-colors duration-200',
              isBulkMode ? 'bg-accent-primary' : 'bg-forge-border',
            ].join(' ')}
            onClick={() => setIsBulkMode(!isBulkMode)}
          >
            <div
              className={[
                'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200',
                isBulkMode ? 'translate-x-[14px]' : 'translate-x-0.5',
              ].join(' ')}
            />
          </div>
        </label>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent">
        <div className="flex flex-col gap-4">
          {/* Bulk URL input */}
          {isBulkMode && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
                URLs (one per line)
              </label>
              <textarea
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                placeholder={"https://example.com/article-1\nhttps://example.com/article-2"}
                disabled={status === 'extracting'}
                className="w-full h-28 px-3 py-2 rounded-lg bg-forge-bg-secondary border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors resize-none disabled:opacity-50 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent"
                spellCheck={false}
              />
            </div>
          )}

          {/* Output format selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
              Output Format
            </label>
            <div className="flex rounded-lg border border-forge-border overflow-hidden">
              {(['markdown', 'plaintext', 'json'] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setOutputFormat(fmt)}
                  className={[
                    'flex-1 py-2 text-xs font-semibold capitalize transition-all duration-200',
                    outputFormat === fmt
                      ? 'bg-accent-primary/15 text-accent-primary'
                      : 'bg-forge-bg-secondary text-forge-text-muted hover:text-forge-text-secondary hover:bg-forge-bg-tertiary/40',
                  ].join(' ')}
                >
                  {fmt === 'plaintext' ? 'Plain Text' : fmt === 'json' ? 'JSON' : 'Markdown'}
                </button>
              ))}
            </div>
          </div>

          {/* Typewriter toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={[
                'relative w-9 h-5 rounded-full transition-colors duration-200',
                typewriterEnabled ? 'bg-accent-primary' : 'bg-forge-border',
              ].join(' ')}
              onClick={() => setTypewriterEnabled(!typewriterEnabled)}
            >
              <div
                className={[
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                  typewriterEnabled ? 'translate-x-[18px]' : 'translate-x-0.5',
                ].join(' ')}
              />
            </div>
            <span className="text-xs font-medium text-forge-text-secondary group-hover:text-forge-text transition-colors">
              Typewriter animation
            </span>
          </label>

          {/* Extract button */}
          <div className="flex items-center gap-2">
            {status !== 'extracting' && (
              <Button
                variant="primary"
                onClick={isBulkMode ? handleBulkExtract : handleExtractCurrent}
                iconLeft={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                }
              >
                {isBulkMode ? 'Extract All' : 'Extract Current Page'}
              </Button>
            )}

            {status === 'extracting' && (
              <>
                <Button variant="primary" loading disabled>
                  Extracting...
                </Button>
                {isBulkMode && (
                  <Button variant="danger" size="sm" onClick={handleStop}>
                    Stop
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Bulk extraction tabs (when multiple results) */}
          {extractedTexts.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
              {extractedTexts.map((text, index) => (
                <button
                  key={text.id}
                  type="button"
                  onClick={() => setActiveTextId(text.id)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 shrink-0',
                    activeTextId === text.id
                      ? 'bg-accent-primary/15 text-accent-primary'
                      : 'text-forge-text-muted hover:text-forge-text-secondary hover:bg-forge-bg-tertiary/40',
                  ].join(' ')}
                >
                  {text.title.length > 25 ? text.title.slice(0, 25) + '...' : text.title || `Page ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Text preview */}
          {activeText && (
            <TextPreview
              text={activeText}
              formattedOutput={formattedOutput}
              outputFormat={outputFormat}
              typewriterEnabled={typewriterEnabled}
              onCopy={handleCopy}
              onExport={handleExport}
            />
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Empty state */}
          {status === 'idle' && extractedTexts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30">
              <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-primary" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-forge-text-secondary">Extract clean text</p>
                <p className="text-xs text-forge-text-muted mt-1">
                  Uses readability engine for article-quality text extraction
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextExtractorView;
