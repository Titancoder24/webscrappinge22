import React, { useState, useCallback, useMemo } from 'react';
import { useStore } from '../../../store';
import TemplateCard from './TemplateCard';
import SaveTemplateModal from './SaveTemplateModal';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import type { Template } from '../../../../types/template';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = 'grid' | 'list';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TemplatesView: React.FC = () => {
  const templates = useStore((s) => s.templates);
  const removeTemplate = useStore((s) => s.removeTemplate);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const setActiveTool = useStore((s) => s.setActiveTool);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [templates, searchQuery]);

  // Apply template and switch to list extractor
  const handleApply = useCallback(
    (id: string) => {
      const template = applyTemplate(id);
      if (template) {
        setActiveTool('list-extractor');
      }
    },
    [applyTemplate, setActiveTool],
  );

  // Edit template
  const handleEdit = useCallback(
    (id: string) => {
      const template = templates.find((t) => t.id === id);
      if (template) {
        setEditingTemplate(template);
        setShowSaveModal(true);
      }
    },
    [templates],
  );

  // Delete template
  const handleDelete = useCallback(
    (id: string) => {
      removeTemplate(id);
    },
    [removeTemplate],
  );

  // Close save modal
  const handleCloseSaveModal = useCallback(() => {
    setShowSaveModal(false);
    setEditingTemplate(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-forge-text flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Templates
          {templates.length > 0 && (
            <Badge variant="default">{templates.length}</Badge>
          )}
        </h2>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingTemplate(null);
            setShowSaveModal(true);
          }}
          iconLeft={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          New from Current
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent">
        <div className="flex flex-col gap-3">
          {/* Search and view controls */}
          {templates.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex-1 relative">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forge-text-muted pointer-events-none"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-forge-bg-secondary border border-forge-border text-xs text-forge-text placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              {/* View mode toggle */}
              <div className="flex rounded-md border border-forge-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={[
                    'p-1.5 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-accent-primary/15 text-accent-primary'
                      : 'bg-forge-bg-secondary text-forge-text-muted hover:text-forge-text-secondary',
                  ].join(' ')}
                  title="Grid view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={[
                    'p-1.5 transition-colors',
                    viewMode === 'list'
                      ? 'bg-accent-primary/15 text-accent-primary'
                      : 'bg-forge-bg-secondary text-forge-text-muted hover:text-forge-text-secondary',
                  ].join(' ')}
                  title="List view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Template grid/list */}
          {filteredTemplates.length > 0 && (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-3'
                  : 'flex flex-col gap-2'
              }
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  viewMode={viewMode}
                  onApply={handleApply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* No search results */}
          {templates.length > 0 && filteredTemplates.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 animate-fade-in">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-forge-text-muted" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm font-medium text-forge-text-secondary">No matching templates</p>
              <p className="text-xs text-forge-text-muted">
                Try a different search term
              </p>
            </div>
          )}

          {/* Empty state */}
          {templates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-primary" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <div className="text-center max-w-[240px]">
                <p className="text-sm font-bold text-forge-text mb-1">No templates yet</p>
                <p className="text-xs text-forge-text-muted leading-relaxed">
                  Templates save your extraction configuration for reuse.
                  Run an extraction first, then click "New from Current" to
                  save it as a template.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTool('list-extractor')}
                iconLeft={
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                }
              >
                Go to List Extractor
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <SaveTemplateModal
          template={editingTemplate}
          onClose={handleCloseSaveModal}
        />
      )}
    </div>
  );
};

export default TemplatesView;
