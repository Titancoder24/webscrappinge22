import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../../../store';
import Button from '../../shared/Button';
import { generatePrefixedId } from '../../../../utils/id';
import { getActiveTab } from '../../../../utils/chrome-api';
import type { Template } from '../../../../types/template';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaveTemplateModalProps {
  /** Existing template to edit, or null to create new */
  template: Template | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ template, onClose }) => {
  const addTemplate = useStore((s) => s.addTemplate);
  const updateTemplate = useStore((s) => s.updateTemplate);
  const buildExtractionConfig = useStore((s) => s.buildExtractionConfig);

  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [domain, setDomain] = useState(template?.domain ?? '');
  const [urlPattern, setUrlPattern] = useState(template?.urlPattern ?? '');
  const [saving, setSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const isEditing = template !== null;

  // Auto-detect domain from current tab
  useEffect(() => {
    if (!domain) {
      getActiveTab()
        .then((tab) => {
          if (tab?.url) {
            try {
              const parsed = new URL(tab.url);
              setDomain(parsed.hostname);
              if (!urlPattern) {
                setUrlPattern(parsed.pathname.replace(/\/[^/]*$/, '/*'));
              }
            } catch {
              // Silent fail
            }
          }
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  // Save handler
  const handleSave = useCallback(async () => {
    if (!name.trim()) return;

    setSaving(true);

    try {
      if (isEditing && template) {
        updateTemplate(template.id, {
          name: name.trim(),
          description: description.trim(),
          domain: domain.trim(),
          urlPattern: urlPattern.trim(),
        });
      } else {
        const config = buildExtractionConfig();
        const now = Date.now();

        const newTemplate: Template = {
          id: generatePrefixedId('tmpl'),
          name: name.trim(),
          description: description.trim(),
          domain: domain.trim(),
          urlPattern: urlPattern.trim(),
          config,
          createdAt: now,
          updatedAt: now,
          lastUsed: 0,
          useCount: 0,
          successRate: 1.0,
        };

        addTemplate(newTemplate);
      }

      onClose();
    } catch {
      // Handle error silently
    } finally {
      setSaving(false);
    }
  }, [name, description, domain, urlPattern, isEditing, template, buildExtractionConfig, addTemplate, updateTemplate, onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forge-bg/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm rounded-xl border border-forge-border bg-forge-bg-secondary shadow-2xl shadow-accent-primary/5 animate-scale-in">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-sm font-bold text-forge-text flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            {isEditing ? 'Edit Template' : 'Save Template'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary transition-colors"
            aria-label="Close modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4 px-5 pb-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="template-name"
              className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary"
            >
              Name <span className="text-status-error">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amazon Product Listings"
              className="h-9 px-3 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-sm text-forge-text placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="template-description"
              className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary"
            >
              Description
            </label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template extracts..."
              rows={3}
              className="px-3 py-2 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-sm text-forge-text placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Domain (auto-detected) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="template-domain"
              className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary flex items-center gap-1.5"
            >
              Domain
              <span className="text-[9px] font-normal normal-case text-forge-text-muted">(auto-detected)</span>
            </label>
            <div className="flex items-center gap-2">
              {domain && (
                <div className="w-5 h-5 rounded bg-forge-bg-tertiary flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`}
                    alt=""
                    width={12}
                    height={12}
                    className="w-3 h-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <input
                id="template-domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 h-9 px-3 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* URL Pattern */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="template-url-pattern"
              className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary"
            >
              URL Pattern
            </label>
            <input
              id="template-url-pattern"
              type="text"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              placeholder="/products/*"
              className="h-9 px-3 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
            />
            <p className="text-[9px] text-forge-text-muted">
              Use * as wildcard. Template will auto-suggest on matching URLs.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-forge-border/50">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={!name.trim()}
              iconLeft={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              }
            >
              {isEditing ? 'Update' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveTemplateModal;
