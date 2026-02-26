/**
 * SettingsView - Full settings page with collapsible sections.
 *
 * Sections:
 *  1. General   - Theme, animations, notifications, auto-save
 *  2. Extraction - Max items, max pages, delay, robots.txt, etc.
 *  3. Export    - Default format, CSV options, JSON format
 *  4. Advanced  - Selector strategy, scroll speed, debug mode
 *
 * Features:
 *  - Each section is collapsible
 *  - Toggle switches, number inputs, select dropdowns, sliders
 *  - "Reset to Defaults" button at the bottom
 *  - Real-time persistence via useSettings hook
 */

import React, { useCallback } from 'react';
import { useSettings } from '../../hooks/useSettings';
import SettingsSection from './SettingsSection';

// ---------------------------------------------------------------------------
// Shared setting control components
// ---------------------------------------------------------------------------

/** Toggle switch for boolean settings. */
const SettingToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="min-w-0">
      <p className="text-sm text-forge-text">{label}</p>
      {description && (
        <p className="text-xs text-forge-text-muted/60 mt-0.5">{description}</p>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      data-state={checked ? 'checked' : 'unchecked'}
      className="toggle-switch shrink-0"
    >
      <span className="toggle-switch-thumb" />
    </button>
  </div>
);

/** Number input for numeric settings. */
const SettingNumber: React.FC<{
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}> = ({ label, description, value, min, max, step = 1, onChange }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="min-w-0">
      <p className="text-sm text-forge-text">{label}</p>
      {description && (
        <p className="text-xs text-forge-text-muted/60 mt-0.5">{description}</p>
      )}
    </div>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const num = Number(e.target.value);
        if (!isNaN(num)) onChange(num);
      }}
      className={[
        'w-20 h-8 px-2 rounded-lg text-sm text-right tabular-nums',
        'bg-forge-bg-secondary border border-forge-border text-forge-text',
        'focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30',
        'focus:outline-none',
        'transition-all duration-200 motion-reduce:transition-none',
      ].join(' ')}
      aria-label={label}
    />
  </div>
);

/** Select dropdown for enum settings. */
const SettingSelect: React.FC<{
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ label, description, value, options, onChange }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="min-w-0">
      <p className="text-sm text-forge-text">{label}</p>
      {description && (
        <p className="text-xs text-forge-text-muted/60 mt-0.5">{description}</p>
      )}
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={[
        'h-8 px-2 pr-7 rounded-lg text-sm',
        'bg-forge-bg-secondary border border-forge-border text-forge-text',
        'focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30',
        'focus:outline-none appearance-none',
        'transition-all duration-200 motion-reduce:transition-none',
        'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234ADE80%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E")]',
        'bg-[length:16px] bg-[right_4px_center] bg-no-repeat',
      ].join(' ')}
      aria-label={label}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

/** Slider for range settings. */
const SettingSlider: React.FC<{
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}> = ({ label, description, value, min, max, step = 1, unit = '', onChange }) => (
  <div className="py-2">
    <div className="flex items-center justify-between mb-1.5">
      <div className="min-w-0">
        <p className="text-sm text-forge-text">{label}</p>
        {description && (
          <p className="text-xs text-forge-text-muted/60 mt-0.5">{description}</p>
        )}
      </div>
      <span className="text-xs font-mono text-accent-primary tabular-nums shrink-0">
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className={[
        'w-full h-1.5 rounded-full appearance-none cursor-pointer',
        'bg-forge-bg-tertiary',
        '[&::-webkit-slider-thumb]:appearance-none',
        '[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5',
        '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-primary',
        '[&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        '[&::-webkit-slider-thumb]:cursor-pointer',
        '[&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:duration-200',
        '[&::-webkit-slider-thumb]:hover:shadow-[0_0_12px_rgba(16,185,129,0.6)]',
        '[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5',
        '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent-primary',
        '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer',
      ].join(' ')}
      aria-label={label}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();

  // ---- Reset to defaults ----
  const handleReset = useCallback(() => {
    if (window.confirm('Reset all settings to factory defaults? Your current preferences will be lost.')) {
      resetSettings();
    }
  }, [resetSettings]);

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Page title */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-forge-text">Settings</h2>
      </div>

      {/* ---- General ---- */}
      <SettingsSection title="General" icon={'\u{2699}\uFE0F'} defaultExpanded>
        <div className="flex flex-col">
          <SettingToggle
            label="Animations"
            description="Enable UI animations and transitions"
            checked={settings.general.animationsEnabled}
            onChange={(v) => updateSettings({ general: { animationsEnabled: v } })}
          />
          <SettingToggle
            label="Notifications"
            description="Show system notifications on completion"
            checked={settings.general.notificationsEnabled}
            onChange={(v) => updateSettings({ general: { notificationsEnabled: v } })}
          />
          <SettingToggle
            label="Auto-save History"
            description="Automatically save extractions to history"
            checked={settings.general.autoSaveHistory}
            onChange={(v) => updateSettings({ general: { autoSaveHistory: v } })}
          />
        </div>
      </SettingsSection>

      {/* ---- Extraction ---- */}
      <SettingsSection title="Extraction" icon={'\u{26A1}'} defaultExpanded={false}>
        <div className="flex flex-col">
          <SettingSlider
            label="Max Items"
            description="Maximum number of items to extract"
            value={settings.extraction.defaultMaxItems}
            min={10}
            max={10000}
            step={10}
            onChange={(v) => updateSettings({ extraction: { defaultMaxItems: v } })}
          />
          <SettingSlider
            label="Max Pages"
            description="Maximum number of pages to scrape"
            value={settings.extraction.defaultMaxPages}
            min={1}
            max={500}
            onChange={(v) => updateSettings({ extraction: { defaultMaxPages: v } })}
          />
          <SettingSlider
            label="Delay Between Pages"
            description="Wait time in ms between page navigations"
            value={settings.extraction.defaultDelay}
            min={200}
            max={10000}
            step={100}
            unit="ms"
            onChange={(v) => updateSettings({ extraction: { defaultDelay: v } })}
          />
          <SettingToggle
            label="Respect robots.txt"
            description="Honor site crawling directives"
            checked={settings.extraction.respectRobotsTxt}
            onChange={(v) => updateSettings({ extraction: { respectRobotsTxt: v } })}
          />
          <SettingToggle
            label="Auto-clean Data"
            description="Remove extra whitespace and formatting"
            checked={settings.extraction.autoCleanData}
            onChange={(v) => updateSettings({ extraction: { autoCleanData: v } })}
          />
          <SettingToggle
            label="Auto-deduplicate"
            description="Remove duplicate rows automatically"
            checked={settings.extraction.autoDeduplicate}
            onChange={(v) => updateSettings({ extraction: { autoDeduplicate: v } })}
          />
          <SettingNumber
            label="Concurrent Tabs"
            description="Number of tabs for parallel extraction"
            value={settings.extraction.concurrentTabs}
            min={1}
            max={5}
            onChange={(v) => updateSettings({ extraction: { concurrentTabs: v } })}
          />
        </div>
      </SettingsSection>

      {/* ---- Export ---- */}
      <SettingsSection title="Export" icon={'\u{1F4E4}'} defaultExpanded={false}>
        <div className="flex flex-col">
          <SettingSelect
            label="Default Format"
            description="Default file format for exports"
            value={settings.export.defaultFormat}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'xlsx', label: 'Excel (XLSX)' },
              { value: 'json', label: 'JSON' },
            ]}
            onChange={(v) => updateSettings({ export: { defaultFormat: v as 'csv' | 'xlsx' | 'json' } })}
          />
          <SettingSelect
            label="CSV Delimiter"
            description="Column separator for CSV files"
            value={settings.export.csvDelimiter}
            options={[
              { value: ',', label: 'Comma (,)' },
              { value: ';', label: 'Semicolon (;)' },
              { value: '\t', label: 'Tab' },
              { value: '|', label: 'Pipe (|)' },
            ]}
            onChange={(v) => updateSettings({ export: { csvDelimiter: v as ',' | ';' | '\t' | '|' } })}
          />
          <SettingSelect
            label="CSV Encoding"
            description="Character encoding for CSV files"
            value={settings.export.csvEncoding}
            options={[
              { value: 'utf-8', label: 'UTF-8' },
              { value: 'utf-16', label: 'UTF-16' },
              { value: 'ascii', label: 'ASCII' },
            ]}
            onChange={(v) => updateSettings({ export: { csvEncoding: v as 'utf-8' | 'utf-16' | 'ascii' } })}
          />
          <SettingSelect
            label="JSON Format"
            description="Structure of exported JSON data"
            value={settings.export.jsonFormat}
            options={[
              { value: 'array', label: 'Array of arrays' },
              { value: 'nested', label: 'Array of objects' },
            ]}
            onChange={(v) => updateSettings({ export: { jsonFormat: v as 'array' | 'nested' } })}
          />
          <SettingToggle
            label="Include Headers"
            description="Add column headers to exports"
            checked={settings.export.includeHeaders}
            onChange={(v) => updateSettings({ export: { includeHeaders: v } })}
          />
          <SettingToggle
            label="Include Timestamp"
            description="Add extraction timestamp to filename"
            checked={settings.export.includeTimestamp}
            onChange={(v) => updateSettings({ export: { includeTimestamp: v } })}
          />
        </div>
      </SettingsSection>

      {/* ---- Advanced ---- */}
      <SettingsSection title="Advanced" icon={'\u{1F527}'} defaultExpanded={false}>
        <div className="flex flex-col">
          <SettingSelect
            label="Selector Strategy"
            description="Algorithm for generating CSS selectors"
            value={settings.advanced.selectorStrategy}
            options={[
              { value: 'auto', label: 'Auto (recommended)' },
              { value: 'data-attributes', label: 'Data attributes' },
              { value: 'semantic', label: 'Semantic classes' },
              { value: 'structural', label: 'Structural path' },
            ]}
            onChange={(v) =>
              updateSettings({
                advanced: { selectorStrategy: v as 'auto' | 'data-attributes' | 'semantic' | 'structural' },
              })
            }
          />
          <SettingSelect
            label="Scroll Speed"
            description="Speed for infinite scroll extraction"
            value={settings.advanced.scrollSpeed}
            options={[
              { value: 'slow', label: 'Slow' },
              { value: 'medium', label: 'Medium' },
              { value: 'fast', label: 'Fast' },
            ]}
            onChange={(v) => updateSettings({ advanced: { scrollSpeed: v as 'slow' | 'medium' | 'fast' } })}
          />
          <SettingSlider
            label="Mutation Wait"
            description="Time to wait for DOM changes after navigation"
            value={settings.advanced.mutationWaitMs}
            min={500}
            max={10000}
            step={100}
            unit="ms"
            onChange={(v) => updateSettings({ advanced: { mutationWaitMs: v } })}
          />
          <SettingNumber
            label="Max Retries"
            description="Number of retries on extraction errors"
            value={settings.advanced.maxRetries}
            min={0}
            max={10}
            onChange={(v) => updateSettings({ advanced: { maxRetries: v } })}
          />
          <SettingToggle
            label="Debug Mode"
            description="Show detailed logs and debug overlays"
            checked={settings.advanced.debugMode}
            onChange={(v) => updateSettings({ advanced: { debugMode: v } })}
          />
        </div>
      </SettingsSection>

      {/* Reset to Defaults button */}
      <button
        type="button"
        onClick={handleReset}
        className={[
          'w-full flex items-center justify-center gap-2 h-10 mt-2 rounded-xl',
          'text-sm font-medium',
          'text-forge-text-muted border border-forge-border',
          'bg-transparent',
          'hover:text-status-error hover:border-status-error/40',
          'hover:bg-status-error/5',
          'transition-all duration-200 motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50',
        ].join(' ')}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        Reset to Defaults
      </button>

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  );
};

export default SettingsView;
