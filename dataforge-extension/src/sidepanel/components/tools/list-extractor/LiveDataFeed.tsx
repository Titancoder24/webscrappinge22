import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Row, DetectedField } from '../../../../types/extraction';
import { truncateText } from '../../../../utils/format';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LiveDataFeedProps {
  /** All extracted rows (newest at end) */
  rows: Row[];
  /** Active fields for column headers */
  fields: DetectedField[];
  /** Max visible rows (default 5) */
  maxVisible?: number;
  /** Extra className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Internal row entry with animation state
// ---------------------------------------------------------------------------

interface FeedEntry {
  row: Row;
  key: string;
  isNew: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LiveDataFeed: React.FC<LiveDataFeedProps> = ({
  rows,
  fields,
  maxVisible = 5,
  className = '',
}) => {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const prevLenRef = useRef(0);

  const enabledFields = fields.filter((f) => f.enabled);

  // Update entries when rows change
  useEffect(() => {
    const prevLen = prevLenRef.current;
    const currentLen = rows.length;

    if (currentLen > prevLen) {
      // New rows arrived
      const tail = rows.slice(Math.max(0, currentLen - maxVisible));
      const newIds = new Set(rows.slice(prevLen).map((r) => r.id));

      setEntries(
        tail.map((row) => ({
          row,
          key: row.id,
          isNew: newIds.has(row.id),
        })),
      );

      // Clear "new" flag after animation
      const timer = setTimeout(() => {
        setEntries((prev) =>
          prev.map((e) => (e.isNew ? { ...e, isNew: false } : e)),
        );
      }, 600);

      prevLenRef.current = currentLen;
      return () => clearTimeout(timer);
    }

    prevLenRef.current = currentLen;
  }, [rows, maxVisible]);

  const getCellValue = useCallback((row: Row, field: DetectedField): string => {
    const val = row.data[field.name] ?? row.data[field.id];
    if (val == null) return '--';
    return truncateText(String(val), 28);
  }, []);

  if (entries.length === 0) {
    return (
      <div className={`text-center text-xs text-forge-text-muted py-4 ${className}`}>
        Waiting for data...
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-forge-border ${className}`}>
      {/* Mini header */}
      {enabledFields.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-bg-tertiary/50 border-b border-forge-border">
          {enabledFields.slice(0, 4).map((field) => (
            <span
              key={field.id}
              className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted truncate"
            >
              {field.name}
            </span>
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="relative">
        {entries.map((entry, idx) => {
          const isFirst = idx === 0 && entries.length >= maxVisible;

          return (
            <div
              key={entry.key}
              className={[
                'flex items-center gap-2 px-3 py-1.5 border-l-2 transition-all duration-200',
                entry.isNew
                  ? 'border-l-accent-primary bg-accent-primary/5 animate-slide-in-right'
                  : 'border-l-transparent',
                isFirst ? 'opacity-50' : 'opacity-100',
              ].join(' ')}
            >
              {enabledFields.slice(0, 4).map((field) => (
                <span
                  key={field.id}
                  className="flex-1 text-xs text-forge-text-secondary truncate font-mono"
                >
                  {getCellValue(entry.row, field)}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(LiveDataFeed);
