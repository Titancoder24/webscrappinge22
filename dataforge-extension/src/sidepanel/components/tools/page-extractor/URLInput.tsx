import React, { useCallback, useRef, useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface URLInputProps {
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  previousExtractions?: { id: string; name: string; urls: string[] }[];
  disabled?: boolean;
}

interface ParsedURL {
  raw: string;
  valid: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const URL_REGEX =
  /^https?:\/\/(?:[\w-]+\.)+[\w-]+(?:\/[\w\-.~:/?#[\]@!$&'()*+,;=%]*)?$/i;

function validateUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return URL_REGEX.test(raw.trim());
  }
}

function parseUrlsFromText(text: string): string[] {
  return text
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseCSVContent(text: string): string[] {
  const lines = text.split(/[\n\r]+/).filter(Boolean);
  const urls: string[] = [];
  for (const line of lines) {
    // Try to extract URLs from CSV columns
    const cols = line.split(/[,;\t]/);
    for (const col of cols) {
      const trimmed = col.trim().replace(/^["']|["']$/g, '');
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        urls.push(trimmed);
      }
    }
  }
  return urls;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const URLInput: React.FC<URLInputProps> = ({
  urls,
  onUrlsChange,
  previousExtractions = [],
  disabled = false,
}) => {
  const [textValue, setTextValue] = useState(urls.join('\n'));
  const [dragOver, setDragOver] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLDivElement>(null);

  // Parsed and validated URLs for display
  const parsed: ParsedURL[] = useMemo(
    () =>
      urls.map((raw) => ({
        raw,
        valid: validateUrl(raw),
      })),
    [urls],
  );

  const validCount = useMemo(() => parsed.filter((p) => p.valid).length, [parsed]);
  const invalidCount = useMemo(() => parsed.filter((p) => !p.valid).length, [parsed]);

  // Handle textarea change
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTextValue(value);
      const newUrls = parseUrlsFromText(value);
      onUrlsChange(newUrls);
    },
    [onUrlsChange],
  );

  // File upload handler
  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase();
        const newUrls = ext === 'csv' ? parseCSVContent(content) : parseUrlsFromText(content);
        const combined = [...urls, ...newUrls];
        const deduped = [...new Set(combined)];
        onUrlsChange(deduped);
        setTextValue(deduped.join('\n'));
      };
      reader.readAsText(file);
    },
    [urls, onUrlsChange],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = '';
    },
    [handleFileUpload],
  );

  // Drag/Drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  // Import from previous extraction
  const handleImport = useCallback(
    (extraction: { id: string; name: string; urls: string[] }) => {
      const combined = [...urls, ...extraction.urls];
      const deduped = [...new Set(combined)];
      onUrlsChange(deduped);
      setTextValue(deduped.join('\n'));
      setImportOpen(false);
    },
    [urls, onUrlsChange],
  );

  // Clear all
  const handleClear = useCallback(() => {
    onUrlsChange([]);
    setTextValue('');
  }, [onUrlsChange]);

  // Remove invalid URLs
  const handleRemoveInvalid = useCallback(() => {
    const validUrls = parsed.filter((p) => p.valid).map((p) => p.raw);
    onUrlsChange(validUrls);
    setTextValue(validUrls.join('\n'));
  }, [parsed, onUrlsChange]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
          Target URLs
        </label>
        <div className="flex items-center gap-2">
          {urls.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono">
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-accent-primary/15 text-accent-primary font-bold">
                {validCount}
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-status-error/15 text-status-error font-bold">
                  {invalidCount}
                </span>
              )}
              <span className="text-forge-text-muted">URLs</span>
            </span>
          )}
        </div>
      </div>

      {/* Textarea with drop zone */}
      <div
        className={[
          'relative rounded-lg border transition-colors duration-200',
          dragOver
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-forge-border hover:border-forge-border-active/50',
          disabled ? 'opacity-50 pointer-events-none' : '',
        ].join(' ')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          value={textValue}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder="Paste URLs here, one per line...&#10;&#10;https://example.com/page-1&#10;https://example.com/page-2&#10;https://example.com/page-3"
          className={[
            'w-full h-40 px-3 py-2.5 bg-transparent text-sm text-forge-text font-mono',
            'placeholder:text-forge-text-muted/40 resize-none',
            'focus:outline-none',
            'scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent',
          ].join(' ')}
          spellCheck={false}
        />

        {/* Invalid URL highlights overlay */}
        {invalidCount > 0 && (
          <div className="absolute top-0 right-0 mt-2 mr-2">
            <button
              type="button"
              onClick={handleRemoveInvalid}
              className="text-[10px] font-medium px-2 py-1 rounded bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
              title="Remove invalid URLs"
            >
              Remove {invalidCount} invalid
            </button>
          </div>
        )}

        {/* Drop overlay */}
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent-primary/10 rounded-lg backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 text-accent-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs font-semibold">Drop CSV or TXT file</span>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Upload file */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-forge-bg-tertiary text-forge-text-secondary hover:text-forge-text hover:bg-forge-border/40 border border-forge-border transition-colors disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload CSV/TXT
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Import from previous */}
        <div className="relative" ref={importRef}>
          <button
            type="button"
            onClick={() => setImportOpen(!importOpen)}
            disabled={disabled || previousExtractions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-forge-bg-tertiary text-forge-text-secondary hover:text-forge-text hover:bg-forge-border/40 border border-forge-border transition-colors disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m8 11 4 4 4-4" />
              <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
            </svg>
            Import Previous
          </button>

          {/* Dropdown */}
          {importOpen && previousExtractions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-forge-border bg-forge-bg-secondary shadow-xl z-20 animate-scale-in overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {previousExtractions.map((ext) => (
                  <button
                    key={ext.id}
                    type="button"
                    onClick={() => handleImport(ext)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-colors"
                  >
                    <span className="truncate">{ext.name}</span>
                    <span className="text-forge-text-muted font-mono ml-2">{ext.urls.length}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear */}
        {urls.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-xs font-medium text-forge-text-muted hover:text-status-error transition-colors disabled:opacity-40"
          >
            Clear all
          </button>
        )}
      </div>

      {/* URL validation list (shown when there are invalid URLs) */}
      {invalidCount > 0 && urls.length <= 20 && (
        <div className="rounded-lg border border-forge-border bg-forge-bg-secondary/50 p-2 max-h-32 overflow-y-auto">
          {parsed.map((p, i) => (
            <div
              key={i}
              className={[
                'flex items-center gap-2 px-2 py-1 rounded text-[11px] font-mono truncate',
                p.valid ? 'text-forge-text-muted' : 'text-status-error bg-status-error/5',
              ].join(' ')}
            >
              <span className="shrink-0">
                {p.valid ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-primary" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-status-error" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </span>
              <span className="truncate">{p.raw}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default URLInput;
