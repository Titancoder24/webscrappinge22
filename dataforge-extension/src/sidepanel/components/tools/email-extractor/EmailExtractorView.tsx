import React, { useState, useCallback, useRef } from 'react';
import { useStore } from '../../../store';
import CrawlConfig from './CrawlConfig';
import EmailResults from './EmailResults';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import { sendRuntimeMessage, getActiveTab } from '../../../../utils/chrome-api';
import { generatePrefixedId } from '../../../../utils/id';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InputMode = 'single' | 'list' | 'crawl';

export interface CrawlSettings {
  depth: number;
  maxPages: number;
  respectRobots: boolean;
  internalOnly: boolean;
  delayMs: number;
}

export interface EmailEntry {
  id: string;
  email: string;
  sourceUrl: string;
  pageTitle: string;
  foundAt: number;
}

export type CrawlStatus = 'idle' | 'crawling' | 'paused' | 'completed' | 'error';

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

const DEFAULT_CRAWL: CrawlSettings = {
  depth: 2,
  maxPages: 50,
  respectRobots: true,
  internalOnly: true,
  delayMs: 1000,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EmailExtractorView: React.FC = () => {
  const { error, setError } = useStore();

  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('single');
  const [singleUrl, setSingleUrl] = useState('');
  const [urlList, setUrlList] = useState('');

  // Crawl config
  const [crawlSettings, setCrawlSettings] = useState<CrawlSettings>(DEFAULT_CRAWL);

  // Extraction state
  const [status, setStatus] = useState<CrawlStatus>('idle');
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [crawledPages, setCrawledPages] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const abortRef = useRef(false);

  // Get current tab URL
  const handleUseCurrentUrl = useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.url) {
        setSingleUrl(tab.url);
      }
    } catch {
      setError('Could not get current tab URL');
    }
  }, [setError]);

  // Start extraction
  const handleStartExtraction = useCallback(async () => {
    setError(null);
    setEmails([]);
    setCrawledPages(0);
    setStatus('crawling');
    abortRef.current = false;

    let targetUrls: string[] = [];

    if (inputMode === 'single') {
      if (!singleUrl.trim()) {
        setError('Please enter a URL');
        setStatus('idle');
        return;
      }
      targetUrls = [singleUrl.trim()];
    } else if (inputMode === 'list') {
      targetUrls = urlList
        .split(/[\n\r]+/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (targetUrls.length === 0) {
        setError('Please enter at least one URL');
        setStatus('idle');
        return;
      }
    } else {
      // Crawl mode - single URL as seed
      if (!singleUrl.trim()) {
        setError('Please enter a seed URL for crawling');
        setStatus('idle');
        return;
      }
      targetUrls = [singleUrl.trim()];
    }

    setTotalPages(inputMode === 'crawl' ? crawlSettings.maxPages : targetUrls.length);

    try {
      // Set up message listener for streaming results
      const removeListener = chrome.runtime.onMessage.addListener(
        (message: { type: string; email?: EmailEntry; progress?: { crawled: number; total: number } }) => {
          if (message.type === 'EMAIL_FOUND' && message.email) {
            setEmails((prev) => {
              // Deduplicate
              if (prev.some((e) => e.email === message.email!.email)) return prev;
              return [...prev, { ...message.email!, id: generatePrefixedId('eml'), foundAt: Date.now() }];
            });
          }
          if (message.type === 'CRAWL_PROGRESS' && message.progress) {
            setCrawledPages(message.progress.crawled);
            setTotalPages(message.progress.total);
          }
        },
      );

      await sendRuntimeMessage({
        type: 'EXTRACT_EMAILS',
        urls: targetUrls,
        mode: inputMode,
        crawlSettings: inputMode === 'crawl' ? crawlSettings : undefined,
      });

      chrome.runtime.onMessage.removeListener(removeListener);
      setStatus('completed');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Extraction failed');
    }
  }, [inputMode, singleUrl, urlList, crawlSettings, setError]);

  // Stop extraction
  const handleStop = useCallback(() => {
    abortRef.current = true;
    sendRuntimeMessage({ type: 'STOP_EXTRACTION' }).catch(() => {});
    setStatus('completed');
  }, []);

  // Pause/resume
  const handleTogglePause = useCallback(() => {
    if (status === 'crawling') {
      setStatus('paused');
      sendRuntimeMessage({ type: 'PAUSE_EXTRACTION' }).catch(() => {});
    } else if (status === 'paused') {
      setStatus('crawling');
      sendRuntimeMessage({ type: 'RESUME_EXTRACTION' }).catch(() => {});
    }
  }, [status]);

  const isBusy = status === 'crawling' || status === 'paused';
  const progressPct = totalPages > 0 ? Math.round((crawledPages / totalPages) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-sm font-bold text-forge-text flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Email Extractor
          {emails.length > 0 && (
            <Badge variant="success">{emails.length} found</Badge>
          )}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent">
        <div className="flex flex-col gap-4">
          {/* Input mode selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
              Source
            </label>
            <div className="flex rounded-lg border border-forge-border overflow-hidden">
              {(['single', 'list', 'crawl'] as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInputMode(mode)}
                  disabled={isBusy}
                  className={[
                    'flex-1 py-2 text-xs font-semibold capitalize transition-all duration-200',
                    inputMode === mode
                      ? 'bg-accent-primary/15 text-accent-primary'
                      : 'bg-forge-bg-secondary text-forge-text-muted hover:text-forge-text-secondary hover:bg-forge-bg-tertiary/40',
                  ].join(' ')}
                >
                  {mode === 'single' ? 'Single URL' : mode === 'list' ? 'URL List' : 'Domain Crawl'}
                </button>
              ))}
            </div>
          </div>

          {/* URL input */}
          {inputMode === 'single' || inputMode === 'crawl' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
                {inputMode === 'crawl' ? 'Seed URL' : 'Target URL'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isBusy}
                  className="flex-1 h-9 px-3 rounded-lg bg-forge-bg-secondary border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors disabled:opacity-50"
                />
                <Button variant="ghost" size="sm" onClick={handleUseCurrentUrl} disabled={isBusy}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
                URLs (one per line)
              </label>
              <textarea
                value={urlList}
                onChange={(e) => setUrlList(e.target.value)}
                placeholder={"https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3"}
                disabled={isBusy}
                className="w-full h-32 px-3 py-2 rounded-lg bg-forge-bg-secondary border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors resize-none disabled:opacity-50 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent"
                spellCheck={false}
              />
            </div>
          )}

          {/* Crawl config (only in crawl mode) */}
          {inputMode === 'crawl' && (
            <CrawlConfig
              settings={crawlSettings}
              onChange={setCrawlSettings}
              disabled={isBusy}
            />
          )}

          {/* Robots.txt toggle (always shown) */}
          {inputMode !== 'crawl' && (
            <label className="flex items-center gap-3 py-2 cursor-pointer group">
              <div
                className={[
                  'relative w-9 h-5 rounded-full transition-colors duration-200',
                  crawlSettings.respectRobots ? 'bg-accent-primary' : 'bg-forge-border',
                ].join(' ')}
                onClick={() =>
                  setCrawlSettings((prev) => ({ ...prev, respectRobots: !prev.respectRobots }))
                }
              >
                <div
                  className={[
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                    crawlSettings.respectRobots ? 'translate-x-[18px]' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </div>
              <div>
                <span className="text-xs font-medium text-forge-text-secondary group-hover:text-forge-text transition-colors">
                  Respect robots.txt
                </span>
              </div>
            </label>
          )}

          {/* Progress bar during extraction */}
          {isBusy && (
            <div className="flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-accent-primary">
                  {status === 'paused' ? 'Paused' : 'Crawling...'}
                </span>
                <span className="font-mono text-forge-text-muted">
                  {crawledPages}/{totalPages} pages
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-forge-bg-tertiary overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, #10B981, #14B8A6)',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                  }}
                />
                {status === 'crawling' && (
                  <div
                    className="absolute inset-y-0 w-16 animate-scanner"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isBusy && status !== 'completed' && (
              <Button
                variant="primary"
                onClick={handleStartExtraction}
                iconLeft={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
              >
                Extract Emails
              </Button>
            )}

            {isBusy && (
              <>
                <Button variant="secondary" size="sm" onClick={handleTogglePause}>
                  {status === 'paused' ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="danger" size="sm" onClick={handleStop}>
                  Stop
                </Button>
              </>
            )}

            {status === 'completed' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatus('idle');
                  setEmails([]);
                  setCrawledPages(0);
                }}
              >
                New Extraction
              </Button>
            )}
          </div>

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

          {/* Results */}
          {emails.length > 0 && (
            <EmailResults emails={emails} />
          )}

          {/* Empty state after completed with no results */}
          {status === 'completed' && emails.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-forge-bg-tertiary flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-forge-text-muted" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-forge-text-secondary">No emails found</p>
              <p className="text-xs text-forge-text-muted text-center max-w-[200px]">
                Try a different URL or increase crawl depth
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailExtractorView;
