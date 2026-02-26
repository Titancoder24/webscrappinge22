import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '../../../store';
import { getActiveTab, sendTabMessage } from '../../../../utils/chrome-api';
import type { PaginationMode, PaginationConfig as PaginationConfigType } from '../../../../types/extraction';
import type { Message } from '../../../../types/messages';
import PaginationModeCard from './PaginationModeCard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PaginationConfigProps {
  /** Go to next step (start extraction) */
  onNext: () => void;
  /** Go back to previous step */
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// All available pagination modes
// ---------------------------------------------------------------------------

const ALL_MODES: PaginationMode[] = [
  'auto-scroll',
  'click-next',
  'url-pattern',
  'load-more',
  'api-intercept',
  'manual-urls',
];

// ---------------------------------------------------------------------------
// Estimated time helper
// ---------------------------------------------------------------------------

function estimateTime(config: PaginationConfigType, matchCount: number): string {
  const pages = config.maxPages;
  const delay = config.delayMs / 1000;
  const itemsPerPage = matchCount > 0 ? matchCount : 20;

  let seconds: number;
  switch (config.mode) {
    case 'auto-scroll':
      seconds = pages * (delay + 2);
      break;
    case 'click-next':
    case 'load-more':
      seconds = pages * (delay + 1.5);
      break;
    case 'url-pattern':
      seconds = pages * (delay + 3);
      break;
    case 'api-intercept':
      seconds = pages * (delay + 0.5);
      break;
    case 'manual-urls':
      seconds = (config.manualUrls?.length ?? 1) * (delay + 3);
      break;
    default:
      seconds = pages * delay;
  }

  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  const mins = Math.ceil(seconds / 60);
  return `~${mins}m`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PaginationConfig: React.FC<PaginationConfigProps> = ({ onNext, onBack }) => {
  const detectedConfigs = useStore((s) => s.detectedPaginationConfigs);
  const setDetectedConfigs = useStore((s) => s.setDetectedPaginationConfigs);
  const selectedMode = useStore((s) => s.selectedPaginationMode);
  const selectMode = useStore((s) => s.selectPaginationMode);
  const paginationConfig = useStore((s) => s.paginationConfig);
  const updateConfig = useStore((s) => s.updatePaginationConfig);
  const matchCount = useStore((s) => s.matchCount);
  const setError = useStore((s) => s.setError);

  const [detectingPagination, setDetectingPagination] = useState(false);
  const [manualUrlText, setManualUrlText] = useState(
    paginationConfig.manualUrls?.join('\n') ?? '',
  );

  // -----------------------------------------------------------------------
  // Auto-detect pagination on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (detectedConfigs.length > 0) return;

    const detect = async () => {
      setDetectingPagination(true);
      try {
        const tab = await getActiveTab();
        if (!tab?.id) return;

        const result = await sendTabMessage<Message>(tab.id, { type: 'DETECT_PAGINATION' });
        if (result && 'configs' in result) {
          const configs = (result as { configs: PaginationConfigType[] }).configs;
          setDetectedConfigs(configs);

          // Auto-select the highest-confidence mode
          if (configs.length > 0) {
            const best = [...configs].sort((a, b) => b.confidence - a.confidence)[0];
            selectMode(best.mode);
          }
        }
      } catch {
        // Non-critical: user can manually pick a mode
      } finally {
        setDetectingPagination(false);
      }
    };

    detect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Mode configs lookup
  // -----------------------------------------------------------------------

  const configByMode = useMemo(() => {
    const map = new Map<PaginationMode, PaginationConfigType>();
    detectedConfigs.forEach((c) => map.set(c.mode, c));
    return map;
  }, [detectedConfigs]);

  // Recommended mode
  const recommendedMode = useMemo(() => {
    if (detectedConfigs.length === 0) return null;
    return [...detectedConfigs].sort((a, b) => b.confidence - a.confidence)[0].mode;
  }, [detectedConfigs]);

  // Modes to show: detected ones first, then remaining
  const orderedModes = useMemo(() => {
    const detected = detectedConfigs.map((c) => c.mode);
    const remaining = ALL_MODES.filter((m) => !detected.includes(m));
    return [...detected, ...remaining];
  }, [detectedConfigs]);

  // -----------------------------------------------------------------------
  // Select next button click handler
  // -----------------------------------------------------------------------

  const handleSelectClickTarget = useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (!tab?.id) return;

      await sendTabMessage(tab.id, {
        type: 'ACTIVATE_SELECTION_MODE',
        tool: 'list-extractor-pagination',
      });

      const handleMessage = (message: unknown) => {
        const msg = message as { type?: string; selector?: string };
        if (msg.type === 'ELEMENT_CLICKED') {
          updateConfig({ selector: msg.selector ?? '' });
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);

      // Auto-cancel after 30s
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }, 30000);
    } catch (err) {
      setError('Failed to select pagination element');
    }
  }, [updateConfig, setError]);

  // -----------------------------------------------------------------------
  // Manual URLs handler
  // -----------------------------------------------------------------------

  const handleManualUrlsChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setManualUrlText(e.target.value);
      const urls = e.target.value
        .split('\n')
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
      updateConfig({ manualUrls: urls, maxPages: urls.length || 1 });
    },
    [updateConfig],
  );

  // -----------------------------------------------------------------------
  // Estimated time
  // -----------------------------------------------------------------------

  const estimatedTime = useMemo(
    () => estimateTime(paginationConfig, matchCount),
    [paginationConfig, matchCount],
  );

  const canProceed = selectedMode !== null;

  // -----------------------------------------------------------------------
  // Render mode-specific options
  // -----------------------------------------------------------------------

  const renderModeOptions = () => {
    if (!selectedMode) return null;

    switch (selectedMode) {
      case 'auto-scroll':
        return (
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* Speed slider */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Scroll Speed
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-forge-text-muted w-8">Slow</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={1}
                  value={
                    paginationConfig.scrollSpeed === 'slow'
                      ? 0
                      : paginationConfig.scrollSpeed === 'medium'
                        ? 1
                        : 2
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const speed = val === 0 ? 'slow' : val === 1 ? 'medium' : 'fast';
                    updateConfig({ scrollSpeed: speed as 'slow' | 'medium' | 'fast' });
                  }}
                  className="flex-1 accent-[#10B981] h-1.5"
                />
                <span className="text-[10px] text-forge-text-muted w-8 text-right">Fast</span>
              </div>
            </div>

            {/* Max scrolls */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Max Scrolls
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={paginationConfig.maxPages}
                onChange={(e) => updateConfig({ maxPages: Number(e.target.value) || 1 })}
                className="w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              />
            </div>

            {/* Wait time */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Wait (ms)
              </label>
              <input
                type="number"
                min={200}
                max={10000}
                step={100}
                value={paginationConfig.delayMs}
                onChange={(e) => updateConfig({ delayMs: Number(e.target.value) || 1000 })}
                className="w-20 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              />
            </div>
          </div>
        );

      case 'click-next':
        return (
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* Next button selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                "Next" Button Selector
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paginationConfig.selector ?? ''}
                  onChange={(e) => updateConfig({ selector: e.target.value })}
                  placeholder="CSS selector for Next button"
                  className="flex-1 bg-forge-bg-tertiary border border-forge-border rounded px-2.5 py-1.5 text-xs font-mono text-forge-text outline-none focus:border-accent-primary/50 placeholder-forge-text-muted"
                />
                <button
                  type="button"
                  onClick={handleSelectClickTarget}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded border border-forge-border text-[10px] font-semibold text-forge-text-secondary hover:border-accent-primary/40 hover:text-accent-primary hover:bg-accent-primary/5 transition-all"
                  title="Click to select on page"
                >
                  Pick
                </button>
              </div>
            </div>

            {/* Max pages */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Max Pages
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={paginationConfig.maxPages}
                onChange={(e) => updateConfig({ maxPages: Number(e.target.value) || 1 })}
                className="w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              />
            </div>

            {/* Delay */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Delay (ms)
              </label>
              <input
                type="number"
                min={200}
                max={10000}
                step={100}
                value={paginationConfig.delayMs}
                onChange={(e) => updateConfig({ delayMs: Number(e.target.value) || 1000 })}
                className="w-20 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              />
            </div>
          </div>
        );

      case 'url-pattern':
        return (
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* URL pattern */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                URL Pattern
              </label>
              <input
                type="text"
                value={paginationConfig.urlPattern ?? ''}
                onChange={(e) => updateConfig({ urlPattern: e.target.value })}
                placeholder="https://example.com/page/{page}"
                className="w-full bg-forge-bg-tertiary border border-forge-border rounded px-2.5 py-1.5 text-xs font-mono text-forge-text outline-none focus:border-accent-primary/50 placeholder-forge-text-muted"
              />
              <span className="text-[10px] text-forge-text-muted">
                Use {'{page}'} as a placeholder for the page number
              </span>
            </div>

            {/* Max pages */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Max Pages
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={paginationConfig.maxPages}
                onChange={(e) => updateConfig({ maxPages: Number(e.target.value) || 1 })}
                className="w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              />
            </div>
          </div>
        );

      case 'load-more':
        return (
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* Load more button selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                "Load More" Button Selector
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paginationConfig.selector ?? ''}
                  onChange={(e) => updateConfig({ selector: e.target.value })}
                  placeholder="CSS selector for Load More"
                  className="flex-1 bg-forge-bg-tertiary border border-forge-border rounded px-2.5 py-1.5 text-xs font-mono text-forge-text outline-none focus:border-accent-primary/50 placeholder-forge-text-muted"
                />
                <button
                  type="button"
                  onClick={handleSelectClickTarget}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded border border-forge-border text-[10px] font-semibold text-forge-text-secondary hover:border-accent-primary/40 hover:text-accent-primary hover:bg-accent-primary/5 transition-all"
                  title="Click to select on page"
                >
                  Pick
                </button>
              </div>
            </div>

            {/* Max clicks */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Max Clicks
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={paginationConfig.maxPages}
                onChange={(e) => updateConfig({ maxPages: Number(e.target.value) || 1 })}
                className="w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              />
            </div>
          </div>
        );

      case 'api-intercept':
        return (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Detected API Endpoint
              </label>
              <div className="px-3 py-2 rounded-lg bg-forge-bg-tertiary/50 border border-forge-border">
                <code className="text-[10px] text-accent-primary font-mono break-all">
                  {paginationConfig.apiEndpoint || 'No endpoint detected yet'}
                </code>
              </div>
            </div>

            {paginationConfig.apiPageParam && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                  Page Parameter
                </span>
                <code className="text-[10px] font-mono text-accent-secondary">
                  {paginationConfig.apiPageParam}
                </code>
              </div>
            )}

            {/* Max pages */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                Max Pages
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={paginationConfig.maxPages}
                onChange={(e) => updateConfig({ maxPages: Number(e.target.value) || 1 })}
                className="w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              />
            </div>
          </div>
        );

      case 'manual-urls':
        return (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
                URLs (one per line)
              </label>
              <textarea
                value={manualUrlText}
                onChange={handleManualUrlsChange}
                placeholder={'https://example.com/page/1\nhttps://example.com/page/2\nhttps://example.com/page/3'}
                rows={5}
                className="w-full bg-forge-bg-tertiary border border-forge-border rounded px-2.5 py-2 text-xs font-mono text-forge-text outline-none focus:border-accent-primary/50 placeholder-forge-text-muted resize-y"
              />
              <span className="text-[10px] text-forge-text-muted tabular-nums">
                {(paginationConfig.manualUrls?.length ?? 0)} URL(s) entered
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-forge-text">Pagination</h3>
        <p className="text-[10px] text-forge-text-muted mt-0.5">
          Configure how to navigate through multiple pages of data
        </p>
      </div>

      {/* Loading skeleton */}
      {detectingPagination && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
          <span className="text-xs text-forge-text-muted">Detecting pagination...</span>
        </div>
      )}

      {/* Mode cards */}
      <div className="flex flex-col gap-2">
        {orderedModes.map((mode) => (
          <PaginationModeCard
            key={mode}
            mode={mode}
            config={configByMode.get(mode)}
            isRecommended={mode === recommendedMode}
            isSelected={mode === selectedMode}
            onClick={selectMode}
          />
        ))}
      </div>

      {/* Mode-specific options */}
      {selectedMode && (
        <div className="pl-3 border-l-2 border-accent-primary/30">{renderModeOptions()}</div>
      )}

      {/* Estimated time */}
      {selectedMode && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-forge-bg-tertiary/50 border border-forge-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forge-text-muted flex-shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-xs text-forge-text-secondary">
            Estimated time: <span className="font-semibold text-accent-primary">{estimatedTime}</span>
          </span>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg text-xs font-semibold text-forge-text-secondary border border-forge-border hover:border-accent-primary/30 hover:text-forge-text hover:bg-forge-bg-tertiary/40 transition-all duration-200 active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center justify-center gap-2 flex-[2] py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={
            canProceed
              ? {
                  background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                  color: 'white',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)',
                }
              : {
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: 'rgba(16, 185, 129, 0.4)',
                }
          }
        >
          Start Extraction
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default React.memo(PaginationConfig);
