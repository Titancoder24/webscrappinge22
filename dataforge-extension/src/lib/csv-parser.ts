/**
 * CSV generation and parsing for DataForge.
 *
 * Features:
 * - Configurable delimiter, encoding, and quoting strategy
 * - Handles edge cases: embedded commas, quotes, newlines, Unicode
 * - BOM support for UTF-8 and UTF-16
 * - RFC 4180 compliant generation
 * - Streaming-friendly row-by-row parsing
 *
 * Zero dependencies.
 */

import type { Row } from '../types/extraction';
import type { ColumnDef } from '../types/table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CSVGenerateOptions {
  /** Field delimiter (default: ","") */
  delimiter?: string;
  /** Character encoding hint (default: "utf-8") */
  encoding?: string;
  /** Whether to include a header row (default: true) */
  includeHeaders?: boolean;
  /** Quote character (default: '"') */
  quoteChar?: string;
  /** Line terminator (default: "\r\n" per RFC 4180) */
  lineTerminator?: string;
  /** Force-quote all fields regardless of content (default: false) */
  quoteAll?: boolean;
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether a field value requires quoting.
 * A field must be quoted if it contains the delimiter, the quote character,
 * a newline (\n or \r), or leading/trailing whitespace.
 */
function needsQuoting(
  value: string,
  delimiter: string,
  quoteChar: string,
): boolean {
  if (value.length === 0) return false;
  if (value.includes(delimiter)) return true;
  if (value.includes(quoteChar)) return true;
  if (value.includes('\n') || value.includes('\r')) return true;
  if (value[0] === ' ' || value[0] === '\t') return true;
  if (value[value.length - 1] === ' ' || value[value.length - 1] === '\t') return true;
  return false;
}

/**
 * Escape a field value for CSV output.
 * Doubles any embedded quote characters and wraps in quotes if needed.
 */
function escapeField(
  value: string,
  delimiter: string,
  quoteChar: string,
  quoteAll: boolean,
): string {
  if (quoteAll || needsQuoting(value, delimiter, quoteChar)) {
    const escaped = value.replace(
      new RegExp(escapeRegExp(quoteChar), 'g'),
      quoteChar + quoteChar,
    );
    return quoteChar + escaped + quoteChar;
  }
  return value;
}

/** Escape special regex characters in a string. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Convert a cell value to its string representation. */
function cellToString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(value);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Public API: Generation
// ---------------------------------------------------------------------------

/**
 * Generate a CSV string from rows and column definitions.
 *
 * @param rows - Data rows to export
 * @param columns - Column definitions (order determines column order)
 * @param options - Generation options
 * @returns CSV-formatted string (without BOM -- caller adds if needed)
 */
export function generateCSV(
  rows: Row[],
  columns: ColumnDef[],
  options: CSVGenerateOptions = {},
): string {
  const delimiter = options.delimiter ?? ',';
  const quoteChar = options.quoteChar ?? '"';
  const lineTerminator = options.lineTerminator ?? '\r\n';
  const includeHeaders = options.includeHeaders ?? true;
  const quoteAll = options.quoteAll ?? false;

  if (columns.length === 0) return '';

  const lines: string[] = [];

  // Header row
  if (includeHeaders) {
    const headerFields = columns.map((col) =>
      escapeField(col.name, delimiter, quoteChar, quoteAll),
    );
    lines.push(headerFields.join(delimiter));
  }

  // Data rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fields = columns.map((col) => {
      const raw = cellToString(row.data[col.id]);
      return escapeField(raw, delimiter, quoteChar, quoteAll);
    });
    lines.push(fields.join(delimiter));
  }

  return lines.join(lineTerminator);
}

// ---------------------------------------------------------------------------
// Public API: Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a CSV string into headers and rows.
 *
 * Implements a proper state-machine parser that handles:
 * - Quoted fields with embedded delimiters, quotes, and newlines
 * - Both \r\n and \n line terminators
 * - Empty fields and trailing delimiters
 *
 * @param text - Raw CSV text to parse
 * @param delimiter - Field delimiter (default: ",")
 * @returns Parsed headers (first row) and data rows
 */
export function parseCSV(
  text: string,
  delimiter: string = ',',
): CSVParseResult {
  if (!text || text.trim().length === 0) {
    return { headers: [], rows: [] };
  }

  // Strip BOM if present
  let input = text;
  if (input.charCodeAt(0) === 0xFEFF) {
    input = input.slice(1);
  }

  const allRows = parseCSVRows(input, delimiter);

  if (allRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = allRows[0];
  const rows = allRows.slice(1);

  return { headers, rows };
}

/**
 * State-machine CSV row parser.
 * Returns all rows including the header row.
 */
function parseCSVRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote (double-quote)
        if (i + 1 < len && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      // Regular character inside quotes
      currentField += ch;
      i++;
      continue;
    }

    // Not in quotes
    if (ch === '"' && currentField.length === 0) {
      // Start of quoted field
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === delimiter[0] && text.slice(i, i + delimiter.length) === delimiter) {
      // Field delimiter
      currentRow.push(currentField);
      currentField = '';
      i += delimiter.length;
      continue;
    }

    if (ch === '\r') {
      // Handle \r\n or bare \r
      currentRow.push(currentField);
      currentField = '';
      rows.push(currentRow);
      currentRow = [];
      if (i + 1 < len && text[i + 1] === '\n') {
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (ch === '\n') {
      // Line feed
      currentRow.push(currentField);
      currentField = '';
      rows.push(currentRow);
      currentRow = [];
      i++;
      continue;
    }

    // Regular character
    currentField += ch;
    i++;
  }

  // Flush last field / row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}
