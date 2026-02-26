/**
 * VirtualizedBody -- Custom virtual scrolling table body for DataForge.
 *
 * Features:
 * - Only renders visible rows + 10-row buffer above and below
 * - Uses position:absolute + transform:translateY for row positioning
 * - Calculates visible range from scroll position
 * - Fixed row height of 36px
 * - Uses requestAnimationFrame for scroll event handling (60fps)
 * - Exports ref for external scroll control
 * - Supports 10,000+ rows without performance degradation
 * - Keyboard navigation: Arrow keys, Enter, Escape
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ColumnDef } from '@/types/table';
import type { Row } from '@/types/extraction';
import { useDataTableStore } from './useDataTableStore';
import TableRow from './TableRow';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROW_HEIGHT = 36;
const BUFFER_ROWS = 10;

// ---------------------------------------------------------------------------
// Public ref interface
// ---------------------------------------------------------------------------

export interface VirtualizedBodyHandle {
  /** Scroll to a specific row index */
  scrollToRow: (index: number) => void;
  /** Scroll to top */
  scrollToTop: () => void;
  /** Scroll to bottom */
  scrollToBottom: () => void;
  /** Get the underlying scroll container */
  getScrollContainer: () => HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VirtualizedBodyProps {
  rows: Row[];
  columns: ColumnDef[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VirtualizedBody = forwardRef<VirtualizedBodyHandle, VirtualizedBodyProps>(
  ({ rows, columns }, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);

    const activeCell = useDataTableStore((s) => s.activeCell);
    const setActiveCell = useDataTableStore((s) => s.setActiveCell);
    const editingCell = useDataTableStore((s) => s.editingCell);
    const startEditing = useDataTableStore((s) => s.startEditing);
    const cancelEdit = useDataTableStore((s) => s.cancelEdit);

    // Track scroll position for visible range calculation
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Total scrollable height
    const totalHeight = rows.length * ROW_HEIGHT;

    // Calculate visible range
    const visibleRange = useMemo(() => {
      const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
      const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT);
      const endIndex = Math.min(rows.length - 1, Math.floor(scrollTop / ROW_HEIGHT) + visibleCount + BUFFER_ROWS);
      return { startIndex, endIndex };
    }, [scrollTop, containerHeight, rows.length]);

    // Rows to render
    const visibleRows = useMemo(() => {
      const result: { row: Row; index: number }[] = [];
      for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
        if (rows[i]) {
          result.push({ row: rows[i], index: i });
        }
      }
      return result;
    }, [rows, visibleRange]);

    // ---- Scroll handler with requestAnimationFrame ----

    const handleScroll = useCallback(() => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          setScrollTop(scrollContainerRef.current.scrollTop);
        }
        rafRef.current = null;
      });
    }, []);

    // ---- Observe container resize ----

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      setContainerHeight(container.clientHeight);

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });
      observer.observe(container);

      return () => {
        observer.disconnect();
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }, []);

    // ---- Keyboard navigation ----

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        // Don't handle keys while editing (the cell input handles them)
        if (editingCell) return;

        if (!activeCell) return;

        const currentRowIdx = rows.findIndex((r) => r.id === activeCell.rowId);
        const currentColIdx = columns.findIndex((c) => c.id === activeCell.columnId);
        if (currentRowIdx === -1 || currentColIdx === -1) return;

        let newRowIdx = currentRowIdx;
        let newColIdx = currentColIdx;
        let handled = false;

        switch (e.key) {
          case 'ArrowUp':
            newRowIdx = Math.max(0, currentRowIdx - 1);
            handled = true;
            break;
          case 'ArrowDown':
            newRowIdx = Math.min(rows.length - 1, currentRowIdx + 1);
            handled = true;
            break;
          case 'ArrowLeft':
            newColIdx = Math.max(0, currentColIdx - 1);
            handled = true;
            break;
          case 'ArrowRight':
            newColIdx = Math.min(columns.length - 1, currentColIdx + 1);
            handled = true;
            break;
          case 'Tab':
            if (e.shiftKey) {
              newColIdx = currentColIdx - 1;
              if (newColIdx < 0) {
                newColIdx = columns.length - 1;
                newRowIdx = Math.max(0, currentRowIdx - 1);
              }
            } else {
              newColIdx = currentColIdx + 1;
              if (newColIdx >= columns.length) {
                newColIdx = 0;
                newRowIdx = Math.min(rows.length - 1, currentRowIdx + 1);
              }
            }
            handled = true;
            break;
          case 'Enter':
            // Start editing the active cell
            if (activeCell) {
              const row = rows[currentRowIdx];
              const col = columns[currentColIdx];
              const val = row.data[col.id];
              startEditing(activeCell, val == null ? '' : String(val));
              handled = true;
            }
            break;
          case 'Escape':
            cancelEdit();
            handled = true;
            break;
          case 'Home':
            if (e.ctrlKey) {
              newRowIdx = 0;
              newColIdx = 0;
            } else {
              newColIdx = 0;
            }
            handled = true;
            break;
          case 'End':
            if (e.ctrlKey) {
              newRowIdx = rows.length - 1;
              newColIdx = columns.length - 1;
            } else {
              newColIdx = columns.length - 1;
            }
            handled = true;
            break;
          case 'PageUp':
            newRowIdx = Math.max(0, currentRowIdx - Math.floor(containerHeight / ROW_HEIGHT));
            handled = true;
            break;
          case 'PageDown':
            newRowIdx = Math.min(
              rows.length - 1,
              currentRowIdx + Math.floor(containerHeight / ROW_HEIGHT),
            );
            handled = true;
            break;
        }

        if (handled) {
          e.preventDefault();
          if (newRowIdx !== currentRowIdx || newColIdx !== currentColIdx) {
            const newRow = rows[newRowIdx];
            const newCol = columns[newColIdx];
            if (newRow && newCol) {
              setActiveCell({ rowId: newRow.id, columnId: newCol.id });

              // Ensure the row is visible by scrolling if needed
              const container = scrollContainerRef.current;
              if (container) {
                const rowTop = newRowIdx * ROW_HEIGHT;
                const rowBottom = rowTop + ROW_HEIGHT;
                const viewTop = container.scrollTop;
                const viewBottom = viewTop + container.clientHeight;

                if (rowTop < viewTop) {
                  container.scrollTop = rowTop;
                } else if (rowBottom > viewBottom) {
                  container.scrollTop = rowBottom - container.clientHeight;
                }
              }
            }
          }
        }
      },
      [activeCell, editingCell, rows, columns, containerHeight, setActiveCell, startEditing, cancelEdit],
    );

    // ---- Imperative handle ----

    useImperativeHandle(
      ref,
      () => ({
        scrollToRow: (index: number) => {
          const container = scrollContainerRef.current;
          if (container) {
            const targetScroll = Math.max(0, index * ROW_HEIGHT - containerHeight / 2);
            container.scrollTop = targetScroll;
          }
        },
        scrollToTop: () => {
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        },
        scrollToBottom: () => {
          scrollContainerRef.current?.scrollTo({ top: totalHeight, behavior: 'smooth' });
        },
        getScrollContainer: () => scrollContainerRef.current,
      }),
      [containerHeight, totalHeight],
    );

    return (
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent focus:outline-none"
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="rowgroup"
      >
        {/* Spacer to create the full scrollable height */}
        <div
          className="relative w-full"
          style={{ height: totalHeight, minHeight: '100%' }}
        >
          {/* Render only visible rows, absolutely positioned */}
          {visibleRows.map(({ row, index }) => (
            <TableRow
              key={row.id}
              row={row}
              columns={columns}
              rowIndex={index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: ROW_HEIGHT,
                transform: `translateY(${index * ROW_HEIGHT}px)`,
                willChange: 'transform',
              }}
            />
          ))}

          {/* Empty state when no rows match (but we have rows in the store) */}
          {rows.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-forge-text-muted/50 gap-3 py-16">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="text-sm">No rows match the current filters</span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

VirtualizedBody.displayName = 'VirtualizedBody';

export default VirtualizedBody;
export { ROW_HEIGHT };
