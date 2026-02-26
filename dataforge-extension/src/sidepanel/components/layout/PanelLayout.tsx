import React from 'react';
import TopBar, { type TopBarProps } from './TopBar';
import Navigation, { type NavigationTab, type NavigationProps } from './Navigation';
import BottomBar, { type BottomBarProps } from './BottomBar';

export interface PanelLayoutProps {
  /** TopBar callbacks */
  onSettingsClick?: TopBarProps['onSettingsClick'];
  onMinimizeClick?: TopBarProps['onMinimizeClick'];

  /** Navigation state */
  activeTab: NavigationProps['activeTab'];
  onTabChange: NavigationProps['onTabChange'];
  tabBadges?: NavigationProps['badges'];

  /** BottomBar — only rendered when visible is true */
  bottomBar?: BottomBarProps & { visible: boolean };

  /** Main content area */
  children: React.ReactNode;
}

/**
 * PanelLayout - Root layout wrapper for the DataForge side panel.
 *
 * Structure (top to bottom):
 *  1. TopBar   — 56px fixed header with branding and controls
 *  2. Navigation — 44px segmented tab control
 *  3. Content  — Scrollable main area (fills remaining space)
 *  4. BottomBar — 56px contextual footer (shown during extraction)
 *
 * The layout uses a flex column that fills the entire viewport height.
 * The content area scrolls independently via overflow-y-auto.
 */
const PanelLayout: React.FC<PanelLayoutProps> = ({
  onSettingsClick,
  onMinimizeClick,
  activeTab,
  onTabChange,
  tabBadges,
  bottomBar,
  children,
}) => {
  const showBottomBar = bottomBar?.visible ?? false;

  return (
    <div className="flex flex-col h-screen w-full bg-forge-bg text-forge-text overflow-hidden">
      {/* Top Bar — branding, settings, minimize */}
      <TopBar onSettingsClick={onSettingsClick} onMinimizeClick={onMinimizeClick} />

      {/* Navigation — TOOLS | HISTORY | DATA tabs */}
      <Navigation activeTab={activeTab} onTabChange={onTabChange} badges={tabBadges} />

      {/* Content area — scrollable, fills remaining vertical space */}
      <main
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent"
      >
        {children}
      </main>

      {/* Bottom Bar — contextual extraction controls */}
      {showBottomBar && bottomBar && (
        <BottomBar
          itemsCount={bottomBar.itemsCount}
          elapsedTime={bottomBar.elapsedTime}
          progress={bottomBar.progress}
          isPaused={bottomBar.isPaused}
          onPause={bottomBar.onPause}
          onResume={bottomBar.onResume}
          onStop={bottomBar.onStop}
          onViewData={bottomBar.onViewData}
        />
      )}
    </div>
  );
};

export default PanelLayout;
