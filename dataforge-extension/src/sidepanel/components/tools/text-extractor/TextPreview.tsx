import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import type { ExtractedText, OutputFormat } from './TextExtractorView';
import { formatNumber, formatDate } from '../../../../utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TextPreviewProps {
  text: ExtractedText;
  formattedOutput: string;
  outputFormat: OutputFormat;
  typewriterEnabled: boolean;
  onCopy: () => void;
  onExport: () => void;
}

// ---------------------------------------------------------------------------
// Typewriter hook
// ---------------------------------------------------------------------------

function useTypewriter(text: string, enabled: boolean, speed: number = 15): string {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }

    // Reset
    setDisplayedText('');
    indexRef.current = 0;

    const type = () => {
      if (indexRef.current < text.length) {
        // Type multiple chars at once for speed
        const chunkSize = Math.min(3, text.length - indexRef.current);
        indexRef.current += chunkSize;
        setDisplayedText(text.slice(0, indexRef.current));
        timeoutRef.current = setTimeout(type, speed);
      }
    };

    timeoutRef.current = setTimeout(type, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, enabled, speed]);

  return enabled ? displayedText : text;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TextPreview: React.FC<TextPreviewProps> = ({
  text,
  formattedOutput,
  outputFormat,
  typewriterEnabled,
  onCopy,
  onExport,
}) => {
  const [copied, setCopied] = useState(false);
  const displayText = useTypewriter(formattedOutput, typewriterEnabled);

  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  // Simple markdown renderer for preview
  const renderedContent = useMemo(() => {
    if (outputFormat === 'json') {
      return (
        <pre className="text-xs font-mono text-forge-text-secondary whitespace-pre-wrap break-words leading-relaxed">
          {displayText}
        </pre>
      );
    }

    if (outputFormat === 'plaintext') {
      return (
        <div className="text-xs text-forge-text-secondary whitespace-pre-wrap break-words leading-relaxed">
          {displayText}
        </div>
      );
    }

    // Basic markdown rendering
    const lines = displayText.split('\n');
    return (
      <div className="prose-forge text-xs leading-relaxed">
        {lines.map((line, i) => {
          // H1
          if (line.startsWith('# ')) {
            return (
              <h1 key={i} className="text-base font-bold text-forge-text mb-2 mt-1">
                {line.slice(2)}
              </h1>
            );
          }
          // H2
          if (line.startsWith('## ')) {
            return (
              <h2 key={i} className="text-sm font-bold text-forge-text mb-1.5 mt-3">
                {line.slice(3)}
              </h2>
            );
          }
          // H3
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="text-xs font-bold text-forge-text mb-1 mt-2">
                {line.slice(4)}
              </h3>
            );
          }
          // HR
          if (line.trim() === '---') {
            return (
              <hr key={i} className="my-3 border-forge-border" />
            );
          }
          // Bold text
          if (line.includes('**')) {
            const parts = line.split(/(\*\*[^*]+\*\*)/);
            return (
              <p key={i} className="text-forge-text-secondary mb-1">
                {parts.map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={j} className="font-bold text-forge-text">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          }
          // Empty line
          if (line.trim() === '') {
            return <div key={i} className="h-2" />;
          }
          // Normal paragraph
          return (
            <p key={i} className="text-forge-text-secondary mb-1">
              {line}
            </p>
          );
        })}
      </div>
    );
  }, [displayText, outputFormat]);

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* Metadata header */}
      <div className="flex flex-col gap-2 rounded-xl border border-forge-border bg-forge-bg-secondary/40 p-3">
        <h3 className="text-sm font-bold text-forge-text leading-tight">
          {text.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {text.author && (
            <span className="flex items-center gap-1 text-[10px] text-forge-text-secondary">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {text.author}
            </span>
          )}
          {text.date && (
            <span className="flex items-center gap-1 text-[10px] text-forge-text-muted">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {text.date}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-forge-text-muted">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {formatNumber(text.wordCount)} words
          </span>
          <span className="flex items-center gap-1 text-[10px] text-forge-text-muted">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {text.readingTime} min read
          </span>
          {text.language && (
            <Badge variant="default">{text.language.toUpperCase()}</Badge>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          iconLeft={
            copied ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-primary" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )
          }
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          iconLeft={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
        >
          Export
        </Button>

        <div className="flex-1" />

        {/* Typewriter cursor indicator */}
        {typewriterEnabled && displayText.length < formattedOutput.length && (
          <span className="text-accent-primary animate-pulse text-sm font-mono">|</span>
        )}
      </div>

      {/* Text content */}
      <div className="rounded-xl border border-forge-border bg-forge-bg-secondary/30 p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent">
        {renderedContent}
      </div>
    </div>
  );
};

export default React.memo(TextPreview);
