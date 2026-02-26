import React, { useEffect, useRef, useState, useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  /** Unique identifier */
  id: string;
  /** Toast variant */
  variant: ToastVariant;
  /** Message content */
  message: string;
  /** Auto-dismiss duration in ms. 0 = manual dismiss only. Default 3000 */
  duration?: number;
}

export interface ToastProps extends ToastData {
  /** Called when the toast should be removed */
  onDismiss: (id: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Variant config                                                            */
/* -------------------------------------------------------------------------- */

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; borderColor: string; progressColor: string; iconColor: string }
> = {
  success: {
    borderColor: 'border-l-status-success',
    progressColor: 'bg-status-success',
    iconColor: 'text-status-success',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    borderColor: 'border-l-status-error',
    progressColor: 'bg-status-error',
    iconColor: 'text-status-error',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  warning: {
    borderColor: 'border-l-status-warning',
    progressColor: 'bg-status-warning',
    iconColor: 'text-status-warning',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    borderColor: 'border-l-status-info',
    progressColor: 'bg-status-info',
    iconColor: 'text-status-info',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

/* -------------------------------------------------------------------------- */
/*  Single Toast                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Toast - Notification toast with variant styling, slide-in animation,
 * auto-dismiss countdown, and progress bar.
 */
const Toast: React.FC<ToastProps> = ({
  id,
  variant,
  message,
  duration = 3000,
  onDismiss,
}) => {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const config = variantConfig[variant];

  const dismiss = useCallback(() => {
    setExiting(true);
    // Wait for exit animation
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss]);

  // Auto-dismiss timer + progress bar animation
  useEffect(() => {
    if (duration <= 0) return;

    startRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / duration);
      setProgress(remaining * 100);

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      dismiss();
    }, duration);

    return () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [duration, dismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'relative flex items-start gap-2.5 w-72 px-3 py-3 rounded-lg overflow-hidden',
        'bg-forge-bg-secondary/95 backdrop-blur-xl',
        'border border-forge-border border-l-[3px]',
        config.borderColor,
        'shadow-[0_4px_20px_rgba(0,0,0,0.4)]',
        // Entrance / exit animation
        exiting
          ? 'opacity-0 translate-x-4 transition-all duration-200 motion-reduce:transition-none'
          : 'animate-slide-in-right motion-reduce:animate-none',
      ].join(' ')}
    >
      {/* Icon */}
      <span className={`shrink-0 mt-0.5 ${config.iconColor}`}>{config.icon}</span>

      {/* Message */}
      <p className="flex-1 text-sm text-forge-text leading-snug">{message}</p>

      {/* Close button */}
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 flex items-center justify-center w-5 h-5 rounded text-forge-text-muted hover:text-forge-text transition-colors duration-100 motion-reduce:transition-none"
        aria-label="Dismiss notification"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forge-border/20" aria-hidden="true">
          <div
            className={`h-full ${config.progressColor} motion-reduce:[transition:none]`}
            style={{
              width: `${progress}%`,
              transition: 'width 100ms linear',
            }}
          />
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Toast Container (renders a stack of toasts)                               */
/* -------------------------------------------------------------------------- */

export interface ToastContainerProps {
  /** Active toasts */
  toasts: ToastData[];
  /** Remove a toast by id */
  onDismiss: (id: string) => void;
}

/**
 * ToastContainer - Positioned container that renders a stack of toasts
 * in the top-right of the viewport.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-3 right-3 z-[200] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default Toast;
