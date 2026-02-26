import React, { useCallback } from 'react';

export interface TopBarProps {
  /** Callback when the settings gear icon is clicked */
  onSettingsClick?: () => void;
  /** Callback when the minimize button is clicked */
  onMinimizeClick?: () => void;
}

/**
 * TopBar - 56px fixed header bar with DataForge branding, settings, and minimize controls.
 * Features an inline SVG anvil/hammer icon, "DataForge" wordmark with emerald glow,
 * a settings gear icon, and a minimize chevron button.
 */
const TopBar: React.FC<TopBarProps> = ({ onSettingsClick, onMinimizeClick }) => {
  const handleSettingsClick = useCallback(() => {
    onSettingsClick?.();
  }, [onSettingsClick]);

  const handleMinimizeClick = useCallback(() => {
    onMinimizeClick?.();
  }, [onMinimizeClick]);

  return (
    <header
      className="flex items-center justify-between h-14 px-4 bg-forge-bg/90 backdrop-blur-md border-b border-forge-border shrink-0 select-none"
      role="banner"
    >
      {/* Logo + Wordmark */}
      <div className="flex items-center gap-2.5">
        {/* Anvil/Hammer Icon SVG */}
        <div className="relative flex items-center justify-center w-8 h-8">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
          >
            {/* Anvil base */}
            <path
              d="M4 20h20v2c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-2z"
              fill="url(#anvil-gradient)"
            />
            {/* Anvil body */}
            <path
              d="M6 16h16c1.1 0 2 .9 2 2v2H4v-2c0-1.1.9-2 2-2z"
              fill="url(#anvil-gradient)"
              fillOpacity="0.85"
            />
            {/* Anvil horn */}
            <path
              d="M8 16l-3-4h6l-3 4z"
              fill="url(#anvil-gradient)"
              fillOpacity="0.7"
            />
            {/* Anvil top surface */}
            <path
              d="M9 12h10c.55 0 1 .45 1 1v3H8v-3c0-.55.45-1 1-1z"
              fill="url(#anvil-gradient)"
              fillOpacity="0.95"
            />
            {/* Hammer */}
            <path
              d="M12 4h4v3h-4V4z"
              fill="#14B8A6"
              rx="0.5"
            />
            {/* Hammer handle */}
            <path
              d="M13.5 7v5"
              stroke="#14B8A6"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Hammer head */}
            <rect
              x="10"
              y="2"
              width="8"
              height="3"
              rx="1"
              fill="url(#hammer-gradient)"
            />
            {/* Spark */}
            <circle cx="20" cy="10" r="1" fill="#10B981" opacity="0.8">
              <animate
                attributeName="opacity"
                values="0.8;0.2;0.8"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="22" cy="8" r="0.6" fill="#14B8A6" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.6;0.1;0.6"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>
            <defs>
              <linearGradient id="anvil-gradient" x1="4" y1="12" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#14B8A6" />
              </linearGradient>
              <linearGradient id="hammer-gradient" x1="10" y1="2" x2="18" y2="5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#14B8A6" />
                <stop offset="1" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Wordmark */}
        <span
          className="text-lg font-bold tracking-wide text-forge-text"
          style={{
            textShadow: '0 0 12px rgba(16, 185, 129, 0.5), 0 0 4px rgba(16, 185, 129, 0.3)',
          }}
        >
          Data
          <span className="text-accent-primary">Forge</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Settings gear */}
        <button
          type="button"
          onClick={handleSettingsClick}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          aria-label="Open settings"
          title="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Minimize */}
        <button
          type="button"
          onClick={handleMinimizeClick}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          aria-label="Minimize panel"
          title="Minimize"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
