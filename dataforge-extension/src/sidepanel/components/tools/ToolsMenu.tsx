/**
 * ToolsMenu - Home screen showing all available extraction tools.
 *
 * Layout:
 *  1. Quick Extract button at the top (one-click auto-detect)
 *  2. Six ToolCards arranged vertically:
 *     - List Extractor, Page Extractor, Email Extractor
 *     - Image Downloader, Text Extractor, Templates
 *  3. Staggered entrance animation (50ms delay between cards)
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { useAnimations } from '../../hooks/useAnimations';
import type { ToolType } from '../../../types/extraction';
import ToolCard from './ToolCard';
import QuickExtractButton from './QuickExtractButton';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

interface ToolDefinition {
  id: ToolType;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

const TOOLS: ToolDefinition[] = [
  {
    id: 'list-extractor',
    icon: '\u{1F4CB}',
    title: 'List Extractor',
    description: 'Extract repeating items like products, listings, and tables',
  },
  {
    id: 'page-extractor',
    icon: '\u{1F4C4}',
    title: 'Page Extractor',
    description: 'Scrape structured data from single or multiple pages',
  },
  {
    id: 'email-extractor',
    icon: '\u{1F4E7}',
    title: 'Email Extractor',
    description: 'Find and collect email addresses from any webpage',
  },
  {
    id: 'image-downloader',
    icon: '\u{1F5BC}\uFE0F',
    title: 'Image Downloader',
    description: 'Bulk download images with filtering by size and type',
  },
  {
    id: 'text-extractor',
    icon: '\u{1F4DD}',
    title: 'Text Extractor',
    description: 'Extract clean text content, articles, and paragraphs',
  },
  {
    id: 'templates',
    icon: '\u{1F4BE}',
    title: 'Templates',
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
      {/* Quick Extract Button */}
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
