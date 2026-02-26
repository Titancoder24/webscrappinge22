/**
 * XLSX Writer – Lightweight .xlsx file generation for DataForge.
 *
 * Creates minimal valid .xlsx files using raw XML + ZIP packaging via the
 * browser's Blob and compression APIs. No external dependencies (no SheetJS,
 * no JSZip).
 *
 * Supports:
 *  - String, number, and date cells
 *  - Bold header row formatting
 *  - Configurable column widths
 *  - Shared-string table for deduplication
 *
 * Target: < 5 KB of source code.
 *
 * XLSX format overview (Office Open XML):
 *  - A ZIP archive containing XML "parts"
 *  - [Content_Types].xml  – declares part types
 *  - _rels/.rels          – top-level relationships
 *  - xl/workbook.xml      – workbook structure
 *  - xl/_rels/workbook.xml.rels – workbook relationships
 *  - xl/styles.xml        – cell formatting
 *  - xl/sharedStrings.xml – deduplicated string pool
 *  - xl/worksheets/sheet1.xml – the actual data
 *
 * Zero dependencies.
 */

import type { Row } from '../types/extraction';
import type { ColumnDef } from '../types/table';

// ---------------------------------------------------------------------------
// XML Escaping
// ---------------------------------------------------------------------------

/** Escape special XML characters. */
function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// Column reference helpers
// ---------------------------------------------------------------------------

/** Convert a zero-based column index to an Excel column letter (0 → A, 25 → Z, 26 → AA). */
function colLetter(index: number): string {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/** Build a cell reference like "A1", "B3". Row is 1-based. */
function cellRef(col: number, row: number): string {
  return `${colLetter(col)}${row}`;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Convert a JS Date or timestamp to an Excel serial date number.
 * Excel epoch: 1 Jan 1900, with the intentional Lotus 123 leap-year bug
 * (treats 1900 as a leap year, adding an extra day).
 */
function toExcelDate(value: Date | number): number {
  const date = typeof value === 'number' ? new Date(value) : value;
  if (isNaN(date.getTime())) return 0;

  // Milliseconds from Excel epoch (1 Jan 1900 00:00:00 UTC)
  const excelEpoch = new Date(Date.UTC(1899, 11, 30)).getTime();
  const diff = date.getTime() - excelEpoch;
  return diff / 86400000; // ms per day
}

/** Check if a value looks like a date (ISO 8601 string or a timestamp in ms). */
function isDateValue(value: string | number | null): boolean {
  if (value === null || value === '') return false;
  if (typeof value === 'number') {
    // Heuristic: timestamps after 2000-01-01 and before 2100-01-01 in ms
    return value > 946684800000 && value < 4102444800000;
  }
  // ISO 8601 pattern
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(value);
}

// ---------------------------------------------------------------------------
// Shared Strings
// ---------------------------------------------------------------------------

class SharedStrings {
  private map = new Map<string, number>();
  private list: string[] = [];

  /** Get or insert a string, returning its index. */
  index(value: string): number {
    const existing = this.map.get(value);
    if (existing !== undefined) return existing;
    const idx = this.list.length;
    this.map.set(value, idx);
    this.list.push(value);
    return idx;
  }

  /** Total unique string count. */
  get count(): number {
    return this.list.length;
  }

  /** Generate the sharedStrings.xml content. */
  toXML(): string {
    const items = this.list
      .map((s) => `<si><t xml:space="preserve">${escXml(s)}</t></si>`)
      .join('');
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.count}" uniqueCount="${this.count}">` +
      items +
      '</sst>'
    );
  }
}

// ---------------------------------------------------------------------------
// ZIP file creation (minimal PKZIP implementation)
// ---------------------------------------------------------------------------

/**
 * Minimal ZIP archive builder.
 * Creates a valid PKZIP file using Store compression (no deflate needed
 * for small XML payloads – keeps code size tiny).
 *
 * For larger files the browser's CompressionStream could be used, but
 * Store is sufficient for typical scraper exports (< 100 KB XML).
 */
class MiniZip {
  private files: { name: Uint8Array; data: Uint8Array; crc: number }[] = [];
  private encoder = new TextEncoder();

  /** Add a file entry. */
  add(name: string, content: string): void {
    const data = this.encoder.encode(content);
    const crc = this.crc32(data);
    this.files.push({ name: this.encoder.encode(name), data, crc });
  }

  /** Build the final ZIP as a Blob. */
  build(): Blob {
    const parts: Uint8Array[] = [];
    const centralDir: Uint8Array[] = [];
    let offset = 0;

    for (const file of this.files) {
      // Local file header
      const localHeader = this.buildLocalHeader(file);
      parts.push(localHeader);
      parts.push(file.data);

      // Central directory entry
      const cdEntry = this.buildCentralDirEntry(file, offset);
      centralDir.push(cdEntry);

      offset += localHeader.byteLength + file.data.byteLength;
    }

    // Central directory
    const cdOffset = offset;
    let cdSize = 0;
    for (const entry of centralDir) {
      parts.push(entry);
      cdSize += entry.byteLength;
    }

    // End of central directory record
    const eocd = this.buildEOCD(this.files.length, cdSize, cdOffset);
    parts.push(eocd);

    return new Blob(parts as BlobPart[], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  private buildLocalHeader(file: { name: Uint8Array; data: Uint8Array; crc: number }): Uint8Array {
    const nameLen = file.name.byteLength;
    const dataLen = file.data.byteLength;
    const header = new Uint8Array(30 + nameLen);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true);  // Local file header signature
    view.setUint16(4, 20, true);            // Version needed to extract
    view.setUint16(6, 0, true);             // General purpose bit flag
    view.setUint16(8, 0, true);             // Compression method: Store
    view.setUint16(10, 0, true);            // File last modification time
    view.setUint16(12, 0, true);            // File last modification date
    view.setUint32(14, file.crc, true);     // CRC-32
    view.setUint32(18, dataLen, true);      // Compressed size
    view.setUint32(22, dataLen, true);      // Uncompressed size
    view.setUint16(26, nameLen, true);      // File name length
    view.setUint16(28, 0, true);            // Extra field length

    header.set(file.name, 30);
    return header;
  }

  private buildCentralDirEntry(
    file: { name: Uint8Array; data: Uint8Array; crc: number },
    localHeaderOffset: number,
  ): Uint8Array {
    const nameLen = file.name.byteLength;
    const dataLen = file.data.byteLength;
    const entry = new Uint8Array(46 + nameLen);
    const view = new DataView(entry.buffer);

    view.setUint32(0, 0x02014b50, true);    // Central directory file header signature
    view.setUint16(4, 20, true);             // Version made by
    view.setUint16(6, 20, true);             // Version needed to extract
    view.setUint16(8, 0, true);              // General purpose bit flag
    view.setUint16(10, 0, true);             // Compression method: Store
    view.setUint16(12, 0, true);             // File last modification time
    view.setUint16(14, 0, true);             // File last modification date
    view.setUint32(16, file.crc, true);      // CRC-32
    view.setUint32(20, dataLen, true);       // Compressed size
    view.setUint32(24, dataLen, true);       // Uncompressed size
    view.setUint16(28, nameLen, true);       // File name length
    view.setUint16(30, 0, true);             // Extra field length
    view.setUint16(32, 0, true);             // File comment length
    view.setUint16(34, 0, true);             // Disk number start
    view.setUint16(36, 0, true);             // Internal file attributes
    view.setUint32(38, 0, true);             // External file attributes
    view.setUint32(42, localHeaderOffset, true); // Relative offset of local header

    entry.set(file.name, 46);
    return entry;
  }

  private buildEOCD(entryCount: number, cdSize: number, cdOffset: number): Uint8Array {
    const eocd = new Uint8Array(22);
    const view = new DataView(eocd.buffer);

    view.setUint32(0, 0x06054b50, true);    // End of central directory signature
    view.setUint16(4, 0, true);              // Disk number
    view.setUint16(6, 0, true);              // Disk where CD starts
    view.setUint16(8, entryCount, true);     // Number of CD records on this disk
    view.setUint16(10, entryCount, true);    // Total number of CD records
    view.setUint32(12, cdSize, true);        // Size of central directory
    view.setUint32(16, cdOffset, true);      // Offset of start of CD
    view.setUint16(20, 0, true);             // Comment length

    return eocd;
  }

  /**
   * CRC-32 computation (ISO 3309 / ITU-T V.42).
   * Uses a pre-computed lookup table for speed.
   */
  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}

/** Pre-computed CRC-32 lookup table. */
const CRC_TABLE: number[] = (() => {
  const table: number[] = new Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

// ---------------------------------------------------------------------------
// XML part generators
// ---------------------------------------------------------------------------

function contentTypesXML(): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
    '</Types>'
  );
}

function relsXML(): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>'
  );
}

function workbookXML(): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets><sheet name="DataForge Export" sheetId="1" r:id="rId1"/></sheets>' +
    '</workbook>'
  );
}

function workbookRelsXML(): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>' +
    '</Relationships>'
  );
}

/**
 * Styles XML with two cell formats:
 *  - Style 0: default (normal)
 *  - Style 1: bold (for header row)
 */
function stylesXML(): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2">' +
    '<font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="2">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '</fills>' +
    '<borders count="1">' +
    '<border><left/><right/><top/><bottom/><diagonal/></border>' +
    '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="2">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '</cellXfs>' +
    '</styleSheet>'
  );
}

/**
 * Build the worksheet XML with column widths, header row, and data rows.
 */
function sheetXML(
  rows: Row[],
  columns: ColumnDef[],
  sharedStrings: SharedStrings,
): string {
  const colCount = columns.length;

  // Column widths: use column definition widths (px) converted to Excel character widths.
  // Excel default is ~8.43 characters. We convert roughly: excelWidth = pxWidth / 7.5
  let colsXml = '<cols>';
  for (let c = 0; c < colCount; c++) {
    const width = Math.max(8, Math.round(columns[c].width / 7.5));
    colsXml += `<col min="${c + 1}" max="${c + 1}" width="${width}" customWidth="1"/>`;
  }
  colsXml += '</cols>';

  // Sheet data
  const sheetParts: string[] = [];
  sheetParts.push(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    colsXml,
    '<sheetData>',
  );

  // Header row (row 1, style 1 = bold)
  sheetParts.push('<row r="1">');
  for (let c = 0; c < colCount; c++) {
    const ref = cellRef(c, 1);
    const ssIdx = sharedStrings.index(columns[c].name);
    sheetParts.push(`<c r="${ref}" t="s" s="1"><v>${ssIdx}</v></c>`);
  }
  sheetParts.push('</row>');

  // Data rows (starting at row 2)
  for (let r = 0; r < rows.length; r++) {
    const rowNum = r + 2;
    sheetParts.push(`<row r="${rowNum}">`);
    for (let c = 0; c < colCount; c++) {
      const ref = cellRef(c, rowNum);
      const raw = rows[r].data[columns[c].id];

      if (raw === null || raw === undefined) {
        // Empty cell – skip
        continue;
      }

      if (typeof raw === 'number' && Number.isFinite(raw)) {
        // Check if it looks like a date timestamp
        if (columns[c].dataType === 'date' && isDateValue(raw)) {
          const serial = toExcelDate(raw);
          sheetParts.push(`<c r="${ref}"><v>${serial}</v></c>`);
        } else {
          sheetParts.push(`<c r="${ref}"><v>${raw}</v></c>`);
        }
      } else {
        // String cell (including stringified dates)
        const str = String(raw);
        if (str === '') continue;

        // Check if string is a pure number
        if (str.length > 0 && !isNaN(Number(str)) && str.trim() !== '') {
          const num = Number(str);
          if (Number.isFinite(num)) {
            sheetParts.push(`<c r="${ref}"><v>${num}</v></c>`);
            continue;
          }
        }

        const ssIdx = sharedStrings.index(str);
        sheetParts.push(`<c r="${ref}" t="s"><v>${ssIdx}</v></c>`);
      }
    }
    sheetParts.push('</row>');
  }

  sheetParts.push('</sheetData>', '</worksheet>');
  return sheetParts.join('');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a minimal valid .xlsx file as a Blob.
 *
 * @param rows - Data rows to export
 * @param columns - Column definitions (order determines column order)
 * @returns Blob containing a valid .xlsx archive
 * @throws Error if inputs are invalid
 */
export function generateXLSX(rows: Row[], columns: ColumnDef[]): Blob {
  if (!columns || columns.length === 0) {
    throw new Error('Cannot generate XLSX: no columns defined');
  }

  if (!rows) {
    throw new Error('Cannot generate XLSX: rows is null or undefined');
  }

  const sharedStrings = new SharedStrings();
  const sheet = sheetXML(rows, columns, sharedStrings);

  const zip = new MiniZip();
  zip.add('[Content_Types].xml', contentTypesXML());
  zip.add('_rels/.rels', relsXML());
  zip.add('xl/workbook.xml', workbookXML());
  zip.add('xl/_rels/workbook.xml.rels', workbookRelsXML());
  zip.add('xl/styles.xml', stylesXML());
  zip.add('xl/sharedStrings.xml', sharedStrings.toXML());
  zip.add('xl/worksheets/sheet1.xml', sheet);

  return zip.build();
}
