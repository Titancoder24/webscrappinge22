/**
 * ToolsMenu - Home screen showing all available extraction tools.
 *
 * Layout:
 *  1. Instant Extract button at the top (one-click auto-detect)
 *  2. Six ToolCards arranged vertically
 *  3. Staggered entrance animation (50ms delay between cards)
 */

import React, { useMemo, type ReactNode } from 'react';
import { useStore } from '../../store';
import { useAnimations } from '../../hooks/useAnimations';
import type { ToolType } from '../../../types/extraction';
import ToolCard from './ToolCard';
import QuickExtractButton from './QuickExtractButton';

// ---------------------------------------------------------------------------
// Tool definitions with inline SVG icons
// ---------------------------------------------------------------------------

interface ToolDefinition {
  id: ToolType;
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
}

const TOOLS: ToolDefinition[] = [
  {
    id: 'list-extractor',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    ),
    title: 'Structured Data',
    description: 'Extract repeating items like products, listings, and tables',
  },
  {
    id: 'page-extractor',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: 'Page Harvester',
    description: 'Scrape structured fields from single or multiple pages',
  },
  {
    id: 'email-extractor',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Contact Finder',
    description: 'Discover and collect email addresses from any webpage',
  },
  {
    id: 'image-downloader',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    title: 'Media Collector',
    description: 'Bulk download images with filtering by size and type',
  },
  {
    id: 'text-extractor',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: 'Content Parser',
    description: 'Extract clean text, articles, and paragraphs from pages',
  },
  {
    id: 'templates',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: 'Presets',
    description: 'Save and reuse extraction configurations across sites',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ToolsMenu: React.FC = () => {
  const setActiveTool = useStore((s) => s.setActiveTool);
  const { shouldAnimate, staggerDelay } = useAnimations();

  const toolCards = useMemo(
    () =>
      TOOLS.map((tool, index) => (
        <ToolCard
          key={tool.id}
          icon={tool.icon}
          title={tool.title}
          description={tool.description}
          badge={tool.badge}
          onClick={() => setActiveTool(tool.id)}
          style={shouldAnimate ? staggerDelay(index + 1, 50) : undefined}
          className={shouldAnimate ? 'animate-[staggerFadeInUp_0.4s_ease-out]' : ''}
        />
      )),
    [setActiveTool, shouldAnimate, staggerDelay],
  );

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Instant Extract Button */}
      <div
        style={shouldAnimate ? staggerDelay(0, 50) : undefined}
        className={shouldAnimate ? 'animate-[staggerFadeInUp_0.4s_ease-out]' : ''}
      >
        <QuickExtractButton />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-px bg-forge-border/60" />
        <span className="text-[10px] font-semibold tracking-widest uppercase text-forge-text-muted/60">
          Tools
        </span>
        <div className="flex-1 h-px bg-forge-border/60" />
      </div>

      {/* Tool Cards */}
      {toolCards}
    </div>
  );
};

export default ToolsMenu;
