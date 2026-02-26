import React, { useCallback, useState, useMemo } from 'react';
import { useStore } from '../../../store';
import { getActiveTab, sendTabMessage } from '../../../../utils/chrome-api';
import type { DetectedField } from '../../../../types/extraction';
import { generatePrefixedId } from '../../../../utils/id';
import ColumnChip from './ColumnChip';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ColumnMapperProps {
  /** Go to next step */
  onNext: () => void;
  /** Go back to previous step */
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ColumnMapper: React.FC<ColumnMapperProps> = ({ onNext, onBack }) => {
  const fields = useStore((s) => s.fields);
  const toggleField = useStore((s) => s.toggleField);
  const renameField = useStore((s) => s.renameField);
  const removeField = useStore((s) => s.removeField);
  const reorderFields = useStore((s) => s.reorderFields);
  const addCustomField = useStore((s) => s.addCustomField);
  const setError = useStore((s) => s.setError);

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [addingCustom, setAddingCustom] = useState(false);

  const enabledFields = useMemo(() => fields.filter((f) => f.enabled), [fields]);

  // -----------------------------------------------------------------------
  // Drag-and-drop
  // -----------------------------------------------------------------------

  const handleDragStart = useCallback((index: number) => {
    setDragFromIndex(index);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragFromIndex !== null && dragOverIndex !== null && dragFromIndex !== dragOverIndex) {
      reorderFields(dragFromIndex, dragOverIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, [dragFromIndex, dragOverIndex, reorderFields]);

  // -----------------------------------------------------------------------
  // Add custom field (click element on page)
  // -----------------------------------------------------------------------

  const handleAddCustomField = useCallback(async () => {
    setAddingCustom(true);

    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        setError('No active tab found');
        setAddingCustom(false);
        return;
      }

      // Send activation message for element picking
      await sendTabMessage(tab.id, {
        type: 'ACTIVATE_SELECTION_MODE',
        tool: 'list-extractor-field',
      });

      // Listen for element click response
      const handleMessage = (message: unknown) => {
        const msg = message as { type?: string; selector?: string };
        if (msg.type === 'ELEMENT_CLICKED') {
          const newField: DetectedField = {
            id: generatePrefixedId('fld'),
            name: 'Custom Field',
            relativeSelector: msg.selector ?? '',
            sampleValues: [],
            dataType: 'text',
            confidence: 1,
            enabled: true,
          };
          addCustomField(newField);
          setAddingCustom(false);
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);

      // Auto-cancel after 30s
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(handleMessage);
        setAddingCustom(false);
      }, 30000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add custom field');
      setAddingCustom(false);
    }
  }, [addCustomField, setError]);

  // -----------------------------------------------------------------------
  // Preview table data (first 5 rows)
  // -----------------------------------------------------------------------

  const previewRows = useMemo(() => {
    if (enabledFields.length === 0) return [];

    // Build rows from sample values
    const maxRows = Math.min(
      5,
      Math.max(...enabledFields.map((f) => f.sampleValues.length), 0),
    );

    return Array.from({ length: maxRows }, (_, rowIdx) =>
      enabledFields.reduce(
        (acc, field) => {
          acc[field.id] = field.sampleValues[rowIdx] ?? '--';
          return acc;
        },
        {} as Record<string, string>,
      ),
    );
  }, [enabledFields]);

  // Can proceed
  const canProceed = enabledFields.length > 0;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-forge-text">Configure Columns</h3>
          <p className="text-[10px] text-forge-text-muted mt-0.5">
            Toggle, rename, and reorder the fields to extract
          </p>
        </div>
        <span className="text-[10px] tabular-nums text-forge-text-muted px-2 py-1 rounded-full bg-forge-bg-tertiary">
          {enabledFields.length}/{fields.length} enabled
        </span>
      </div>

      {/* Field chips list */}
      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <div className="w-10 h-10 rounded-full bg-forge-bg-tertiary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forge-text-muted" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <p className="text-xs text-forge-text-muted text-center">
            No fields detected.<br />
            Go back and select a pattern first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {fields.map((field, idx) => (
            <ColumnChip
              key={field.id}
              field={field}
              index={idx}
              onToggle={toggleField}
              onRename={renameField}
              onRemove={removeField}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
              isDragOver={dragOverIndex === idx && dragFromIndex !== idx}
            />
          ))}
        </div>
      )}

      {/* Add custom field button */}
      <button
        type="button"
        onClick={handleAddCustomField}
        disabled={addingCustom}
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-forge-border text-xs font-medium text-forge-text-muted hover:text-accent-primary hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all duration-200 disabled:opacity-50"
      >
        {addingCustom ? (
          <>
            <div className="w-3.5 h-3.5 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
            Click an element on the page...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Custom Field
          </>
        )}
      </button>

      {/* Live preview table */}
      {previewRows.length > 0 && enabledFields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
            Preview ({previewRows.length} rows)
          </span>
          <div className="overflow-x-auto rounded-lg border border-forge-border">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-forge-bg-tertiary/50">
                  {enabledFields.map((field) => (
                    <th
                      key={field.id}
                      className="px-2 py-1.5 text-left font-semibold text-forge-text-muted uppercase tracking-wider whitespace-nowrap"
                    >
                      {field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-forge-border/50 hover:bg-forge-bg-secondary/50"
                  >
                    {enabledFields.map((field) => (
                      <td
                        key={field.id}
                        className="px-2 py-1 text-forge-text-secondary font-mono whitespace-nowrap truncate max-w-[120px]"
                      >
                        {row[field.id]?.length > 30
                          ? row[field.id].slice(0, 30) + '...'
                          : row[field.id]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          Next: Pagination
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default React.memo(ColumnMapper);
