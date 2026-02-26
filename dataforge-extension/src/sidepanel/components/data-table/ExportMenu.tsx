/**
 * ExportMenu -- Export dropdown menu for the DataForge data table.
 *
 * Features:
 * - Options: CSV, Excel (.xlsx), JSON, Copy to Clipboard (HTML/TSV/Text), Webhook, Google Sheets
 * - Each option with icon
 * - CSV: encoding/delimiter options sub-panel
 * - JSON: format option (array/nested)
 * - Webhook: URL + headers input
 * - Click triggers export via export engine
 * - Brief "downloading" animation on button
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ExportFormat } from '@/types/export';
import { useDataTableStore } from './useDataTableStore';

// ---------------------------------------------------------------------------
// Export option definitions
// ---------------------------------------------------------------------------

interface ExportOptionDef {
  format: ExportFormat;
  label: string;
  description: string;
  group: 'file' | 'clipboard' | 'integration';
  hasOptions?: boolean;
}

const EXPORT_OPTIONS: ExportOptionDef[] = [
  { format: 'csv', label: 'CSV', description: 'Comma-separated values', group: 'file', hasOptions: true },
  { format: 'xlsx', label: 'Excel (.xlsx)', description: 'Microsoft Excel format', group: 'file' },
  { format: 'json', label: 'JSON', description: 'JavaScript Object Notation', group: 'file', hasOptions: true },
  { format: 'clipboard-html', label: 'Copy as HTML', description: 'HTML table to clipboard', group: 'clipboard' },
  { format: 'clipboard-tsv', label: 'Copy as TSV', description: 'Tab-separated for spreadsheets', group: 'clipboard' },
  { format: 'clipboard-text', label: 'Copy as Text', description: 'Plain text to clipboard', group: 'clipboard' },
  { format: 'webhook', label: 'Webhook', description: 'POST data to URL', group: 'integration', hasOptions: true },
  { format: 'google-sheets', label: 'Google Sheets', description: 'Push to Google Sheets', group: 'integration' },
];

// ---------------------------------------------------------------------------
// Icons per format
// ---------------------------------------------------------------------------

const FormatIcon: React.FC<{ format: ExportFormat; className?: string }> = ({ format, className = '' }) => {
  const cls = `flex-shrink-0 ${className}`;
  switch (format) {
    case 'csv':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'xlsx':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      );
    case 'json':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'clipboard-html':
    case 'clipboard-tsv':
    case 'clipboard-text':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case 'webhook':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case 'google-sheets':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      );
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExportMenu: React.FC = () => {
  const rows = useDataTableStore((s) => s.rows);
  const columns = useDataTableStore((s) => s.columns);
  const isExporting = useDataTableStore((s) => s.isExporting);
  const triggerExport = useDataTableStore((s) => s.triggerExport);
  const finishExport = useDataTableStore((s) => s.finishExport);
  const setExportMenuOpen = useDataTableStore((s) => s.setExportMenuOpen);
  const getFilteredSortedRows = useDataTableStore((s) => s.getFilteredSortedRows);

  // Sub-panel state
  const [activeSubPanel, setActiveSubPanel] = useState<ExportFormat | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  // CSV options
  const [csvDelimiter, setCsvDelimiter] = useState(',');
  const [csvEncoding, setCsvEncoding] = useState('utf-8');

  // JSON options
  const [jsonFormat, setJsonFormat] = useState<'array' | 'nested'>('array');

  // Webhook options
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookHeaders, setWebhookHeaders] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-finish export animation
  useEffect(() => {
    if (exportingFormat) {
      const timer = setTimeout(() => {
        setExportingFormat(null);
        finishExport();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [exportingFormat, finishExport]);

  // ---- Export handler ----

  const handleExport = useCallback(
    (format: ExportFormat) => {
      setExportingFormat(format);
      triggerExport(format);

      // The actual export logic is triggered via the store's triggerExport,
      // which the DataTable parent will listen to and call exportData.
      // For direct export formats, close the menu after a delay.
      if (!['csv', 'json', 'webhook'].includes(format) || activeSubPanel === format) {
        setTimeout(() => {
          setActiveSubPanel(null);
        }, 300);
      }
    },
    [triggerExport, activeSubPanel],
  );

  const handleOptionClick = useCallback(
    (option: ExportOptionDef) => {
      if (option.hasOptions) {
        setActiveSubPanel(activeSubPanel === option.format ? null : option.format);
      } else {
        handleExport(option.format);
      }
    },
    [activeSubPanel, handleExport],
  );

  // ---- Grouped options ----

  const fileOptions = EXPORT_OPTIONS.filter((o) => o.group === 'file');
  const clipboardOptions = EXPORT_OPTIONS.filter((o) => o.group === 'clipboard');
  const integrationOptions = EXPORT_OPTIONS.filter((o) => o.group === 'integration');

  const filteredRowCount = getFilteredSortedRows().length;

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-1 w-[280px] rounded-xl border border-forge-border bg-forge-bg-secondary shadow-2xl z-50 animate-scale-in overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-forge-border/30">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="text-xs font-semibold text-forge-text">Export Data</span>
        </div>
        <span className="text-[10px] text-forge-text-muted/50">{filteredRowCount} rows</span>
      </div>

      {/* File Downloads */}
      <div className="py-1">
        <div className="px-3 py-1">
          <span className="text-[9px] text-forge-text-muted/40 uppercase tracking-wider">Download</span>
        </div>
        {fileOptions.map((option) => (
          <div key={option.format}>
            <button
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={rows.length === 0}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-100',
                'hover:bg-accent-primary/[0.06]',
                rows.length === 0 && 'opacity-30 cursor-not-allowed',
                exportingFormat === option.format && 'bg-accent-primary/10',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <FormatIcon format={option.format} className="text-forge-text-muted/60" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-forge-text font-medium">{option.label}</div>
                <div className="text-[10px] text-forge-text-muted/40">{option.description}</div>
              </div>
              {exportingFormat === option.format && (
                <div className="w-4 h-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin flex-shrink-0" />
              )}
              {option.hasOptions && exportingFormat !== option.format && (
                <span className="text-forge-text-muted/30 text-[10px] flex-shrink-0">
                  {activeSubPanel === option.format ? '\u25BE' : '\u25B8'}
                </span>
              )}
            </button>

            {/* CSV sub-panel */}
            {activeSubPanel === 'csv' && option.format === 'csv' && (
              <div className="mx-3 mb-2 p-2 rounded-lg bg-forge-bg/50 border border-forge-border/20 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-forge-text-muted w-14">Delimiter</label>
                  <select
                    value={csvDelimiter}
                    onChange={(e) => setCsvDelimiter(e.target.value)}
                    className="flex-1 h-6 bg-forge-bg border border-forge-border/40 rounded px-1.5 text-[10px] text-forge-text outline-none"
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value={'\t'}>Tab</option>
                    <option value="|">Pipe (|)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-forge-text-muted w-14">Encoding</label>
                  <select
                    value={csvEncoding}
                    onChange={(e) => setCsvEncoding(e.target.value)}
                    className="flex-1 h-6 bg-forge-bg border border-forge-border/40 rounded px-1.5 text-[10px] text-forge-text outline-none"
                  >
                    <option value="utf-8">UTF-8</option>
                    <option value="utf-16">UTF-16</option>
                    <option value="ascii">ASCII</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="w-full h-6 rounded bg-accent-primary/15 text-accent-primary text-[10px] font-semibold border border-accent-primary/30 hover:bg-accent-primary/25 transition-all"
                >
                  Download CSV
                </button>
              </div>
            )}

            {/* JSON sub-panel */}
            {activeSubPanel === 'json' && option.format === 'json' && (
              <div className="mx-3 mb-2 p-2 rounded-lg bg-forge-bg/50 border border-forge-border/20 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-forge-text-muted w-14">Format</label>
                  <select
                    value={jsonFormat}
                    onChange={(e) => setJsonFormat(e.target.value as 'array' | 'nested')}
                    className="flex-1 h-6 bg-forge-bg border border-forge-border/40 rounded px-1.5 text-[10px] text-forge-text outline-none"
                  >
                    <option value="array">Array of arrays</option>
                    <option value="nested">Array of objects</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="w-full h-6 rounded bg-accent-primary/15 text-accent-primary text-[10px] font-semibold border border-accent-primary/30 hover:bg-accent-primary/25 transition-all"
                >
                  Download JSON
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-forge-border/20" />

      {/* Clipboard */}
      <div className="py-1">
        <div className="px-3 py-1">
          <span className="text-[9px] text-forge-text-muted/40 uppercase tracking-wider">Clipboard</span>
        </div>
        {clipboardOptions.map((option) => (
          <button
            key={option.format}
            type="button"
            onClick={() => handleExport(option.format)}
            disabled={rows.length === 0}
            className={[
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-all duration-100',
              'hover:bg-accent-primary/[0.06]',
              rows.length === 0 && 'opacity-30 cursor-not-allowed',
              exportingFormat === option.format && 'bg-accent-primary/10',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <FormatIcon format={option.format} className="text-forge-text-muted/60" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-forge-text">{option.label}</div>
            </div>
            {exportingFormat === option.format && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 animate-scale-in" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-forge-border/20" />

      {/* Integrations */}
      <div className="py-1 pb-2">
        <div className="px-3 py-1">
          <span className="text-[9px] text-forge-text-muted/40 uppercase tracking-wider">Integrations</span>
        </div>
        {integrationOptions.map((option) => (
          <div key={option.format}>
            <button
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={rows.length === 0}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-all duration-100',
                'hover:bg-accent-primary/[0.06]',
                rows.length === 0 && 'opacity-30 cursor-not-allowed',
                exportingFormat === option.format && 'bg-accent-primary/10',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <FormatIcon format={option.format} className="text-forge-text-muted/60" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-forge-text">{option.label}</div>
                <div className="text-[10px] text-forge-text-muted/40">{option.description}</div>
              </div>
              {option.hasOptions && (
                <span className="text-forge-text-muted/30 text-[10px] flex-shrink-0">
                  {activeSubPanel === option.format ? '\u25BE' : '\u25B8'}
                </span>
              )}
            </button>

            {/* Webhook sub-panel */}
            {activeSubPanel === 'webhook' && option.format === 'webhook' && (
              <div className="mx-3 mb-2 p-2 rounded-lg bg-forge-bg/50 border border-forge-border/20 space-y-2 animate-fade-in">
                <div>
                  <label className="block text-[10px] text-forge-text-muted mb-0.5">Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-6 bg-forge-bg border border-forge-border/40 rounded px-1.5 text-[10px] text-forge-text font-mono outline-none placeholder:text-forge-text-muted/30 focus:border-accent-primary/50"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-forge-text-muted mb-0.5">
                    Headers <span className="text-forge-text-muted/30">(JSON, optional)</span>
                  </label>
                  <textarea
                    value={webhookHeaders}
                    onChange={(e) => setWebhookHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer ..."}'
                    rows={2}
                    className="w-full bg-forge-bg border border-forge-border/40 rounded px-1.5 py-1 text-[10px] text-forge-text font-mono outline-none placeholder:text-forge-text-muted/30 focus:border-accent-primary/50 resize-none"
                    spellCheck={false}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleExport('webhook')}
                  disabled={!webhookUrl.trim()}
                  className={[
                    'w-full h-6 rounded text-[10px] font-semibold border transition-all',
                    webhookUrl.trim()
                      ? 'bg-accent-primary/15 text-accent-primary border-accent-primary/30 hover:bg-accent-primary/25'
                      : 'bg-forge-bg-tertiary/30 text-forge-text-muted/30 border-forge-border/20 cursor-not-allowed',
                  ].join(' ')}
                >
                  Send to Webhook
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExportMenu;
