/**
 * FormulaBar -- Formula input bar for the DataForge data table.
 *
 * Appears when a cell is selected. Shows:
 * - Current cell reference (e.g., "A1")
 * - Input field for formula expressions with syntax highlighting
 * - Apply button to execute the formula
 * - Info tooltip showing available formulas
 *
 * Supported formulas:
 *   =CONCAT(A, " - ", B)
 *   =UPPER(A)
 *   =LOWER(A)
 *   =TRIM(A)
 *   =REPLACE(A, "old", "new")
 *   =EXTRACT_DOMAIN(A)
 *   =EXTRACT_NUMBER(A)
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDataTableStore } from './useDataTableStore';

// ---------------------------------------------------------------------------
// Formula keyword highlighting tokens
// ---------------------------------------------------------------------------

const FORMULA_KEYWORDS = [
  'CONCAT',
  'UPPER',
  'LOWER',
  'TRIM',
  'REPLACE',
  'EXTRACT_DOMAIN',
  'EXTRACT_NUMBER',
];

const FORMULA_DOCS = [
  { name: 'CONCAT(a, b, ...)', desc: 'Concatenate values or column references' },
  { name: 'UPPER(col)', desc: 'Convert text to uppercase' },
  { name: 'LOWER(col)', desc: 'Convert text to lowercase' },
  { name: 'TRIM(col)', desc: 'Remove leading/trailing whitespace' },
  { name: 'REPLACE(col, "old", "new")', desc: 'Replace all occurrences of a string' },
  { name: 'EXTRACT_DOMAIN(col)', desc: 'Extract hostname from URL' },
  { name: 'EXTRACT_NUMBER(col)', desc: 'Extract first number from text' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert column index to spreadsheet-style letter (0=A, 1=B, ..., 25=Z, 26=AA). */
function indexToLetter(index: number): string {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/** Simple syntax highlighting: wrap formula keywords in colored spans */
function highlightFormula(text: string): React.ReactNode[] {
  if (!text.startsWith('=')) {
    return [<span key="plain">{text}</span>];
  }

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Match '=' prefix
  parts.push(
    <span key={key++} className="text-accent-secondary font-bold">
      =
    </span>,
  );
  remaining = remaining.slice(1);

  // Match function name
  const funcMatch = remaining.match(/^(\w+)(\()/);
  if (funcMatch) {
    const funcName = funcMatch[1];
    const isKnown = FORMULA_KEYWORDS.includes(funcName.toUpperCase());
    parts.push(
      <span
        key={key++}
        className={isKnown ? 'text-accent-primary font-semibold' : 'text-status-warning'}
      >
        {funcName}
      </span>,
    );
    remaining = remaining.slice(funcName.length);
  }

  // Render remaining with string highlighting
  let i = 0;
  let buffer = '';
  while (i < remaining.length) {
    const ch = remaining[i];
    if (ch === '"' || ch === "'") {
      // Flush buffer
      if (buffer) {
        parts.push(<span key={key++}>{buffer}</span>);
        buffer = '';
      }
      // Find closing quote
      const quoteChar = ch;
      let str = ch;
      i++;
      while (i < remaining.length && remaining[i] !== quoteChar) {
        str += remaining[i];
        i++;
      }
      if (i < remaining.length) {
        str += remaining[i];
        i++;
      }
      parts.push(
        <span key={key++} className="text-accent-tertiary">
          {str}
        </span>,
      );
    } else if (ch === '(' || ch === ')' || ch === ',') {
      if (buffer) {
        parts.push(<span key={key++}>{buffer}</span>);
        buffer = '';
      }
      parts.push(
        <span key={key++} className="text-forge-text-muted">
          {ch}
        </span>,
      );
      i++;
    } else {
      buffer += ch;
      i++;
    }
  }
  if (buffer) {
    parts.push(<span key={key++}>{buffer}</span>);
  }

  return parts;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FormulaBar: React.FC = () => {
  const activeCell = useDataTableStore((s) => s.activeCell);
  const columns = useDataTableStore((s) => s.columns);
  const columnOrder = useDataTableStore((s) => s.columnOrder);
  const rows = useDataTableStore((s) => s.rows);
  const applyFormula = useDataTableStore((s) => s.applyFormula);
  const formulas = useDataTableStore((s) => s.formulas);

  const [formulaInput, setFormulaInput] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  // Current cell reference (e.g., "A1")
  const cellRef = useMemo(() => {
    if (!activeCell) return null;
    const colIdx = columnOrder.indexOf(activeCell.columnId);
    const rowIdx = rows.findIndex((r) => r.id === activeCell.rowId);
    if (colIdx === -1 || rowIdx === -1) return null;
    return `${indexToLetter(colIdx)}${rowIdx + 1}`;
  }, [activeCell, columnOrder, rows]);

  // Active column name
  const activeColumnName = useMemo(() => {
    if (!activeCell) return null;
    return columns.find((c) => c.id === activeCell.columnId)?.name ?? null;
  }, [activeCell, columns]);

  // Existing formula for active column
  const existingFormula = useMemo(() => {
    if (!activeCell) return '';
    return formulas.find((f) => f.columnId === activeCell.columnId)?.expression ?? '';
  }, [activeCell, formulas]);

  // Apply formula
  const handleApply = useCallback(() => {
    if (!activeCell || !formulaInput.trim()) return;
    setIsApplying(true);
    try {
      applyFormula(activeCell.columnId, formulaInput.trim());
    } finally {
      setTimeout(() => setIsApplying(false), 300);
    }
  }, [activeCell, formulaInput, applyFormula]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setFormulaInput('');
        inputRef.current?.blur();
      }
      e.stopPropagation();
    },
    [handleApply],
  );

  // Load existing formula when active cell changes
  React.useEffect(() => {
    setFormulaInput(existingFormula);
  }, [existingFormula]);

  if (!activeCell) return null;

  return (
    <div className="flex items-center h-8 px-2 gap-2 bg-forge-bg-secondary/80 border-b border-forge-border/40 shrink-0">
      {/* Cell reference badge */}
      <div className="flex-shrink-0 px-1.5 py-0.5 rounded bg-forge-bg-tertiary border border-forge-border/50 text-[10px] font-mono text-accent-primary font-bold min-w-[36px] text-center">
        {cellRef ?? '--'}
      </div>

      {/* Active column name */}
      {activeColumnName && (
        <span className="text-[10px] text-forge-text-muted/60 truncate max-w-[80px] flex-shrink-0">
          {activeColumnName}
        </span>
      )}

      {/* Formula icon */}
      <div className="flex-shrink-0 text-forge-text-muted/40">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
      </div>

      {/* Formula input with syntax highlight overlay */}
      <div className="relative flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={formulaInput}
          onChange={(e) => setFormulaInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="=FORMULA(column, ...)"
          className="w-full h-6 bg-transparent border border-forge-border/30 rounded px-2 py-0.5 text-xs text-forge-text font-mono outline-none placeholder:text-forge-text-muted/30 focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20"
          spellCheck={false}
          autoComplete="off"
        />
        {/* Syntax highlight overlay (visible only when input is not focused) */}
        {formulaInput && !document.activeElement?.isSameNode(inputRef.current) && (
          <div className="absolute inset-0 px-2 py-0.5 text-xs font-mono pointer-events-none flex items-center overflow-hidden">
            {highlightFormula(formulaInput)}
          </div>
        )}
      </div>

      {/* Apply button */}
      <button
        type="button"
        onClick={handleApply}
        disabled={!formulaInput.trim() || isApplying}
        className={[
          'flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold transition-all duration-150',
          'border border-accent-primary/30',
          formulaInput.trim()
            ? 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 active:scale-95'
            : 'bg-forge-bg-tertiary/30 text-forge-text-muted/30 cursor-not-allowed',
          isApplying && 'animate-pulse bg-accent-primary/30',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isApplying ? 'Applying...' : 'Apply'}
      </button>

      {/* Info button */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center justify-center w-6 h-6 rounded text-forge-text-muted/50 hover:text-accent-primary hover:bg-accent-primary/10 transition-colors duration-100"
          aria-label="Show formula help"
          title="Available formulas"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>

        {/* Info tooltip/panel */}
        {showInfo && (
          <div
            ref={infoRef}
            className="absolute right-0 top-full mt-1 w-[280px] rounded-lg border border-forge-border bg-forge-bg-secondary shadow-xl p-3 z-50 animate-scale-in"
          >
            <h4 className="text-xs font-semibold text-forge-text mb-2">Available Formulas</h4>
            <div className="space-y-1.5">
              {FORMULA_DOCS.map((f) => (
                <div key={f.name} className="flex flex-col gap-0.5">
                  <code className="text-[10px] font-mono text-accent-primary">={f.name}</code>
                  <span className="text-[10px] text-forge-text-muted/60">{f.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-forge-border/30">
              <p className="text-[9px] text-forge-text-muted/40">
                Use column names as references. Strings must be quoted with double quotes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormulaBar;
