import React from 'react';

export interface StepDefinition {
  /** Step label text */
  label: string;
}

export type StepStatus = 'completed' | 'active' | 'future';

export interface StepIndicatorProps {
  /** Array of step definitions */
  steps: StepDefinition[];
  /** Zero-based index of the currently active step */
  activeStep: number;
  /** Set of completed step indices */
  completedSteps?: Set<number>;
  /** Callback when a completed or active step is clicked */
  onStepClick?: (index: number) => void;
  /** Additional classes */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Checkmark icon                                                            */
/* -------------------------------------------------------------------------- */

const CheckIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  StepIndicator                                                             */
/* -------------------------------------------------------------------------- */

/**
 * StepIndicator - Horizontal step progress for the List Extractor flow.
 *
 * Visual states:
 *  - Completed: emerald circle with checkmark + solid emerald connector
 *  - Active: pulsing emerald ring with step number
 *  - Future: muted circle with step number + muted connector
 *
 * Supports keyboard navigation and respects prefers-reduced-motion.
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  activeStep,
  completedSteps = new Set(),
  onStepClick,
  className = '',
}) => {
  const getStatus = (index: number): StepStatus => {
    if (completedSteps.has(index)) return 'completed';
    if (index === activeStep) return 'active';
    return 'future';
  };

  return (
    <div
      className={`flex items-center w-full ${className}`}
      role="list"
      aria-label="Progress steps"
    >
      {steps.map((step, index) => {
        const status = getStatus(index);
        const isClickable = status === 'completed' || status === 'active';
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            {/* Step node */}
            <div
              role="listitem"
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              {/* Circle */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(index)}
                aria-label={`Step ${index + 1}: ${step.label} (${status})`}
                aria-current={status === 'active' ? 'step' : undefined}
                className={[
                  'relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
                  'transition-all duration-200 motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-forge-bg',
                  // Completed
                  status === 'completed'
                    ? 'bg-accent-primary text-forge-bg cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                    : '',
                  // Active
                  status === 'active'
                    ? [
                        'border-2 border-accent-primary text-accent-primary bg-accent-primary/10',
                        'shadow-[0_0_14px_rgba(16,185,129,0.3)]',
                        'cursor-pointer',
                      ].join(' ')
                    : '',
                  // Future
                  status === 'future'
                    ? 'border border-forge-border text-forge-text-muted bg-forge-bg-tertiary/40 cursor-not-allowed opacity-60'
                    : '',
                ].join(' ')}
              >
                {/* Pulsing ring for active step */}
                {status === 'active' && (
                  <span
                    className="absolute inset-0 rounded-full border-2 border-accent-primary animate-pulse-glow motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
                {status === 'completed' ? <CheckIcon /> : index + 1}
              </button>

              {/* Label */}
              <span
                className={[
                  'text-[10px] font-medium tracking-wide uppercase leading-none whitespace-nowrap',
                  status === 'completed' ? 'text-accent-primary' : '',
                  status === 'active' ? 'text-accent-primary font-semibold' : '',
                  status === 'future' ? 'text-forge-text-muted/60' : '',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {!isLast && (
              <div
                className={[
                  'flex-1 h-px mx-1 mt-[-18px]',
                  'transition-colors duration-300 motion-reduce:transition-none',
                  completedSteps.has(index)
                    ? 'bg-accent-primary shadow-[0_0_4px_rgba(16,185,129,0.3)]'
                    : 'bg-forge-border/50',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
