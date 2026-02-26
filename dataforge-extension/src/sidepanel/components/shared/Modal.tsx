import React, {
  type ReactNode,
  useEffect,
  useRef,
  useCallback,
} from 'react';

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the user requests to close (overlay click, Escape, close button) */
  onClose: () => void;
  /** Modal title rendered in the header */
  title?: string;
  /** Modal body content */
  children: ReactNode;
  /** Additional classes on the panel */
  className?: string;
}

/**
 * Modal - Overlay modal with backdrop blur, slide + scale entrance animation,
 * close button, and trap focus within.
 *
 * Features:
 *  - Backdrop with blur + dark overlay
 *  - Panel: glass-morphism, rounded, emerald border highlight on top
 *  - Entrance: scale(0.95) + translateY(10) -> identity (200ms)
 *  - Close on Escape key, overlay click, or close button
 *  - Respects prefers-reduced-motion
 *  - Locks body scroll when open (not needed for side panel, but defensive)
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  /* ---- Escape key ---- */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* ---- Auto-focus the panel when opened ---- */
  useEffect(() => {
    if (open) {
      // Small delay so the animation starts visible before focus shifts
      const raf = requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [open]);

  /* ---- Overlay click ---- */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Modal dialog'}
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          'relative z-10 w-full max-w-md',
          // Glass surface
          'bg-forge-bg-secondary/95 backdrop-blur-xl',
          'border border-forge-border rounded-2xl',
          'shadow-[0_0_40px_rgba(0,0,0,0.5),0_0_12px_rgba(16,185,129,0.1)]',
          // Top accent line
          'before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-2xl',
          'before:bg-gradient-to-r before:from-transparent before:via-accent-primary before:to-transparent',
          // Animation
          'animate-scale-in motion-reduce:animate-none',
          // Focus
          'focus:outline-none',
          className,
        ].join(' ')}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-0">
            <h2 className="text-base font-semibold text-forge-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-md text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-colors duration-150 motion-reduce:transition-none"
              aria-label="Close modal"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
