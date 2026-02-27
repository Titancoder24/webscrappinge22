/**
 * QuickExtractButton - One-click quick extraction button.
 *
 * Features:
 *  - Large prominent button with emerald gradient
 *  - Animated lightning bolt SVG icon
 *  - Click: sends SCAN_PAGE, auto-selects the top-confidence pattern,
 *    and starts extraction automatically
 *  - Pulsing glow animation when idle
 *  - Loading spinner during scan phase
 *  - Disabled state when extraction is running
 */

import React, { useCallback, useState } from 'react';
import { useExtraction } from '../../hooks/useExtraction';
import { useStore } from '../../store';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const QuickExtractButton: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { startScan, selectPattern, startExtraction, status } = useExtraction();
  const addToast = useStore((s) => s.addToast);
  const setActiveTool = useStore((s) => s.setActiveTool);

  const isRunning = status === 'running' || status === 'paused';
  const isDisabled = isRunning || isProcessing;

  const handleClick = useCallback(async () => {
    if (isDisabled) return;

    try {
      setIsProcessing(true);

      // Step 1: Scan the page
      const patterns = await startScan();

      if (patterns.length === 0) {
        addToast({
          type: 'warning',
          title: 'No patterns found',
          message: 'Try using a specific extractor tool instead.',
          duration: 5000,
        });
        setIsProcessing(false);
        return;
      }

      // Step 2: Auto-select the highest confidence pattern
      const topPattern = patterns.reduce((best, current) =>
        current.confidence > best.confidence ? current : best,
      );
      selectPattern(topPattern.id);

      // Step 3: Switch to list extractor and start
      setActiveTool('list-extractor');

      // Step 4: Start extraction with auto-built config
      await startExtraction();

      addToast({
        type: 'success',
        title: 'Instant Extract started',
        message: `Found ${topPattern.itemCount} items using ${topPattern.category} pattern`,
        duration: 4000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Quick extraction failed';
      addToast({
        type: 'error',
        title: 'Instant Extract failed',
        message,
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isDisabled, startScan, selectPattern, startExtraction, setActiveTool, addToast]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={[
        // Layout
        'relative w-full flex items-center justify-center gap-2.5 h-12 px-5 rounded-xl',
        'select-none font-semibold text-sm tracking-wide',
        // Colors
        'text-forge-bg',
        // Gradient
        'bg-gradient-to-r from-accent-primary to-accent-secondary',
        // Transitions
        'transition-all duration-300 ease-out',
        'motion-reduce:transition-none',
        // Hover
        isDisabled
          ? 'opacity-60 cursor-not-allowed'
          : [
              'cursor-pointer',
              'hover:shadow-[0_0_30px_rgba(16,185,129,0.4),0_0_10px_rgba(16,185,129,0.2)]',
              'motion-safe:hover:scale-[1.02]',
              'motion-safe:active:scale-[0.98]',
            ].join(' '),
        // Idle pulsing glow (only when not processing and not running)
        !isDisabled ? 'animate-pulse-glow' : '',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-forge-bg',
      ].join(' ')}
      aria-label={isProcessing ? 'Scanning page...' : 'Quick extract data from this page'}
    >
      {isProcessing ? (
        <>
          {/* Loading spinner */}
          <svg
            className="animate-spin w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-25"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-75"
            />
          </svg>
          <span>Scanning Page...</span>
        </>
      ) : (
        <>
          {/* Lightning bolt icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={[
              isDisabled ? '' : 'drop-shadow-[0_0_6px_rgba(10,15,13,0.5)]',
              // Lightning flash animation when idle
              !isDisabled ? 'animate-[lightningFlash_2s_ease-in-out_infinite]' : '',
            ].join(' ')}
            aria-hidden="true"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span>Instant Extract</span>
        </>
      )}
    </button>
  );
};

export default QuickExtractButton;
