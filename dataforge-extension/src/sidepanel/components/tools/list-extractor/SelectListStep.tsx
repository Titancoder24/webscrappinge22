import React, { useCallback, useState, useEffect } from 'react';
import { useStore } from '../../../store';
import { getActiveTab, sendTabMessage } from '../../../../utils/chrome-api';
import type { Message } from '../../../../types/messages';
import type { SelectorSegment } from '../../../../types/selector';
import DetectionSuggestions from './DetectionSuggestions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SelectListStepProps {
  /** Advance to next step */
  onNext: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SelectListStep: React.FC<SelectListStepProps> = ({ onNext }) => {
  const selectionMode = useStore((s) => s.selectionMode);
  const setSelectionMode = useStore((s) => s.setSelectionMode);
  const detectedPatterns = useStore((s) => s.detectedPatterns);
  const setDetectedPatterns = useStore((s) => s.setDetectedPatterns);
  const selectedPatternId = useStore((s) => s.selectedPatternId);
  const selectPattern = useStore((s) => s.selectPattern);
  const selectorPath = useStore((s) => s.selectorPath);
  const setSelectorPath = useStore((s) => s.setSelectorPath);
  const manualSelector = useStore((s) => s.manualSelector);
  const setManualSelector = useStore((s) => s.setManualSelector);
  const matchCount = useStore((s) => s.matchCount);
  const setMatchCount = useStore((s) => s.setMatchCount);
  const isScanning = useStore((s) => s.isScanning);
  const setIsScanning = useStore((s) => s.setIsScanning);
  const setError = useStore((s) => s.setError);

  const [editingSelector, setEditingSelector] = useState(false);
  const [selectorDraft, setSelectorDraft] = useState(manualSelector);

  // Sync draft when manual selector changes externally
  useEffect(() => {
    setSelectorDraft(manualSelector);
  }, [manualSelector]);

  // -----------------------------------------------------------------------
  // Activate / Deactivate selection mode
  // -----------------------------------------------------------------------

  const handleActivateSelection = useCallback(async () => {
    try {
      setIsScanning(true);
      setSelectionMode(true);

      const tab = await getActiveTab();
      if (!tab?.id) {
        setError('No active tab found');
        setIsScanning(false);
        return;
      }

      // Send activation message
      await sendTabMessage<Message>(tab.id, {
        type: 'ACTIVATE_SELECTION_MODE',
        tool: 'list-extractor',
      });

      // Scan the page for patterns
      const response = await sendTabMessage<Message>(tab.id, { type: 'SCAN_PAGE' });

      if (response && 'patterns' in response) {
        setDetectedPatterns((response as { patterns: typeof detectedPatterns }).patterns);

        // Build selector path from the first pattern's selector
        const firstPattern = (response as { patterns: typeof detectedPatterns }).patterns[0];
        if (firstPattern) {
          buildSelectorPath(firstPattern.selector);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate selection mode');
    } finally {
      setIsScanning(false);
    }
  }, [setIsScanning, setSelectionMode, setDetectedPatterns, setError]);

  const handleDeactivateSelection = useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        await sendTabMessage(tab.id, { type: 'DEACTIVATE_SELECTION_MODE' });
        await sendTabMessage(tab.id, { type: 'CLEAR_HIGHLIGHTS' });
      }
    } catch {
      // Silent fail on deactivation
    }
    setSelectionMode(false);
  }, [setSelectionMode]);

  // -----------------------------------------------------------------------
  // Pattern selection
  // -----------------------------------------------------------------------

  const handleSelectPattern = useCallback(
    async (id: string) => {
      selectPattern(id);

      const pattern = detectedPatterns.find((p) => p.id === id);
      if (!pattern) return;

      setMatchCount(pattern.itemCount);
      setManualSelector(pattern.selector);
      buildSelectorPath(pattern.selector);

      try {
        const tab = await getActiveTab();
        if (tab?.id) {
          await sendTabMessage(tab.id, {
            type: 'SELECT_PATTERN',
            patternId: id,
          });
          await sendTabMessage(tab.id, {
            type: 'HIGHLIGHT_ELEMENTS',
            selector: pattern.selector,
          });
        }
      } catch {
        // Highlight failure is non-critical
      }
    },
    [selectPattern, detectedPatterns, setMatchCount, setManualSelector],
  );

  // -----------------------------------------------------------------------
  // Selector refinement (broaden / narrow)
  // -----------------------------------------------------------------------

  const handleBroaden = useCallback(async () => {
    if (!selectorPath || selectorPath.segments.length <= 1) return;

    const newSegments = selectorPath.segments.slice(0, -1);
    const newSelector = newSegments.map((s) => s.selector).join(' > ');

    setSelectorPath({ segments: newSegments, fullSelector: newSelector });
    setManualSelector(newSelector);

    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        const result = await sendTabMessage<Message>(tab.id, {
          type: 'TEST_SELECTOR',
          selector: newSelector,
        });
        if (result && 'matchCount' in result) {
          setMatchCount((result as { matchCount: number }).matchCount);
        }
        await sendTabMessage(tab.id, { type: 'HIGHLIGHT_ELEMENTS', selector: newSelector });
      }
    } catch {
      // Non-critical
    }
  }, [selectorPath, setSelectorPath, setManualSelector, setMatchCount]);

  const handleNarrow = useCallback(async () => {
    if (!manualSelector) return;

    // Add :first-child pseudo or refine further
    const refinedSelector = manualSelector.includes(':first-child')
      ? manualSelector
      : `${manualSelector} > *`;

    setManualSelector(refinedSelector);
    buildSelectorPath(refinedSelector);

    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        const result = await sendTabMessage<Message>(tab.id, {
          type: 'TEST_SELECTOR',
          selector: refinedSelector,
        });
        if (result && 'matchCount' in result) {
          setMatchCount((result as { matchCount: number }).matchCount);
        }
        await sendTabMessage(tab.id, { type: 'HIGHLIGHT_ELEMENTS', selector: refinedSelector });
      }
    } catch {
      // Non-critical
    }
  }, [manualSelector, setManualSelector, setMatchCount]);

  // -----------------------------------------------------------------------
  // Manual selector editing
  // -----------------------------------------------------------------------

  const handleSelectorSubmit = useCallback(async () => {
    const trimmed = selectorDraft.trim();
    if (!trimmed) return;

    setManualSelector(trimmed);
    setEditingSelector(false);
    buildSelectorPath(trimmed);

    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        const result = await sendTabMessage<Message>(tab.id, {
          type: 'TEST_SELECTOR',
          selector: trimmed,
        });
        if (result && 'matchCount' in result) {
          setMatchCount((result as { matchCount: number }).matchCount);
        }
        await sendTabMessage(tab.id, { type: 'HIGHLIGHT_ELEMENTS', selector: trimmed });
      }
    } catch (err) {
      setError('Invalid selector or no matches found');
    }
  }, [selectorDraft, setManualSelector, setMatchCount, setError]);

  const handleSelectorKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSelectorSubmit();
      if (e.key === 'Escape') {
        setSelectorDraft(manualSelector);
        setEditingSelector(false);
      }
    },
    [handleSelectorSubmit, manualSelector],
  );

  // -----------------------------------------------------------------------
  // Breadcrumb segment click
  // -----------------------------------------------------------------------

  const handleSegmentClick = useCallback(
    async (segmentIndex: number) => {
      if (!selectorPath) return;

      const newSegments = selectorPath.segments.slice(0, segmentIndex + 1);
      const newSelector = newSegments.map((s) => s.selector).join(' > ');

      setSelectorPath({ segments: newSegments, fullSelector: newSelector });
      setManualSelector(newSelector);

      try {
        const tab = await getActiveTab();
        if (tab?.id) {
          const result = await sendTabMessage<Message>(tab.id, {
            type: 'TEST_SELECTOR',
            selector: newSelector,
          });
          if (result && 'matchCount' in result) {
            setMatchCount((result as { matchCount: number }).matchCount);
          }
          await sendTabMessage(tab.id, { type: 'HIGHLIGHT_ELEMENTS', selector: newSelector });
        }
      } catch {
        // Non-critical
      }
    },
    [selectorPath, setSelectorPath, setManualSelector, setMatchCount],
  );

  // -----------------------------------------------------------------------
  // Build a SelectorPath from a CSS selector string
  // -----------------------------------------------------------------------

  function buildSelectorPath(selector: string) {
    const parts = selector.split(/\s*>\s*/).filter(Boolean);
    const segments: SelectorSegment[] = parts.map((part, idx) => {
      const tagMatch = part.match(/^([a-zA-Z][a-zA-Z0-9-]*)?/);
      const tag = tagMatch?.[1] ?? 'div';
      const idMatch = part.match(/#([a-zA-Z0-9_-]+)/);
      const classMatches = [...part.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);

      return {
        tag,
        classes: classMatches,
        id: idMatch?.[1],
        index: idx,
        selector: part,
      };
    });

    setSelectorPath({ segments, fullSelector: selector });
  }

  // -----------------------------------------------------------------------
  // Can proceed
  // -----------------------------------------------------------------------

  const canProceed = selectedPatternId !== null && matchCount > 0;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Activate Selection Mode button */}
      {!selectionMode ? (
        <button
          type="button"
          onClick={handleActivateSelection}
          disabled={isScanning}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #10B981, #14B8A6)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25), 0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {isScanning ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Scanning Page...
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              Activate Selection Mode
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDeactivateSelection}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold text-accent-primary border border-accent-primary/40 bg-accent-primary/5 hover:bg-accent-primary/10 transition-all duration-200 active:scale-[0.98]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Deactivate Selection Mode
        </button>
      )}

      {/* Detection Suggestions */}
      <DetectionSuggestions
        patterns={detectedPatterns}
        selectedPatternId={selectedPatternId}
        onSelectPattern={handleSelectPattern}
        isScanning={isScanning}
      />

      {/* Selection refinement + breadcrumb (shown once a pattern is selected) */}
      {selectedPatternId && (
        <div className="flex flex-col gap-3 animate-slide-in-up">
          {/* Refinement controls */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
              Refine Selection
            </span>
            <div className="flex gap-1 ml-auto">
              <button
                type="button"
                onClick={handleBroaden}
                className="flex items-center justify-center w-7 h-7 rounded-md border border-forge-border text-forge-text-secondary hover:border-accent-primary/40 hover:text-accent-primary hover:bg-accent-primary/5 transition-all duration-150 active:scale-95"
                title="Broaden selection (go up)"
                aria-label="Broaden selection"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNarrow}
                className="flex items-center justify-center w-7 h-7 rounded-md border border-forge-border text-forge-text-secondary hover:border-accent-primary/40 hover:text-accent-primary hover:bg-accent-primary/5 transition-all duration-150 active:scale-95"
                title="Narrow selection (go down)"
                aria-label="Narrow selection"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {/* Selector path breadcrumb */}
          {selectorPath && selectorPath.segments.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap px-3 py-2 rounded-lg bg-forge-bg-tertiary/50 border border-forge-border overflow-x-auto">
              {selectorPath.segments.map((segment, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <span className="text-forge-text-muted text-[10px] mx-0.5" aria-hidden="true">
                      ›
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSegmentClick(idx)}
                    className={[
                      'text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors duration-150',
                      idx === selectorPath.segments.length - 1
                        ? 'bg-accent-primary/15 text-accent-primary font-semibold'
                        : 'text-forge-text-secondary hover:text-accent-primary hover:bg-accent-primary/5',
                    ].join(' ')}
                    title={segment.selector}
                  >
                    {segment.tag}
                    {segment.id && (
                      <span className="text-status-info">#{segment.id}</span>
                    )}
                    {segment.classes.length > 0 && (
                      <span className="text-accent-tertiary">
                        .{segment.classes[0]}
                        {segment.classes.length > 1 && `+${segment.classes.length - 1}`}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Match counter badge */}
          {matchCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-primary/5 border border-accent-primary/20">
              <div className="relative flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-accent-primary" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent-primary animate-ping opacity-75" />
              </div>
              <span className="text-xs font-semibold text-accent-primary">
                {matchCount} items selected
              </span>
            </div>
          )}

          {/* Manual selector override */}
          <div>
            {editingSelector ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectorDraft}
                  onChange={(e) => setSelectorDraft(e.target.value)}
                  onKeyDown={handleSelectorKeyDown}
                  onBlur={() => {
                    setSelectorDraft(manualSelector);
                    setEditingSelector(false);
                  }}
                  className="flex-1 bg-forge-bg-tertiary border border-accent-primary/40 rounded-md px-3 py-1.5 text-xs font-mono text-forge-text outline-none focus:ring-1 focus:ring-accent-primary/50 placeholder-forge-text-muted"
                  placeholder="Enter CSS selector..."
                  autoFocus
                />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectorSubmit();
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-accent-primary hover:brightness-110 transition-all"
                >
                  Apply
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingSelector(true)}
                className="flex items-center gap-1.5 text-[10px] text-forge-text-muted hover:text-accent-primary transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit CSS selector manually
              </button>
            )}
          </div>
        </div>
      )}

      {/* Next button */}
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
        Next: Configure Columns
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default React.memo(SelectListStep);
