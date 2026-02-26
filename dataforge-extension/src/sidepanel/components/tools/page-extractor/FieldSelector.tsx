import React, { useCallback, useState } from 'react';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import { sendRuntimeMessage, getActiveTab } from '../../../../utils/chrome-api';
import type { DetectedField, DataType } from '../../../../types/extraction';
import { generatePrefixedId } from '../../../../utils/id';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FieldSelectorProps {
  fields: DetectedField[];
  onFieldsChange: (fields: DetectedField[]) => void;
  onAddField: () => void;
  sampleUrl?: string;
}

const DATA_TYPE_LABELS: Record<DataType, string> = {
  text: 'Text',
  number: 'Number',
  price: 'Price',
  url: 'URL',
  image: 'Image',
  email: 'Email',
  date: 'Date',
  rating: 'Rating',
  phone: 'Phone',
  location: 'Location',
};

const DATA_TYPE_ICONS: Record<DataType, string> = {
  text: 'Aa',
  number: '#',
  price: '$',
  url: '//',
  image: 'IMG',
  email: '@',
  date: 'Cal',
  rating: 'Star',
  phone: 'Ph',
  location: 'Loc',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FieldSelector: React.FC<FieldSelectorProps> = ({
  fields,
  onFieldsChange,
  onAddField,
  sampleUrl,
}) => {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [testingFieldId, setTestingFieldId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string[]>>({});

  // Toggle field enabled
  const handleToggle = useCallback(
    (id: string) => {
      onFieldsChange(
        fields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
      );
    },
    [fields, onFieldsChange],
  );

  // Start renaming
  const handleStartRename = useCallback((field: DetectedField) => {
    setEditingFieldId(field.id);
    setEditName(field.name);
  }, []);

  // Commit rename
  const handleCommitRename = useCallback(
    (id: string) => {
      if (editName.trim()) {
        onFieldsChange(
          fields.map((f) => (f.id === id ? { ...f, name: editName.trim() } : f)),
        );
      }
      setEditingFieldId(null);
      setEditName('');
    },
    [editName, fields, onFieldsChange],
  );

  // Change data type
  const handleTypeChange = useCallback(
    (id: string, dataType: DataType) => {
      onFieldsChange(
        fields.map((f) => (f.id === id ? { ...f, dataType } : f)),
      );
    },
    [fields, onFieldsChange],
  );

  // Remove field
  const handleRemove = useCallback(
    (id: string) => {
      onFieldsChange(fields.filter((f) => f.id !== id));
    },
    [fields, onFieldsChange],
  );

  // Test field on sample page
  const handleTestField = useCallback(
    async (field: DetectedField) => {
      setTestingFieldId(field.id);
      try {
        const tab = await getActiveTab();
        if (!tab?.id) return;

        const response = await sendRuntimeMessage<{
          matchCount: number;
          sampleValues: string[];
        }>({
          type: 'TEST_SELECTOR',
          selector: field.relativeSelector,
        });

        if (response) {
          setTestResults((prev) => ({
            ...prev,
            [field.id]: response.sampleValues ?? [],
          }));
        }
      } catch {
        setTestResults((prev) => ({
          ...prev,
          [field.id]: ['Error: Could not test selector'],
        }));
      } finally {
        setTestingFieldId(null);
      }
    },
    [],
  );

  // Reorder field (move up/down)
  const handleMoveField = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const idx = fields.findIndex((f) => f.id === id);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= fields.length) return;

      const next = [...fields];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      onFieldsChange(next);
    },
    [fields, onFieldsChange],
  );

  const enabledCount = fields.filter((f) => f.enabled).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-forge-text-secondary">
            Fields
          </label>
          {fields.length > 0 && (
            <Badge variant="success">
              {enabledCount}/{fields.length}
            </Badge>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onAddField}
          iconLeft={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          }
        >
          Click Element
        </Button>
      </div>

      {/* Empty state */}
      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30">
          <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-primary" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-forge-text-secondary">No fields configured</p>
            <p className="text-xs text-forge-text-muted mt-1">
              Click "Click Element" to select elements on the page
            </p>
          </div>
        </div>
      )}

      {/* Field list */}
      {fields.length > 0 && (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={[
                'group rounded-lg border p-3 transition-all duration-200',
                field.enabled
                  ? 'border-accent-primary/20 bg-forge-bg-secondary/60 hover:border-accent-primary/40'
                  : 'border-forge-border/40 bg-forge-bg-secondary/30 opacity-60',
              ].join(' ')}
            >
              <div className="flex items-start gap-2">
                {/* Enable toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(field.id)}
                  className={[
                    'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                    field.enabled
                      ? 'bg-accent-primary border-accent-primary'
                      : 'bg-transparent border-forge-border hover:border-forge-text-muted',
                  ].join(' ')}
                  aria-label={field.enabled ? 'Disable field' : 'Enable field'}
                >
                  {field.enabled && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-forge-bg" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* Field content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* Name (editable) */}
                    {editingFieldId === field.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleCommitRename(field.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommitRename(field.id);
                          if (e.key === 'Escape') setEditingFieldId(null);
                        }}
                        className="h-6 px-1.5 rounded bg-forge-bg-tertiary border border-accent-primary/50 text-xs text-forge-text font-medium focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartRename(field)}
                        className="text-xs font-medium text-forge-text hover:text-accent-primary transition-colors truncate"
                        title="Click to rename"
                      >
                        {field.name}
                      </button>
                    )}

                    {/* Data type badge */}
                    <select
                      value={field.dataType}
                      onChange={(e) => handleTypeChange(field.id, e.target.value as DataType)}
                      className="h-5 px-1 rounded bg-accent-primary/10 text-accent-primary text-[10px] font-semibold border-none focus:outline-none focus:ring-1 focus:ring-accent-primary/50 cursor-pointer appearance-none"
                    >
                      {(Object.keys(DATA_TYPE_LABELS) as DataType[]).map((dt) => (
                        <option key={dt} value={dt}>
                          {DATA_TYPE_LABELS[dt]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector */}
                  <p className="mt-1 text-[10px] font-mono text-forge-text-muted truncate" title={field.relativeSelector}>
                    {field.relativeSelector}
                  </p>

                  {/* Sample values */}
                  {field.sampleValues.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {field.sampleValues.slice(0, 3).map((val, i) => (
                        <span
                          key={i}
                          className="inline-block max-w-[140px] truncate px-1.5 py-0.5 rounded bg-forge-bg-tertiary/60 text-[10px] text-forge-text-muted"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Test results */}
                  {testResults[field.id] && (
                    <div className="mt-2 p-2 rounded bg-forge-bg-tertiary/40 border border-forge-border/30">
                      <p className="text-[10px] font-semibold text-forge-text-secondary mb-1">
                        Test Results ({testResults[field.id].length} values)
                      </p>
                      {testResults[field.id].slice(0, 5).map((val, i) => (
                        <p key={i} className="text-[10px] text-forge-text-muted font-mono truncate">
                          {val}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {/* Move up */}
                  <button
                    type="button"
                    onClick={() => handleMoveField(field.id, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary transition-colors disabled:opacity-30"
                    title="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>

                  {/* Move down */}
                  <button
                    type="button"
                    onClick={() => handleMoveField(field.id, 'down')}
                    disabled={index === fields.length - 1}
                    className="p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary transition-colors disabled:opacity-30"
                    title="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Test */}
                  <button
                    type="button"
                    onClick={() => handleTestField(field)}
                    disabled={testingFieldId === field.id}
                    className="p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-accent-primary transition-colors disabled:opacity-50"
                    title="Test on current page"
                  >
                    {testingFieldId === field.id ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" className="animate-spin" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" className="opacity-25" />
                        <path d="M12 2a10 10 0 0 1 10 10" className="opacity-75" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemove(field.id)}
                    className="p-1 rounded hover:bg-status-error/10 text-forge-text-muted hover:text-status-error transition-colors"
                    title="Remove field"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldSelector;
