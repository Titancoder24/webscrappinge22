import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../../store';
import URLInput from './URLInput';
import FieldSelector from './FieldSelector';
import BulkProgress from './BulkProgress';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import { sendRuntimeMessage, getActiveTab } from '../../../../utils/chrome-api';
import { generatePrefixedId } from '../../../../utils/id';
import type { DetectedField } from '../../../../types/extraction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageExtractorStep = 0 | 1 | 2;

export interface RateLimitConfig {
  delayMs: number;
  concurrentTabs: number;
}

export type BulkURLStatus = 'pending' | 'processing' | 'success' | 'partial' | 'failed';

export interface BulkURLEntry {
  id: string;
  url: string;
  status: BulkURLStatus;
  rowCount: number;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

// ---------------------------------------------------------------------------
// Step labels
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<PageExtractorStep, string> = {
  0: 'URLs',
  1: 'Template',
  2: 'Extract',
};

const STEP_DESCRIPTIONS: Record<PageExtractorStep, string> = {
  0: 'Add the URLs you want to extract data from',
  1: 'Configure which fields to extract from each page',
  2: 'Run bulk extraction across all URLs',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PageExtractorView: React.FC = () => {
  const { error, setError } = useStore();

  // Step navigation
  const [step, setStep] = useState<PageExtractorStep>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<PageExtractorStep>>(new Set());

  // Step 0: URLs
  const [urls, setUrls] = useState<string[]>([]);
  const previousExtractions = useStore((s) => s.history);

  // Step 1: Fields / template config
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [sampleUrl, setSampleUrl] = useState<string>('');

  // Step 2: Bulk extraction config
  const [rateLimit, setRateLimit] = useState<RateLimitConfig>({
    delayMs: 1000,
    concurrentTabs: 2,
  });
  const [bulkEntries, setBulkEntries] = useState<BulkURLEntry[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const abortRef = useRef(false);

  // Initialize sample URL from URLs list
  useEffect(() => {
    if (urls.length > 0 && !sampleUrl) {
      setSampleUrl(urls[0]);
    }
  }, [urls, sampleUrl]);

  // Navigation handlers
  const goToStep = useCallback((target: PageExtractorStep) => {
    setStep(target);
  }, []);

  const nextStep = useCallback(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
    if (step < 2) {
      setStep((step + 1) as PageExtractorStep);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 0) {
      setStep((step - 1) as PageExtractorStep);
    }
  }, [step]);

  // Validate step completion
  const canProceedFrom = useCallback(
    (s: PageExtractorStep): boolean => {
      switch (s) {
        case 0:
          return urls.length > 0;
        case 1:
          return fields.filter((f) => f.enabled).length > 0;
        case 2:
          return true;
        default:
          return false;
      }
    },
    [urls, fields],
  );

  // Start bulk extraction
  const startExtraction = useCallback(async () => {
    if (urls.length === 0 || fields.filter((f) => f.enabled).length === 0) return;

    setIsExtracting(true);
    setIsPaused(false);
    abortRef.current = false;
    setError(null);

    const entries: BulkURLEntry[] = urls.map((url) => ({
      id: generatePrefixedId('burl'),
      url,
      status: 'pending' as const,
      rowCount: 0,
    }));
    setBulkEntries(entries);

    const activeFields = fields.filter((f) => f.enabled);
    const concurrency = rateLimit.concurrentTabs;
    let cursor = 0;

    const processUrl = async (entry: BulkURLEntry): Promise<BulkURLEntry> => {
      const updated: BulkURLEntry = {
        ...entry,
        status: 'processing',
        startedAt: Date.now(),
      };

      setBulkEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? updated : e)),
      );

      try {
        const response = await sendRuntimeMessage<{
          rows?: Array<Record<string, unknown>>;
          error?: string;
          partial?: boolean;
        }>({
          type: 'EXTRACT_PAGE_DATA',
          url: entry.url,
          fields: activeFields,
        });

        if (response?.error) {
          return {
            ...updated,
            status: 'failed',
            error: response.error,
            completedAt: Date.now(),
          };
        }

        const rowCount = response?.rows?.length ?? 0;
        return {
          ...updated,
          status: response?.partial ? 'partial' : 'success',
          rowCount,
          completedAt: Date.now(),
        };
      } catch (err) {
        return {
          ...updated,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          completedAt: Date.now(),
        };
      }
    };

    // Process URLs with concurrency control
    const processNext = async (): Promise<void> => {
      while (cursor < entries.length && !abortRef.current) {
        // Wait while paused
        while (isPaused && !abortRef.current) {
          await new Promise((r) => setTimeout(r, 200));
        }

        if (abortRef.current) break;

        const idx = cursor++;
        if (idx >= entries.length) break;

        const result = await processUrl(entries[idx]);
        setBulkEntries((prev) =>
          prev.map((e) => (e.id === result.id ? result : e)),
        );

        // Rate limiting delay
        if (rateLimit.delayMs > 0 && idx < entries.length - 1) {
          await new Promise((r) => setTimeout(r, rateLimit.delayMs));
        }
      }
    };

    // Launch concurrent workers
    const workers = Array.from({ length: Math.min(concurrency, entries.length) }, () =>
      processNext(),
    );
    await Promise.all(workers);

    setIsExtracting(false);
  }, [urls, fields, rateLimit, isPaused, setError]);

  // Stop extraction
  const stopExtraction = useCallback(() => {
    abortRef.current = true;
    setIsExtracting(false);
    setIsPaused(false);
  }, []);

  // Pause/resume
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Add field from element click
  const handleAddField = useCallback(
    async () => {
      try {
        const tab = await getActiveTab();
        if (!tab?.id) return;

        const result = await sendRuntimeMessage<{
          selector: string;
          sampleValues: string[];
          name: string;
        }>({
          type: 'ACTIVATE_SELECTION_MODE',
          tool: 'page-extractor',
        });

        if (result?.selector) {
          const newField: DetectedField = {
            id: generatePrefixedId('fld'),
            name: result.name || `Field ${fields.length + 1}`,
            relativeSelector: result.selector,
            sampleValues: result.sampleValues || [],
            dataType: 'text',
            confidence: 0.9,
            enabled: true,
          };
          setFields((prev) => [...prev, newField]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to select element');
      }
    },
    [fields, setError],
  );

  // Navigate to sample page
  const handleNavigateSample = useCallback(async () => {
    if (!sampleUrl) return;
    try {
      await sendRuntimeMessage({ type: 'NAVIGATE_URL', url: sampleUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to navigate');
    }
  }, [sampleUrl, setError]);

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-3">
        {([0, 1, 2] as PageExtractorStep[]).map((s) => {
          const isActive = s === step;
          const isCompleted = completedSteps.has(s);

          return (
            <React.Fragment key={s}>
              <button
                type="button"
                onClick={() => goToStep(s)}
                disabled={s > step && !canProceedFrom((s - 1) as PageExtractorStep)}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-accent-primary/15 text-accent-primary shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : isCompleted
                      ? 'bg-forge-bg-tertiary/60 text-accent-tertiary hover:bg-forge-bg-tertiary'
                      : 'bg-forge-bg-tertiary/30 text-forge-text-muted hover:text-forge-text-secondary',
                  s > step && !canProceedFrom((s - 1) as PageExtractorStep)
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-accent-primary text-forge-bg'
                      : isCompleted
                        ? 'bg-accent-primary/25 text-accent-primary'
                        : 'bg-forge-border/50 text-forge-text-muted',
                  ].join(' ')}
                >
                  {isCompleted && !isActive ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s + 1
                  )}
                </span>
                {STEP_LABELS[s]}
              </button>
              {s < 2 && (
                <div className={[
                  'flex-1 h-px max-w-6',
                  isCompleted || s < step ? 'bg-accent-primary/40' : 'bg-forge-border/40',
                ].join(' ')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step description */}
      <p className="px-4 pb-3 text-[11px] text-forge-text-muted">
        {STEP_DESCRIPTIONS[step]}
      </p>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-status-error/60 hover:text-status-error transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent">
        {step === 0 && (
          <div className="animate-fade-in">
            <URLInput
              urls={urls}
              onUrlsChange={setUrls}
              previousExtractions={previousExtractions.map((h) => ({
                id: h.id,
                name: h.name,
                urls: [h.sourceUrl],
              }))}
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Sample page navigation */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
                Sample Page
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sampleUrl}
                  onChange={(e) => setSampleUrl(e.target.value)}
                  placeholder="Enter URL to navigate to..."
                  className="flex-1 h-8 px-3 rounded-lg bg-forge-bg-secondary border border-forge-border text-xs text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
                <Button size="sm" variant="secondary" onClick={handleNavigateSample}>
                  Navigate
                </Button>
              </div>
            </div>

            {/* Field selector */}
            <FieldSelector
              fields={fields}
              onFieldsChange={setFields}
              onAddField={handleAddField}
              sampleUrl={sampleUrl}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Rate limiting config */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
                  Delay Between Requests
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={500}
                    max={10000}
                    step={500}
                    value={rateLimit.delayMs}
                    onChange={(e) =>
                      setRateLimit((prev) => ({ ...prev, delayMs: Number(e.target.value) }))
                    }
                    className="flex-1 h-1.5 rounded-full appearance-none bg-forge-border accent-accent-primary cursor-pointer"
                    disabled={isExtracting}
                  />
                  <span className="text-xs font-mono text-forge-text-secondary min-w-[40px] text-right">
                    {(rateLimit.delayMs / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
                  Parallel Tabs
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={rateLimit.concurrentTabs}
                    onChange={(e) =>
                      setRateLimit((prev) => ({
                        ...prev,
                        concurrentTabs: Number(e.target.value),
                      }))
                    }
                    className="flex-1 h-1.5 rounded-full appearance-none bg-forge-border accent-accent-primary cursor-pointer"
                    disabled={isExtracting}
                  />
                  <span className="text-xs font-mono text-forge-text-secondary min-w-[20px] text-right">
                    {rateLimit.concurrentTabs}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary before extraction */}
            {!isExtracting && bulkEntries.length === 0 && (
              <div className="rounded-xl border border-forge-border bg-forge-bg-secondary/50 p-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <Badge variant="success">{urls.length} URLs</Badge>
                  <Badge variant="default">
                    {fields.filter((f) => f.enabled).length} fields
                  </Badge>
                </div>
                <p className="text-xs text-forge-text-muted text-center">
                  Ready to extract {fields.filter((f) => f.enabled).length} fields from{' '}
                  {urls.length} pages
                </p>
              </div>
            )}

            {/* Extraction controls */}
            {!isExtracting && bulkEntries.length === 0 && (
              <Button
                variant="primary"
                onClick={startExtraction}
                disabled={urls.length === 0 || fields.filter((f) => f.enabled).length === 0}
                iconLeft={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                }
              >
                Start Extraction
              </Button>
            )}

            {isExtracting && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={togglePause}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="danger" size="sm" onClick={stopExtraction}>
                  Stop
                </Button>
              </div>
            )}

            {/* Bulk progress */}
            {bulkEntries.length > 0 && (
              <BulkProgress
                entries={bulkEntries}
                isExtracting={isExtracting}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-forge-border bg-forge-bg-secondary/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevStep}
          disabled={step === 0}
          iconLeft={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          }
        >
          Back
        </Button>

        {step < 2 && (
          <Button
            variant="primary"
            size="sm"
            onClick={nextStep}
            disabled={!canProceedFrom(step)}
            iconRight={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            }
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageExtractorView;
