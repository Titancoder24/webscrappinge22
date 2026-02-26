import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import type { EmailEntry } from './EmailExtractorView';
import { formatDate } from '../../../../utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailResultsProps {
  emails: EmailEntry[];
}

interface DomainGroup {
  domain: string;
  emails: EmailEntry[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EmailResults: React.FC<EmailResultsProps> = ({ emails }) => {
  const [groupByDomain, setGroupByDomain] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(emails.length);

  // Track newly added emails for ripple animation
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (emails.length > prevCountRef.current) {
      const newEmails = emails.slice(prevCountRef.current);
      const newIds = new Set(newEmails.map((e) => e.id));
      setAnimatingIds((prev) => new Set([...prev, ...newIds]));

      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setAnimatingIds((prev) => {
          const next = new Set(prev);
          for (const id of newIds) next.delete(id);
          return next;
        });
      }, 600);

      // Auto-scroll to bottom
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }

      prevCountRef.current = emails.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = emails.length;
  }, [emails]);

  // Domain groups
  const domainGroups: DomainGroup[] = useMemo(() => {
    if (!groupByDomain) return [];

    const map = new Map<string, EmailEntry[]>();
    for (const email of emails) {
      const domain = email.email.split('@')[1] || 'unknown';
      const existing = map.get(domain) || [];
      existing.push(email);
      map.set(domain, existing);
    }

    return Array.from(map.entries())
      .map(([domain, entries]) => ({ domain, emails: entries }))
      .sort((a, b) => b.emails.length - a.emails.length);
  }, [emails, groupByDomain]);

  // Extract domain from email
  const getEmailDomain = (email: string): string => {
    return email.split('@')[1] || '';
  };

  // Copy single email
  const handleCopyEmail = useCallback(async (email: string, id: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Silent fail
    }
  }, []);

  // Copy all emails
  const handleCopyAll = useCallback(async () => {
    try {
      const text = emails.map((e) => e.email).join('\n');
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Silent fail
    }
  }, [emails]);

  // Export as CSV
  const handleExport = useCallback(() => {
    const header = 'Email,Source URL,Page Title,Found At\n';
    const rows = emails
      .map((e) =>
        [
          `"${e.email}"`,
          `"${e.sourceUrl}"`,
          `"${e.pageTitle}"`,
          `"${new Date(e.foundAt).toISOString()}"`,
        ].join(','),
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataforge-emails-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [emails]);

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-forge-text-secondary">
            Results
          </h3>
          <Badge variant="success">{emails.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Group by domain toggle */}
          <button
            type="button"
            onClick={() => setGroupByDomain(!groupByDomain)}
            className={[
              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors',
              groupByDomain
                ? 'bg-accent-primary/15 text-accent-primary'
                : 'bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary',
            ].join(' ')}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Group
          </button>

          {/* Copy all */}
          <Button variant="ghost" size="sm" onClick={handleCopyAll}>
            {copiedAll ? (
              <span className="text-accent-primary text-[10px]">Copied!</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </Button>

          {/* Export */}
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Email list */}
      <div
        ref={listRef}
        className="flex flex-col gap-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent rounded-lg border border-forge-border bg-forge-bg-secondary/30 p-2"
      >
        {!groupByDomain ? (
          // Flat list
          emails.map((entry) => (
            <div
              key={entry.id}
              className={[
                'relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group',
                'hover:bg-forge-bg-tertiary/40',
                animatingIds.has(entry.id) ? 'animate-slide-in-right' : '',
              ].join(' ')}
            >
              {/* Ripple animation for new entries */}
              {animatingIds.has(entry.id) && (
                <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                  <div
                    className="absolute inset-0 animate-shockwave opacity-20 rounded-lg"
                    style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4), transparent)' }}
                  />
                </div>
              )}

              {/* Email icon */}
              <div className="w-6 h-6 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-accent-primary">@</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-forge-text truncate">{entry.email}</p>
                <p className="text-[10px] text-forge-text-muted truncate" title={entry.sourceUrl}>
                  {entry.pageTitle || entry.sourceUrl}
                </p>
              </div>

              {/* Timestamp */}
              <span className="text-[9px] text-forge-text-muted font-mono shrink-0 hidden group-hover:inline">
                {formatDate(entry.foundAt, 'relative')}
              </span>

              {/* Copy button */}
              <button
                type="button"
                onClick={() => handleCopyEmail(entry.email, entry.id)}
                className="p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-accent-primary transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                title="Copy email"
              >
                {copiedId === entry.id ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-primary" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          ))
        ) : (
          // Grouped by domain
          domainGroups.map((group) => (
            <div key={group.domain} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-forge-bg-tertiary/30 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forge-text-secondary">
                  @{group.domain}
                </span>
                <Badge variant="default">{group.emails.length}</Badge>
              </div>
              {group.emails.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-forge-bg-tertiary/20 group transition-colors"
                >
                  <p className="flex-1 text-xs text-forge-text truncate">{entry.email}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(entry.email, entry.id)}
                    className="p-1 rounded text-forge-text-muted hover:text-accent-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {copiedId === entry.id ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-primary" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(EmailResults);
