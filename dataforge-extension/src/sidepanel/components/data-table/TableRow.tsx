/**
 * TableRow -- Individual row component for the DataForge data table.
 *
 * Features:
 * - React.memo for performance (only re-renders when its data changes)
 * - Alternating row backgrounds (subtle even/odd)
 * - Hover highlight
 * - Click to select (single), Ctrl+Click to toggle, Shift+Click for range
 * - Selected rows get emerald left border accent
 * - New rows during extraction: slide-in-right animation + brief emerald glow
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ColumnDef } from '@/types/table';
import type { Row } from '@/types/extraction';
import { useDataTableStore, type CellAddress } from './useDataTableStore';
import TableCell from './TableCell';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TableRowProps {
  row: Row;
  columns: ColumnDef[];
  rowIndex: number;
  style: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TableRow: React.FC<TableRowProps> = React.memo(
  ({ row, columns, rowIndex, style }) => {
    const selectRow = useDataTableStore((s) => s.selectRow);
    const selectedRowIds = useDataTableStore((s) => s.selectedRowIds);
    const activeCell = useDataTableStore((s) => s.activeCell);
    const editingCell = useDataTableStore((s) => s.editingCell);
    const newRowIds = useDataTableStore((s) => s.newRowIds);

    const isSelected = selectedRowIds.has(row.id);
    const isNew = newRowIds.has(row.id);

    const [glowing, setGlowing] = useState(isNew);
    const rowRef = useRef<HTMLDivElement>(null);

    // Handle new row glow animation
    useEffect(() => {
      if (isNew) {
        setGlowing(true);
        const timer = setTimeout(() => setGlowing(false), 1200);
        return () => clearTimeout(timer);
      }
    }, [isNew]);

    // ---- Click handlers ----

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.shiftKey) {
          e.preventDefault();
          selectRow(row.id, 'range');
        } else if (e.ctrlKey || e.metaKey) {
          selectRow(row.id, 'toggle');
        } else {
          selectRow(row.id, 'single');
        }
      },
      [row.id, selectRow],
    );

    // ---- Row classnames ----

    const isEven = rowIndex % 2 === 0;

    return (
      <div
        ref={rowRef}
        role="row"
        aria-rowindex={rowIndex + 2} // +2 because header is row 1 and aria is 1-indexed
        aria-selected={isSelected}
        className={[
          'flex items-stretch h-9 border-b border-forge-border/20',
          'transition-colors duration-75',
          // Alternating backgrounds
          isEven ? 'bg-transparent' : 'bg-forge-bg-secondary/30',
          // Hover
          'hover:bg-accent-primary/[0.04]',
          // Selection
          isSelected && 'bg-accent-primary/[0.08] hover:bg-accent-primary/[0.12]',
          // New row slide-in
          isNew && 'animate-slide-in-right',
          // Glow effect on new rows
          glowing && 'shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...style,
          // Selected rows: emerald left border
          borderLeft: isSelected ? '3px solid #10B981' : '3px solid transparent',
        }}
        onClick={handleClick}
        data-row-id={row.id}
      >
        {/* Row number indicator */}
        <div className="flex-shrink-0 w-10 flex items-center justify-center text-[10px] text-forge-text-muted/40 font-mono select-none border-r border-forge-border/20">
          {rowIndex + 1}
        </div>

        {/* Cells */}
        {columns.map((col) => {
          const cellAddr: CellAddress = { rowId: row.id, columnId: col.id };
          const isCellActive =
            activeCell?.rowId === row.id && activeCell?.columnId === col.id;
          const isCellEditing =
            editingCell?.rowId === row.id && editingCell?.columnId === col.id;

          return (
            <TableCell
              key={col.id}
              value={row.data[col.id] ?? null}
              column={col}
              rowId={row.id}
              isActive={isCellActive}
              isEditing={isCellEditing}
            />
          );
        })}
      </div>
    );
  },
  // Custom comparison: only re-render if relevant data changes
  (prev, next) => {
    if (prev.row !== next.row) return false;
    if (prev.rowIndex !== next.rowIndex) return false;
    if (prev.columns !== next.columns) return false;
    if (prev.style.transform !== next.style.transform) return false;
    return true;
  },
);

TableRow.displayName = 'TableRow';

export default TableRow;
