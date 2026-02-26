/**
 * ColumnConfig -- Column configuration dropdown/panel for the DataForge data table.
 *
 * Features:
 * - List of all columns with checkboxes (show/hide)
 * - Drag to reorder
 * - Click column name to rename inline
 * - Type selector dropdown per column
 * - "Add Column" button
 * - "Reset" button to restore defaults
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DataType } from '@/types/extraction';
import type { ColumnDef } from '@/types/table';
import { useDataTableStore } from './useDataTableStore';
import { generatePrefixedId } from '@/utils/id';

// ---------------------------------------------------------------------------
// Data type options
// ---------------------------------------------------------------------------

const DATA_TYPES: { value: DataType; label: string; icon: string }[] = [
  { value: 'text', label: 'Text', icon: 'T' },
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'price', label: 'Price', icon: '$' },
  { value: 'url', label: 'URL', icon: '\u{1F517}' },
  { value: 'image', label: 'Image', icon: '\u{1F5BC}' },
  { value: 'email', label: 'Email', icon: '@' },
  { value: 'date', label: 'Date', icon: '\u{1F4C5}' },
  { value: 'rating', label: 'Rating', icon: '\u2605' },
  { value: 'phone', label: 'Phone', icon: '\u260E' },
  { value: 'location', label: 'Location', icon: '\u{1F4CD}' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ColumnConfig: React.FC = () => {
  const columns = useDataTableStore((s) => s.columns);
  const columnOrder = useDataTableStore((s) => s.columnOrder);
  const setColumnOrder = useDataTableStore((s) => s.setColumnOrder);
  const toggleColumnVisibility = useDataTableStore((s) => s.toggleColumnVisibility);
  const renameColumn = useDataTableStore((s) => s.renameColumn);
  const updateColumn = useDataTableStore((s) => s.updateColumn);
  const addColumn = useDataTableStore((s) => s.addColumn);
  const setColumns = useDataTableStore((s) => s.setColumns);
  const setColumnConfigOpen = useDataTableStore((s) => s.setColumnConfigOpen);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [typeDropdownId, setTypeDropdownId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<DataType>('text');

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const renameInputRef = useRef<HTMLInputElement>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);

  // Ordered columns list based on columnOrder
  const orderedColumns = columnOrder
    .map((id) => columns.find((c) => c.id === id))
    .filter((c): c is ColumnDef => c !== undefined);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Focus new column name input
  useEffect(() => {
    if (showAddForm && newNameInputRef.current) {
      newNameInputRef.current.focus();
    }
  }, [showAddForm]);

  // ---- Rename handlers ----

  const handleStartRename = useCallback((col: ColumnDef) => {
    setRenamingId(col.id);
    setRenameValue(col.name);
  }, []);

  const handleCommitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      renameColumn(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, renameColumn]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCommitRename();
      else if (e.key === 'Escape') {
        setRenamingId(null);
        setRenameValue('');
      }
      e.stopPropagation();
    },
    [handleCommitRename],
  );

  // ---- Add column ----

  const handleAddColumn = useCallback(() => {
    if (!newColumnName.trim()) return;
    const col: ColumnDef = {
      id: generatePrefixedId('col'),
      name: newColumnName.trim(),
      dataType: newColumnType,
      width: 150,
      visible: true,
      sortable: true,
      filterable: true,
    };
    addColumn(col);
    setNewColumnName('');
    setNewColumnType('text');
    setShowAddForm(false);
  }, [newColumnName, newColumnType, addColumn]);

  // ---- Reset ----

  const handleReset = useCallback(() => {
    // Reset visibility and width to defaults
    const reset = columns.map((c) => ({ ...c, visible: true, width: 150 }));
    setColumns(reset);
  }, [columns, setColumns]);

  // ---- Drag to reorder ----

  const handleDragStart = useCallback((_e: React.DragEvent, index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (index !== dragIndex) setDragOverIndex(index);
    },
    [dragIndex],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === targetIndex) return;

      const newOrder = [...columnOrder];
      const [moved] = newOrder.splice(dragIndex, 1);
      newOrder.splice(targetIndex, 0, moved);
      setColumnOrder(newOrder);
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, columnOrder, setColumnOrder],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // Close type dropdown on outside click
  useEffect(() => {
    if (!typeDropdownId) return;
    const handler = (e: MouseEvent) => {
      // Simple: close on any click
      setTypeDropdownId(null);
    };
    // Delay to avoid closing immediately
    const timer = setTimeout(() => window.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handler);
    };
  }, [typeDropdownId]);

  return (
    <div className="absolute top-0 right-0 z-40 w-[300px] h-full bg-forge-bg-secondary border-l border-forge-border shadow-xl animate-slide-in-right overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-forge-border/40">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
          <h3 className="text-sm font-semibold text-forge-text">Columns</h3>
          <span className="text-[10px] text-forge-text-muted/50">
            {columns.filter((c) => c.visible).length}/{columns.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setColumnConfigOpen(false)}
          className="flex items-center justify-center w-6 h-6 rounded text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary transition-colors"
          aria-label="Close column config"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Column list */}
      <div className="px-2 py-2 space-y-0.5">
        {orderedColumns.map((col, idx) => (
          <div
            key={col.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={[
              'flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-100 cursor-grab active:cursor-grabbing group',
              dragOverIndex === idx
                ? 'bg-accent-primary/10 border border-accent-primary/30'
                : 'border border-transparent hover:bg-forge-bg-tertiary/30',
              dragIndex === idx && 'opacity-40',
              !col.visible && 'opacity-50',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* Drag handle */}
            <div className="flex-shrink-0 text-forge-text-muted/20 group-hover:text-forge-text-muted/40">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="9" cy="6" r="2" />
                <circle cx="15" cy="6" r="2" />
                <circle cx="9" cy="12" r="2" />
                <circle cx="15" cy="12" r="2" />
                <circle cx="9" cy="18" r="2" />
                <circle cx="15" cy="18" r="2" />
              </svg>
            </div>

            {/* Visibility checkbox */}
            <button
              type="button"
              onClick={() => toggleColumnVisibility(col.id)}
              className={[
                'flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors',
                col.visible
                  ? 'bg-accent-primary/20 border-accent-primary/50 text-accent-primary'
                  : 'bg-forge-bg border-forge-border/40 text-transparent',
              ].join(' ')}
              aria-label={`${col.visible ? 'Hide' : 'Show'} column ${col.name}`}
            >
              {col.visible && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Column name (click to rename) */}
            {renamingId === col.id ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleCommitRename}
                className="flex-1 bg-forge-bg border border-accent-primary rounded px-1.5 py-0.5 text-xs text-forge-text outline-none min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 text-xs text-forge-text truncate cursor-text hover:text-accent-primary transition-colors"
                onClick={() => handleStartRename(col)}
                title="Click to rename"
              >
                {col.name}
              </span>
            )}

            {/* Type selector */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTypeDropdownId(typeDropdownId === col.id ? null : col.id);
                }}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono text-forge-text-muted/50 bg-forge-bg-tertiary/30 hover:bg-forge-bg-tertiary/60 hover:text-forge-text-muted transition-colors uppercase"
                title={`Type: ${col.dataType}`}
              >
                {col.dataType.slice(0, 4)}
              </button>

              {/* Type dropdown */}
              {typeDropdownId === col.id && (
                <div
                  className="absolute right-0 top-full mt-1 w-[130px] rounded-lg border border-forge-border bg-forge-bg-secondary shadow-xl py-1 z-50 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  {DATA_TYPES.map((dt) => (
                    <button
                      key={dt.value}
                      className={[
                        'w-full text-left px-3 py-1 text-xs flex items-center gap-2 hover:bg-accent-primary/10 transition-colors',
                        col.dataType === dt.value
                          ? 'text-accent-primary font-semibold'
                          : 'text-forge-text',
                      ].join(' ')}
                      onClick={() => {
                        updateColumn(col.id, { dataType: dt.value });
                        setTypeDropdownId(null);
                      }}
                    >
                      <span className="w-4 text-center text-[10px]">{dt.icon}</span>
                      {dt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add column form */}
      <div className="px-3 py-2 border-t border-forge-border/20">
        {showAddForm ? (
          <div className="space-y-2 animate-fade-in">
            <div>
              <label className="block text-[10px] text-forge-text-muted mb-1">Column Name</label>
              <input
                ref={newNameInputRef}
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn();
                  if (e.key === 'Escape') setShowAddForm(false);
                  e.stopPropagation();
                }}
                placeholder="Column name..."
                className="w-full h-7 bg-forge-bg border border-forge-border/50 rounded px-2 text-xs text-forge-text outline-none placeholder:text-forge-text-muted/30 focus:border-accent-primary/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-forge-text-muted mb-1">Type</label>
              <select
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value as DataType)}
                className="w-full h-7 bg-forge-bg border border-forge-border/50 rounded px-2 text-xs text-forge-text outline-none focus:border-accent-primary/50 appearance-none cursor-pointer"
              >
                {DATA_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
                className={[
                  'flex-1 h-7 rounded text-xs font-semibold transition-all',
                  newColumnName.trim()
                    ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/25'
                    : 'bg-forge-bg-tertiary/30 text-forge-text-muted/30 border border-forge-border/20 cursor-not-allowed',
                ].join(' ')}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewColumnName('');
                }}
                className="flex-1 h-7 rounded text-xs text-forge-text-muted border border-forge-border/30 hover:bg-forge-bg-tertiary/30 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full h-8 rounded text-xs text-accent-primary font-semibold flex items-center justify-center gap-1.5 border border-accent-primary/20 hover:bg-accent-primary/10 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Column
          </button>
        )}
      </div>

      {/* Reset button */}
      <div className="px-3 py-2 border-t border-forge-border/20">
        <button
          type="button"
          onClick={handleReset}
          className="w-full h-7 rounded text-[10px] text-forge-text-muted/50 hover:text-forge-text-muted flex items-center justify-center gap-1.5 border border-forge-border/20 hover:bg-forge-bg-tertiary/30 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default ColumnConfig;
