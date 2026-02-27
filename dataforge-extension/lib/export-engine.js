/**
 * DataForge Export Engine — CSV, JSON, XLSX, Clipboard export.
 * No external libraries. Lightweight custom implementations.
 */
(function () {
  'use strict';

  const ExportEngine = {
    /**
     * Export as CSV and trigger download.
     */
    toCSV(columns, rows, filename = 'export') {
      const headers = columns.map(c => this._csvEscape(c.name));
      const lines = [headers.join(',')];

      for (const row of rows) {
        const values = columns.map(c => this._csvEscape(String(row[c.id] || '')));
        lines.push(values.join(','));
      }

      const csv = lines.join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      this._download(blob, `${filename}.csv`);
    },

    /**
     * Export as JSON and trigger download.
     */
    toJSON(columns, rows, filename = 'export') {
      const data = rows.map(row => {
        const obj = {};
        columns.forEach(c => { obj[c.name] = row[c.id] || ''; });
        return obj;
      });

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      this._download(blob, `${filename}.json`);
    },

    /**
     * Export as XLSX (lightweight custom implementation).
     * Creates a valid .xlsx file without SheetJS.
     */
    toXLSX(columns, rows, filename = 'export') {
      // XLSX is a ZIP of XML files. We'll create a minimal valid XLSX.
      const sheetData = this._buildSheetXML(columns, rows);
      const workbook = this._buildWorkbookXML();
      const contentTypes = this._buildContentTypesXML();
      const rels = this._buildRelsXML();
      const workbookRels = this._buildWorkbookRelsXML();
      const styles = this._buildStylesXML();

      // Build ZIP
      const zip = this._createZip({
        '[Content_Types].xml': contentTypes,
        '_rels/.rels': rels,
        'xl/workbook.xml': workbook,
        'xl/_rels/workbook.xml.rels': workbookRels,
        'xl/worksheets/sheet1.xml': sheetData,
        'xl/styles.xml': styles,
      });

      const blob = new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this._download(blob, `${filename}.xlsx`);
    },

    /**
     * Copy to clipboard as TSV (tab-separated values).
     */
    async toClipboard(columns, rows) {
      const headers = columns.map(c => c.name);
      const lines = [headers.join('\t')];

      for (const row of rows) {
        const values = columns.map(c => String(row[c.id] || '').replace(/\t/g, ' ').replace(/\n/g, ' '));
        lines.push(values.join('\t'));
      }

      const text = lines.join('\n');
      await navigator.clipboard.writeText(text);
    },

    // ============================================================
    // CSV HELPERS
    // ============================================================

    _csvEscape(value) {
      if (!value) return '""';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    },

    // ============================================================
    // XLSX HELPERS (Minimal ZIP + XML implementation)
    // ============================================================

    _buildSheetXML(columns, rows) {
      let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
      xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n';
      xml += '<sheetData>\n';

      // Header row
      xml += '<row r="1">\n';
      columns.forEach((col, i) => {
        const cell = this._colLetter(i) + '1';
        xml += `<c r="${cell}" t="inlineStr"><is><t>${this._xmlEscape(col.name)}</t></is></c>\n`;
      });
      xml += '</row>\n';

      // Data rows
      rows.forEach((row, ri) => {
        const rowNum = ri + 2;
        xml += `<row r="${rowNum}">\n`;
        columns.forEach((col, ci) => {
          const cell = this._colLetter(ci) + rowNum;
          const value = String(row[col.id] || '');

          // Check if numeric
          if (/^-?\d+\.?\d*$/.test(value) && value.length < 15) {
            xml += `<c r="${cell}"><v>${value}</v></c>\n`;
          } else {
            xml += `<c r="${cell}" t="inlineStr"><is><t>${this._xmlEscape(value)}</t></is></c>\n`;
          }
        });
        xml += '</row>\n';
      });

      xml += '</sheetData>\n</worksheet>';
      return xml;
    },

    _buildWorkbookXML() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="DataForge Export" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
    },

    _buildContentTypesXML() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
    },

    _buildRelsXML() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
    },

    _buildWorkbookRelsXML() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
    },

    _buildStylesXML() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`;
    },

    _colLetter(index) {
      let letter = '';
      while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter;
        index = Math.floor(index / 26) - 1;
      }
      return letter;
    },

    _xmlEscape(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    },

    // ============================================================
    // MINIMAL ZIP IMPLEMENTATION
    // Creates valid ZIP files without any library.
    // ============================================================

    _createZip(files) {
      const encoder = new TextEncoder();
      const entries = [];
      const centralDir = [];
      let offset = 0;

      for (const [path, content] of Object.entries(files)) {
        const data = encoder.encode(content);
        const pathBytes = encoder.encode(path);

        // Local file header
        const header = new Uint8Array(30 + pathBytes.length);
        const view = new DataView(header.buffer);

        view.setUint32(0, 0x04034B50, true);  // Local file header signature
        view.setUint16(4, 20, true);           // Version needed
        view.setUint16(6, 0, true);            // Flags
        view.setUint16(8, 0, true);            // Compression method (stored)
        view.setUint16(10, 0, true);           // Modified time
        view.setUint16(12, 0, true);           // Modified date
        view.setUint32(14, this._crc32(data), true);  // CRC-32
        view.setUint32(18, data.length, true); // Compressed size
        view.setUint32(22, data.length, true); // Uncompressed size
        view.setUint16(26, pathBytes.length, true);  // Filename length
        view.setUint16(28, 0, true);           // Extra field length
        header.set(pathBytes, 30);

        entries.push(header, data);

        // Central directory entry
        const cdEntry = new Uint8Array(46 + pathBytes.length);
        const cdView = new DataView(cdEntry.buffer);

        cdView.setUint32(0, 0x02014B50, true);  // Central directory signature
        cdView.setUint16(4, 20, true);           // Version made by
        cdView.setUint16(6, 20, true);           // Version needed
        cdView.setUint16(8, 0, true);            // Flags
        cdView.setUint16(10, 0, true);           // Compression method
        cdView.setUint16(12, 0, true);           // Modified time
        cdView.setUint16(14, 0, true);           // Modified date
        cdView.setUint32(16, this._crc32(data), true);
        cdView.setUint32(20, data.length, true);
        cdView.setUint32(24, data.length, true);
        cdView.setUint16(28, pathBytes.length, true);
        cdView.setUint16(30, 0, true);
        cdView.setUint16(32, 0, true);
        cdView.setUint16(34, 0, true);
        cdView.setUint16(36, 0, true);
        cdView.setUint32(38, 0, true);
        cdView.setUint32(42, offset, true);      // Offset of local header
        cdEntry.set(pathBytes, 46);

        centralDir.push(cdEntry);
        offset += header.length + data.length;
      }

      const cdOffset = offset;
      let cdSize = 0;
      for (const entry of centralDir) cdSize += entry.length;

      // End of central directory
      const eocd = new Uint8Array(22);
      const eocdView = new DataView(eocd.buffer);
      eocdView.setUint32(0, 0x06054B50, true);
      eocdView.setUint16(4, 0, true);
      eocdView.setUint16(6, 0, true);
      eocdView.setUint16(8, centralDir.length, true);
      eocdView.setUint16(10, centralDir.length, true);
      eocdView.setUint32(12, cdSize, true);
      eocdView.setUint32(16, cdOffset, true);
      eocdView.setUint16(20, 0, true);

      // Combine all parts
      const totalSize = offset + cdSize + 22;
      const result = new Uint8Array(totalSize);
      let pos = 0;

      for (const part of entries) {
        result.set(part, pos);
        pos += part.length;
      }
      for (const part of centralDir) {
        result.set(part, pos);
        pos += part.length;
      }
      result.set(eocd, pos);

      return result;
    },

    /**
     * CRC-32 calculation.
     */
    _crc32(data) {
      if (!this._crcTable) {
        this._crcTable = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
          let c = i;
          for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
          }
          this._crcTable[i] = c;
        }
      }

      let crc = 0xFFFFFFFF;
      for (let i = 0; i < data.length; i++) {
        crc = this._crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
      }
      return (crc ^ 0xFFFFFFFF) >>> 0;
    },

    // ============================================================
    // DOWNLOAD TRIGGER
    // ============================================================

    _download(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 100);
    },
  };

  window.DataForgeExport = ExportEngine;
})();
