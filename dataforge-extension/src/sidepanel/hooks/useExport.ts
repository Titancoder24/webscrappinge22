/**
 * useExport - Hook for data export operations.
 *
 * Wraps the export engine with React state management, providing
 * loading state, error handling, and toast notifications on
 * success/failure.
 */

import { useState, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { useDataTableStore } from '../components/data-table/useDataTableStore';
import { exportData as exportEngine } from '../../lib/export-engine';
import type { ExportFormat, ExportOptions } from '../../types/export';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportResult {
  format: ExportFormat;
  rowCount: number;
  timestamp: number;
}

export interface UseExportReturn {
  /** Whether an export operation is currently in progress. */
  isExporting: boolean;
  /** Information about the last successful export. */
  lastExport: ExportResult | null;
  /** Last export error message. */
  exportError: string | null;

  /** Execute an export with the given format and options. */
  exportData: (format: ExportFormat, options?: Partial<ExportOptions>) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const settings = useStore((s) => s.settings);
  const addToast = useStore((s) => s.addToast);
  const { rows, columns, getFilteredSortedRows } = useDataTableStore();

  const exportData = useCallback(
    async (format: ExportFormat, options?: Partial<ExportOptions>): Promise<void> => {
      if (isExporting) return;

      try {
        setIsExporting(true);
        setExportError(null);

        const exportRows = getFilteredSortedRows();

        const fullOptions: ExportOptions = {
          format,
          includeHeaders: settings.export.includeHeaders,
          csvDelimiter: settings.export.csvDelimiter,
          csvEncoding: settings.export.csvEncoding,
          jsonFormat: settings.export.jsonFormat,
          ...options,
        };

        await exportEngine(exportRows, columns, fullOptions);

        const result: ExportResult = {
          format,
          rowCount: exportRows.length,
          timestamp: Date.now(),
        };

        setLastExport(result);

        addToast({
          type: 'success',
          title: 'Export complete',
          message: `${exportRows.length} rows exported as ${format.toUpperCase()}`,
          duration: 4000,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Export failed';
        setExportError(message);

        addToast({
          type: 'error',
          title: 'Export failed',
          message,
          duration: 6000,
        });
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, settings.export, columns, getFilteredSortedRows, addToast],
  );

  return useMemo(
    () => ({
      isExporting,
      lastExport,
      exportError,
      exportData,
    }),
    [isExporting, lastExport, exportError, exportData],
  );
}
