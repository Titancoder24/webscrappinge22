import React, { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../../../store';
import type { SpeedEntry } from '../../../store';
import { getActiveTab, sendTabMessage, onMessage } from '../../../../utils/chrome-api';
import type { Message } from '../../../../types/messages';
import type { ExtractionProgress as ProgressType, Row, ExtractionSummary } from '../../../../types/extraction';
import { formatDuration, formatNumber, formatFileSize } from '../../../../utils/format';
import ProgressRing from './ProgressRing';
import LiveCounter from './LiveCounter';
import LiveDataFeed from './LiveDataFeed';
import SpeedGraph from './SpeedGraph';
import CompletionCard from './CompletionCard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ExtractionProgressProps {
  /** Navigate to data table view after completion */
  onViewData: () => void;
  /** Trigger export flow */
  onExport: () => void;
  /** Reset and start new extraction */
  onNewExtraction: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExtractionProgress: React.FC<ExtractionProgressProps> = ({
  onViewData,
  onExport,
  onNewExtraction,
}) => {
  const extractionStatus = useStore((s) => s.extractionStatus);
  const setExtractionStatus = useStore((s) => s.setExtractionStatus);
  const progress = useStore((s) => s.extractionProgress);
  const updateProgress = useStore((s) => s.updateExtractionProgress);
  const extractedRows = useStore((s) => s.extractedRows);
  const addExtractedRows = useStore((s) => s.addExtractedRows);
  const summary = useStore((s) => s.extractionSummary);
  const setExtractionSummary = useStore((s) => s.setExtractionSummary);
  const speedHistory = useStore((s) => s.speedHistory);
  const addSpeedEntry = useStore((s) => s.addSpeedEntry);
  const fields = useStore((s) => s.fields);
  const buildExtractionConfig = useStore((s) => s.buildExtractionConfig);
  const setError = useStore((s) => s.setError);
  const resetListExtractor = useStore((s) => s.resetListExtractor);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const prevItemsRef = useRef(0);

  // -----------------------------------------------------------------------
  // Start extraction on mount (when status is not already running)
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (extractionStatus === 'idle' || extractionStatus === 'configuring') {
      startExtraction();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startExtraction = useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        setError('No active tab found');
        return;
      }

      const config = buildExtractionConfig();
      setExtractionStatus('running');
      startTimeRef.current = Date.now();
      prevItemsRef.current = 0;

      await sendTabMessage(tab.id, {
        type: 'START_EXTRACTION',
        config,
      });

      // Start elapsed timer and speed tracking
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        updateProgress({ elapsed });

        // Calculate speed (items per second over the last interval)
        const currentItems = useStore.getState().extractionProgress.items;
        const delta = currentItems - prevItemsRef.current;
        const speed = delta / 1; // 1-second interval
        prevItemsRef.current = currentItems;

        const entry: SpeedEntry = {
          timestamp: Date.now(),
          itemsPerSec: Math.max(0, speed),
        };
        addSpeedEntry(entry);
        updateProgress({ speed });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start extraction');
      setExtractionStatus('error');
    }
  }, [buildExtractionConfig, setExtractionStatus, updateProgress, addSpeedEntry, setError]);

  // -----------------------------------------------------------------------
  // Listen for messages from content script
  // -----------------------------------------------------------------------

  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      const msg = message as Message;

      switch (msg.type) {
        case 'EXTRACTION_PROGRESS': {
          updateProgress(msg.data);
          break;
        }
        case 'EXTRACTION_ROW': {
          addExtractedRows([msg.row]);
          updateProgress({ items: useStore.getState().extractionProgress.items + 1 });
          break;
        }
        case 'EXTRACTION_BATCH': {
          addExtractedRows(msg.rows);
          updateProgress({
            items: useStore.getState().extractionProgress.items + msg.rows.length,
          });
          break;
        }
        case 'EXTRACTION_COMPLETE': {
          setExtractionStatus('completed');
          setExtractionSummary(msg.summary);
          if (timerRef.current) clearInterval(timerRef.current);
          break;
        }
        case 'EXTRACTION_ERROR': {
          updateProgress({
            errors: useStore.getState().extractionProgress.errors + 1,
          });
          // Don't stop on individual errors; only stop on fatal
          if (!msg.url) {
            setExtractionStatus('error');
            setError(msg.error);
            if (timerRef.current) clearInterval(timerRef.current);
          }
          break;
        }
      }
    });

    return unsubscribe;
  }, [updateProgress, addExtractedRows, setExtractionStatus, setExtractionSummary, setError]);

  // -----------------------------------------------------------------------
  // Pause / Resume / Stop
  // -----------------------------------------------------------------------

  const handlePause = useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        await sendTabMessage(tab.id, { type: 'PAUSE_EXTRACTION' });
      }
      setExtractionStatus('paused');
    } catch {
      // Non-critical
    }
  }, [setExtractionStatus]);

  const handleResume = useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        await sendTabMessage(tab.id, { type: 'RESUME_EXTRACTION' });
      }
      setExtractionStatus('running');
    } catch {
      // Non-critical
    }
  }, [setExtractionStatus]);

  const handleStop = useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        await sendTabMessage(tab.id, { type: 'STOP_EXTRACTION' });
      }
    } catch {
      // Non-critical
    }
    if (timerRef.current) clearInterval(timerRef.current);

    // Create summary from current progress
    const currentProgress = useStore.getState().extractionProgress;
    const summaryFromProgress: ExtractionSummary = {
      totalItems: currentProgress.items,
      totalPages: currentProgress.pages,
      totalTime: currentProgress.elapsed * 1000,
      avgSpeed: currentProgress.elapsed > 0 ? currentProgress.items / currentProgress.elapsed : 0,
      errors: currentProgress.errors,
      dataSize: JSON.stringify(useStore.getState().extractedRows).length,
    };
    setExtractionSummary(summaryFromProgress);
    setExtractionStatus('completed');
  }, [setExtractionStatus, setExtractionSummary]);

  const handleNewExtraction = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    resetListExtractor();
    onNewExtraction();
  }, [resetListExtractor, onNewExtraction]);

  // -----------------------------------------------------------------------
  // Progress percentage (estimated)
  // -----------------------------------------------------------------------

  const maxItems = 1000; // default from config
  const progressPct = Math.min(100, (progress.items / maxItems) * 100);

  // -----------------------------------------------------------------------
  // Render: Completed state
  // -----------------------------------------------------------------------

  if (extractionStatus === 'completed' && summary) {
    return (
      <CompletionCard
        summary={summary}
        onOpenDataTable={onViewData}
        onExport={onExport}
        onNewExtraction={handleNewExtraction}
      />
    );
  }

  // -----------------------------------------------------------------------
  // Render: Error state
  // -----------------------------------------------------------------------

  const error = useStore((s) => s.error);

  if (extractionStatus === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-status-error">Extraction Failed</h3>
          <p className="text-xs text-forge-text-muted mt-1 max-w-[240px]">
            {error ?? 'An unexpected error occurred during extraction.'}
          </p>
        </div>
        {progress.items > 0 && (
          <p className="text-xs text-forge-text-secondary">
            {formatNumber(progress.items)} items were extracted before the error.
          </p>
        )}
        <div className="flex gap-2 w-full">
          {progress.items > 0 && (
            <button
              type="button"
              onClick={onViewData}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/5 transition-all"
            >
              View Partial Data
            </button>
          )}
          <button
            type="button"
            onClick={handleNewExtraction}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-forge-text-secondary border border-forge-border hover:bg-forge-bg-tertiary/40 transition-all"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Running / Paused state
  // -----------------------------------------------------------------------

  const isPaused = extractionStatus === 'paused';

  return (
    <div className="flex flex-col items-center gap-5 p-4 animate-fade-in">
      {/* Progress ring + counter */}
      <div className="flex flex-col items-center gap-3">
        <ProgressRing value={progressPct} size={100} strokeWidth={7} />
        <LiveCounter value={progress.items} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {[
          { label: 'Pages', value: formatNumber(progress.pages) },
          { label: 'Elapsed', value: formatDuration(progress.elapsed) },
          {
            label: 'Remaining',
            value:
              progress.estimatedRemaining > 0
                ? formatDuration(progress.estimatedRemaining)
                : '--',
          },
          {
            label: 'Speed',
            value: `${progress.speed.toFixed(1)}/s`,
          },
          { label: 'Errors', value: String(progress.errors) },
          {
            label: 'Data Size',
            value: formatFileSize(JSON.stringify(extractedRows).length),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-forge-bg-tertiary/40"
          >
            <span
              className="text-xs font-bold tabular-nums text-forge-text"
              style={{ textShadow: '0 0 6px rgba(16, 185, 129, 0.2)' }}
            >
              {stat.value}
            </span>
            <span className="text-[9px] font-medium text-forge-text-muted uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Speed graph */}
      <SpeedGraph data={speedHistory} className="w-full" />

      {/* Live data feed */}
      <LiveDataFeed rows={extractedRows} fields={fields} className="w-full" />

      {/* Action buttons */}
      <div className="flex gap-2 w-full">
        {/* View Data */}
        <button
          type="button"
          onClick={onViewData}
          disabled={extractedRows.length === 0}
          className="flex items-center justify-center gap-1.5 flex-[2] py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #10B981, #14B8A6)',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          View Data
        </button>

        {/* Pause / Resume */}
        <button
          type="button"
          onClick={isPaused ? handleResume : handlePause}
          className="flex items-center justify-center gap-1 flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-[0.98]"
          style={{
            color: isPaused ? '#10B981' : undefined,
            borderColor: isPaused ? 'rgba(16, 185, 129, 0.3)' : undefined,
          }}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Resume
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forge-text-secondary" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              <span className="text-forge-text-secondary">Pause</span>
            </>
          )}
        </button>

        {/* Stop */}
        <button
          type="button"
          onClick={handleStop}
          className="flex items-center justify-center gap-1 flex-1 py-2.5 rounded-lg text-xs font-semibold text-status-error border border-status-error/20 hover:bg-status-error/5 transition-all duration-200 active:scale-[0.98]"
          title="Stop extraction"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
          Stop
        </button>
      </div>

      {/* Paused indicator */}
      {isPaused && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-warning/5 border border-status-warning/20 w-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          <span className="text-xs text-status-warning font-medium">
            Extraction paused
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(ExtractionProgress);
