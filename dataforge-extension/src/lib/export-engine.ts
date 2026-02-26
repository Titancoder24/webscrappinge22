/**
 * ExportEngine -- Master export coordinator for DataForge.
 *
 * Accepts rows, column definitions, and export options, then dispatches
 * to the appropriate format handler (CSV, XLSX, JSON, clipboard, webhook).
 * Downloads are triggered via the chrome.downloads API when available,
 * otherwise falls back to programmatic link creation.
 */

import type { Row } from '../types/extraction';
import type { ColumnDef } from '../types/table';
import type { ExportOptions, ExportFormat } from '../types/export';
import { generateCSV } from './csv-parser';
import { generateXLSX } from './xlsx-writer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the default filename with a timestamp suffix. */
function buildFilename(base: string | undefined, format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const stem = base ?? `dataforge-export-${timestamp}`;

  const extMap: Record<ExportFormat, string> = {
    csv: '.csv',
    xlsx: '.xlsx',
    json: '.json',
    'clipboard-html': '',
    'clipboard-tsv': '',
    'clipboard-text': '',
    webhook: '',
    'google-sheets': '',
  };

  const ext = extMap[format] ?? '';
  // Avoid double extension if user already supplied one
  if (ext && !stem.endsWith(ext)) {
    return stem + ext;
  }
  return stem;
}

/** Filter and order columns based on export options. */
function resolveColumns(
  allColumns: ColumnDef[],
  selectedIds?: string[],
): ColumnDef[] {
  if (!selectedIds || selectedIds.length === 0) {
    return allColumns.filter((c) => c.visible);
  }
  const idSet = new Set(selectedIds);
  // Maintain the order specified in selectedIds
  return selectedIds
    .map((id) => allColumns.find((c) => c.id === id))
    .filter((c): c is ColumnDef => c !== undefined);
}

/** Extract column values from rows honouring column selection. */
function projectRows(
  rows: Row[],
  columns: ColumnDef[],
): Record<string, string | number | null>[] {
  const colIds = columns.map((c) => c.id);
  return rows.map((row) => {
    const projected: Record<string, string | number | null> = {};
    for (const id of colIds) {
      projected[id] = row.data[id] ?? null;
    }
    return projected;
  });
}

/** Convert rows to JSON string using the chosen format. */
function generateJSON(
  rows: Row[],
  columns: ColumnDef[],
  options: ExportOptions,
): string {
  const cols = resolveColumns(columns, options.columns);
  const data = projectRows(rows, cols);

  if (options.jsonFormat === 'nested') {
    // Nested: array of objects keyed by column name
    const named = data.map((row) => {
      const obj: Record<string, string | number | null> = {};
      for (const col of cols) {
        obj[col.name] = row[col.id] ?? null;
      }
      return obj;
    });
    return JSON.stringify(named, null, 2);
  }

  // Array format: [headers, ...valueRows]
  const headers = cols.map((c) => c.name);
  const valueRows = data.map((row) => cols.map((c) => row[c.id]));
  return JSON.stringify(options.includeHeaders ? [headers, ...valueRows] : valueRows, null, 2);
}

/** Copy text to the clipboard (works in extension contexts). */
async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for service-worker / older contexts
  throw new Error('Clipboard API not available in this context');
}

/** Generate an HTML table string for clipboard-html. */
function generateHTMLTable(
  rows: Row[],
  columns: ColumnDef[],
  includeHeaders: boolean,
): string {
  const cols = columns;
  const parts: string[] = ['<table>'];

  if (includeHeaders) {
    parts.push('<thead><tr>');
    for (const col of cols) {
      parts.push(`<th>${escapeHTML(col.name)}</th>`);
    }
    parts.push('</tr></thead>');
  }

  parts.push('<tbody>');
  for (const row of rows) {
    parts.push('<tr>');
    for (const col of cols) {
      const val = row.data[col.id];
      parts.push(`<td>${escapeHTML(String(val ?? ''))}</td>`);
    }
    parts.push('</tr>');
  }
  parts.push('</tbody></table>');

  return parts.join('');
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Push data to a webhook URL. */
async function pushToWebhook(
  rows: Row[],
  columns: ColumnDef[],
  options: ExportOptions,
): Promise<void> {
  if (!options.webhookUrl) {
    throw new Error('Webhook URL is required for webhook export');
  }

  const cols = resolveColumns(columns, options.columns);
  const payload = projectRows(rows, cols).map((row) => {
    const obj: Record<string, string | number | null> = {};
    for (const col of cols) {
      obj[col.name] = row[col.id] ?? null;
    }
    return obj;
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.webhookHeaders ?? {}),
  };

  const response = await fetch(options.webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source: 'DataForge',
      exportedAt: new Date().toISOString(),
      rowCount: rows.length,
      columns: cols.map((c) => c.name),
      data: payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
  }
}

/** Trigger a download using the chrome.downloads API or fallback. */
async function triggerDownload(blob: Blob, filename: string): Promise<void> {
  // Prefer chrome.downloads (available in background / side panel contexts)
  if (
    typeof chrome !== 'undefined' &&
    chrome.downloads &&
    typeof chrome.downloads.download === 'function'
  ) {
    const url = URL.createObjectURL(blob);
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.downloads.download(
          { url, filename, saveAs: true },
          (downloadId) => {
            const err = chrome.runtime.lastError?.message;
            if (err) {
              reject(new Error(`Download failed: ${err}`));
            } else if (downloadId === undefined) {
              reject(new Error('Download returned no ID'));
            } else {
              resolve();
            }
          },
        );
      });
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }

  // Fallback: create an anchor element and click it
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Slight delay before cleanup so the browser can initiate the download
    await new Promise((r) => setTimeout(r, 100));
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Export data in the requested format.
 *
 * For file-based formats (csv, xlsx, json) this triggers a download.
 * For clipboard formats the data is copied to the clipboard.
 * For webhook the data is POSTed to the configured URL.
 *
 * @throws Error if the format is unsupported or the operation fails.
 */
export async function exportData(
  rows: Row[],
  columns: ColumnDef[],
  options: ExportOptions,
): Promise<void> {
  if (!rows || rows.length === 0) {
    throw new Error('No data to export');
  }

  if (!columns || columns.length === 0) {
    throw new Error('No columns defined for export');
  }

  const cols = resolveColumns(columns, options.columns);
  if (cols.length === 0) {
    throw new Error('No visible or selected columns to export');
  }

  const format = options.format;

  switch (format) {
    // ----- File downloads ------------------------------------------------
    case 'csv': {
      const csv = generateCSV(rows, cols, {
        delimiter: options.csvDelimiter || ',',
        encoding: options.csvEncoding || 'utf-8',
        includeHeaders: options.includeHeaders,
      });
      const bom = options.csvEncoding === 'utf-16' ? '\uFEFF' : '\uFEFF'; // BOM for both
      const content = bom + csv;
      const mimeType =
        options.csvEncoding === 'utf-16'
          ? 'text/csv; charset=utf-16'
          : 'text/csv; charset=utf-8';
      const blob = new Blob([content], { type: mimeType });
      const filename = buildFilename(options.filename, 'csv');
      await triggerDownload(blob, filename);
      break;
    }

    case 'xlsx': {
      const blob = generateXLSX(rows, cols);
      const filename = buildFilename(options.filename, 'xlsx');
      await triggerDownload(blob, filename);
      break;
    }

    case 'json': {
      const json = generateJSON(rows, columns, options);
      const blob = new Blob([json], { type: 'application/json; charset=utf-8' });
      const filename = buildFilename(options.filename, 'json');
      await triggerDownload(blob, filename);
      break;
    }

    // ----- Clipboard -----------------------------------------------------
    case 'clipboard-tsv': {
      const tsv = generateCSV(rows, cols, {
        delimiter: '\t',
        encoding: 'utf-8',
        includeHeaders: options.includeHeaders,
      });
      await copyToClipboard(tsv);
      break;
    }

    case 'clipboard-text': {
      const text = generateCSV(rows, cols, {
        delimiter: '\t',
        encoding: 'utf-8',
        includeHeaders: options.includeHeaders,
      });
      await copyToClipboard(text);
      break;
    }

    case 'clipboard-html': {
      const html = generateHTMLTable(rows, cols, options.includeHeaders);
      await copyToClipboard(html);
      break;
    }

    // ----- Webhook -------------------------------------------------------
    case 'webhook': {
      await pushToWebhook(rows, columns, options);
      break;
    }

    // ----- Google Sheets (placeholder -- requires OAuth flow) ------------
    case 'google-sheets': {
      throw new Error(
        'Google Sheets export requires OAuth authentication. Please configure your Google account in Settings.',
      );
    }

    default: {
      const _exhaustive: never = format;
      throw new Error(`Unsupported export format: ${_exhaustive}`);
    }
  }
}
