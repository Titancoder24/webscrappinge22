export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'clipboard-html' | 'clipboard-tsv' | 'clipboard-text' | 'webhook' | 'google-sheets';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  columns?: string[];
  includeHeaders: boolean;
  csvDelimiter: string;
  csvEncoding: string;
  jsonFormat: 'array' | 'nested';
  webhookUrl?: string;
  webhookHeaders?: Record<string, string>;
}
