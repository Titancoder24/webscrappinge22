import React, { useCallback } from 'react';
import type { CrawlSettings } from './EmailExtractorView';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrawlConfigProps {
  settings: CrawlSettings;
  onChange: (settings: CrawlSettings) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CrawlConfig: React.FC<CrawlConfigProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  const update = useCallback(
    (partial: Partial<CrawlSettings>) => {
      onChange({ ...settings, ...partial });
    },
    [settings, onChange],
  );

  return (
    <div
      className={[
        'flex flex-col gap-4 rounded-xl border border-forge-border bg-forge-bg-secondary/40 p-4',
        disabled ? 'opacity-50 pointer-events-none' : '',
      ].join(' ')}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-forge-text-secondary flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Crawl Configuration
      </h3>

      {/* Depth slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-forge-text-secondary">
            Crawl Depth
          </label>
          <span className="text-xs font-mono font-bold text-accent-primary">
            {settings.depth} {settings.depth === 1 ? 'level' : 'levels'}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={settings.depth}
          onChange={(e) => update({ depth: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-forge-border accent-accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-forge-text-muted font-mono">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>

      {/* Max pages input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-forge-text-secondary">
          Max Pages
        </label>
        <input
          type="number"
          min={1}
          max={500}
          value={settings.maxPages}
          onChange={(e) => update({ maxPages: Math.max(1, Math.min(500, Number(e.target.value) || 1)) })}
          className="h-8 px-3 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-xs text-forge-text font-mono focus:outline-none focus:border-accent-primary/50 transition-colors"
        />
      </div>

      {/* Delay slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-forge-text-secondary">
            Delay Between Requests
          </label>
          <span className="text-xs font-mono font-bold text-accent-primary">
            {(settings.delayMs / 1000).toFixed(1)}s
          </span>
        </div>
        <input
          type="range"
          min={500}
          max={5000}
          step={250}
          value={settings.delayMs}
          onChange={(e) => update({ delayMs: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-forge-border accent-accent-primary cursor-pointer"
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        {/* Respect robots.txt */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={[
              'relative w-9 h-5 rounded-full transition-colors duration-200',
              settings.respectRobots ? 'bg-accent-primary' : 'bg-forge-border',
            ].join(' ')}
            onClick={() => update({ respectRobots: !settings.respectRobots })}
          >
            <div
              className={[
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                settings.respectRobots ? 'translate-x-[18px]' : 'translate-x-0.5',
              ].join(' ')}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-forge-text-secondary group-hover:text-forge-text transition-colors">
              Respect robots.txt
            </span>
            <span className="text-[10px] text-forge-text-muted">
              Skip disallowed paths
            </span>
          </div>
        </label>

        {/* Internal links only */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={[
              'relative w-9 h-5 rounded-full transition-colors duration-200',
              settings.internalOnly ? 'bg-accent-primary' : 'bg-forge-border',
            ].join(' ')}
            onClick={() => update({ internalOnly: !settings.internalOnly })}
          >
            <div
              className={[
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                settings.internalOnly ? 'translate-x-[18px]' : 'translate-x-0.5',
              ].join(' ')}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-forge-text-secondary group-hover:text-forge-text transition-colors">
              Internal links only
            </span>
            <span className="text-[10px] text-forge-text-muted">
              Stay on the same domain
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default React.memo(CrawlConfig);
