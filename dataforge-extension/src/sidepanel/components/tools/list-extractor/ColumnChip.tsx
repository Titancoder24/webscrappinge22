import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { DetectedField, DataType } from '../../../../types/extraction';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ColumnChipProps {
  /** The field data */
  field: DetectedField;
  /** Toggle enabled state */
  onToggle: (id: string) => void;
  /** Rename the field */
  onRename: (id: string, name: string) => void;
  /** Remove the field entirely */
  onRemove: (id: string) => void;
  /** Index for drag-and-drop */
  index: number;
  /** Drag start handler */
  onDragStart?: (index: number) => void;
  /** Drag enter handler */
  onDragEnter?: (index: number) => void;
  /** Drag end handler */
  onDragEnd?: () => void;
  /** Whether this chip is being dragged over */
  isDragOver?: boolean;
}

// ---------------------------------------------------------------------------
// Type icon map
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<DataType, { emoji: string; color: string }> = {
  text: { emoji: '\uD83C\uDFF7\uFE0F', color: '#10B981' },   // tag
  price: { emoji: '\uD83D\uDCB0', color: '#F59E0B' },         // money bag
  url: { emoji: '\uD83D\uDD17', color: '#8B5CF6' },           // link
  image: { emoji: '\uD83D\uDDBC\uFE0F', color: '#EC4899' },   // picture
  rating: { emoji: '\u2B50', color: '#F59E0B' },               // star
  email: { emoji: '\uD83D\uDCE7', color: '#3B82F6' },         // email
  date: { emoji: '\uD83D\uDCC5', color: '#14B8A6' },          // calendar
  number: { emoji: '\uD83D\uDCDD', color: '#6366F1' },        // memo (description)
  phone: { emoji: '\uD83D\uDCDE', color: '#10B981' },         // phone
  location: { emoji: '\uD83D\uDCCD', color: '#EF4444' },      // pin
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ColumnChip: React.FC<ColumnChipProps> = ({
  field,
  onToggle,
  onRename,
  onRemove,
  index,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragOver = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const typeInfo = TYPE_ICONS[field.dataType] ?? TYPE_ICONS.text;
  const samplePreview = field.sampleValues[0] ?? '--';

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameClick = useCallback(() => {
    if (field.enabled) {
      setEditValue(field.name);
      setIsEditing(true);
    }
  }, [field.enabled, field.name]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== field.name) {
      onRename(field.id, trimmed);
    } else {
      setEditValue(field.name);
    }
    setIsEditing(false);
  }, [editValue, field.id, field.name, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        commitRename();
      } else if (e.key === 'Escape') {
        setEditValue(field.name);
        setIsEditing(false);
      }
    },
    [commitRename, field.name],
  );

  const handleToggle = useCallback(() => {
    onToggle(field.id);
  }, [field.id, onToggle]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(field.id);
    },
    [field.id, onRemove],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      onDragStart?.(index);
    },
    [index, onDragStart],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDragEnter?.(index);
    },
    [index, onDragEnter],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div
      className={[
        'group flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-200',
        'cursor-default select-none',
        field.enabled
          ? 'bg-forge-bg-secondary border-forge-border hover:border-accent-primary/40'
          : 'bg-forge-bg-secondary/50 border-forge-border/50 opacity-60',
        isDragOver ? 'border-accent-primary/60 bg-accent-primary/5 scale-[1.02]' : '',
      ].join(' ')}
      draggable
      onDragStart={handleDragStart}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div
        className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-70 transition-opacity"
        aria-hidden="true"
      >
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-forge-text-muted" />
          <div className="w-1 h-1 rounded-full bg-forge-text-muted" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-forge-text-muted" />
          <div className="w-1 h-1 rounded-full bg-forge-text-muted" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-forge-text-muted" />
          <div className="w-1 h-1 rounded-full bg-forge-text-muted" />
        </div>
      </div>

      {/* Type icon */}
      <span
        className="text-sm flex-shrink-0"
        title={field.dataType}
        aria-label={`Type: ${field.dataType}`}
      >
        {typeInfo.emoji}
      </span>

      {/* Name (click to edit) + sample preview */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            className="w-full bg-forge-bg-tertiary border border-accent-primary/50 rounded px-1.5 py-0.5 text-xs font-medium text-forge-text outline-none focus:ring-1 focus:ring-accent-primary/40"
            maxLength={40}
            aria-label="Field name"
          />
        ) : (
          <button
            type="button"
            onClick={handleNameClick}
            className="text-left text-xs font-medium text-forge-text truncate hover:text-accent-primary transition-colors"
            title="Click to rename"
          >
            {field.name}
          </button>
        )}
        <span className="text-[10px] text-forge-text-muted truncate font-mono">
          {samplePreview.length > 30 ? samplePreview.slice(0, 30) + '...' : samplePreview}
        </span>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={handleRemove}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-forge-text-muted hover:text-status-error hover:bg-status-error/10 transition-all opacity-0 group-hover:opacity-100"
        title="Remove field"
        aria-label={`Remove ${field.name}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={field.enabled}
        aria-label={`Toggle ${field.name}`}
        onClick={handleToggle}
        className={[
          'relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors duration-200',
          field.enabled ? 'bg-accent-primary' : 'bg-forge-border',
        ].join(' ')}
      >
        <div
          className={[
            'absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200',
            field.enabled ? 'translate-x-[16px]' : 'translate-x-[2px]',
          ].join(' ')}
        />
      </button>
    </div>
  );
};

export default React.memo(ColumnChip);
