import React, { useCallback, useMemo } from 'react';
import { useStore, STEP_LABELS, type ListExtractorStep } from '../../../store';
import SelectListStep from './SelectListStep';
import ColumnMapper from './ColumnMapper';
import PaginationConfig from './PaginationConfig';
import ExtractionProgress from './ExtractionProgress';

// ---------------------------------------------------------------------------
// Step indicator (shared-style component, local to this module)
// ---------------------------------------------------------------------------

interface StepIndicatorProps {
  step: ListExtractorStep;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  onClick: (step: ListExtractorStep) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  label,
  isActive,
  isCompleted,
  isClickable,
  onClick,
}) => {
  const handleClick = useCallback(() => {
    if (isClickable) onClick(step);
  }, [step, isClickable, onClick]);

  const stepNumber = step + 1;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left',
        isActive
          ? 'bg-accent-primary/10 border border-accent-primary/30'
          : isCompleted
            ? 'bg-forge-bg-tertiary/30 border border-transparent hover:border-accent-primary/20'
            : 'bg-transparent border border-transparent',
        isClickable && !isActive ? 'cursor-pointer hover:bg-forge-bg-tertiary/40' : '',
        !isClickable && !isActive ? 'opacity-50 cursor-default' : '',
      ].join(' ')}
      aria-current={isActive ? 'step' : undefined}
    >
      {/* Step number / checkmark circle */}
      <div
        className={[
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
          isCompleted
            ? 'bg-accent-primary text-white'
            : isActive
              ? 'border-2 border-accent-primary text-accent-primary'
              : 'border-2 border-forge-border text-forge-text-muted',
        ].join(' ')}
        style={
          isCompleted
            ? { boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }
            : isActive
              ? { boxShadow: '0 0 8px rgba(16, 185, 129, 0.15)' }
              : undefined
        }
      >
        {isCompleted ? (
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
        ) : (
          stepNumber
        )}
      </div>

      {/* Label */}
      <span
        className={[
          'text-xs font-semibold transition-colors duration-200',
          isActive
            ? 'text-accent-primary'
            : isCompleted
              ? 'text-forge-text-secondary'
              : 'text-forge-text-muted',
        ].join(' ')}
        style={
          isActive
            ? { textShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }
            : undefined
        }
      >
        {label}
      </span>

      {/* Connector line indicator (active) */}
      {isActive && (
        <div className="ml-auto flex-shrink-0">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-primary"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Step connector line
// ---------------------------------------------------------------------------

const StepConnector: React.FC<{ isCompleted: boolean }> = ({ isCompleted }) => (
  <div className="flex items-center justify-center h-4 ml-[26px]" aria-hidden="true">
    <div
      className={[
        'w-0.5 h-full rounded-full transition-colors duration-300',
        isCompleted ? 'bg-accent-primary/50' : 'bg-forge-border',
      ].join(' ')}
    />
  </div>
);

// ---------------------------------------------------------------------------
// ListExtractorView
// ---------------------------------------------------------------------------

const ListExtractorView: React.FC = () => {
  const currentStep = useStore((s) => s.currentStep);
  const completedSteps = useStore((s) => s.completedSteps);
  const goToStep = useStore((s) => s.goToStep);
  const nextStep = useStore((s) => s.nextStep);
  const prevStep = useStore((s) => s.prevStep);
  const markStepCompleted = useStore((s) => s.markStepCompleted);
  const error = useStore((s) => s.error);
  const setError = useStore((s) => s.setError);
  const resetListExtractor = useStore((s) => s.resetListExtractor);

  const steps: ListExtractorStep[] = [0, 1, 2, 3];

  // -----------------------------------------------------------------------
  // Step navigation handlers
  // -----------------------------------------------------------------------

  const handleNext = useCallback(() => {
    markStepCompleted(currentStep);
    nextStep();
  }, [currentStep, markStepCompleted, nextStep]);

  const handleBack = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleGoToStep = useCallback(
    (step: ListExtractorStep) => {
      // Only allow navigating to completed steps or the current step
      if (completedSteps.has(step) || step === currentStep) {
        goToStep(step);
      }
    },
    [completedSteps, currentStep, goToStep],
  );

  const handleViewData = useCallback(() => {
    // TODO: Navigate to data table view
    // For now this is a placeholder that could trigger tab switch
    console.log('[DataForge] Navigate to data table view');
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Trigger export flow
    console.log('[DataForge] Trigger export');
  }, []);

  const handleNewExtraction = useCallback(() => {
    resetListExtractor();
  }, [resetListExtractor]);

  // -----------------------------------------------------------------------
  // Determine clickable steps
  // -----------------------------------------------------------------------

  const isStepClickable = useCallback(
    (step: ListExtractorStep): boolean => {
      // Can click any completed step to go back and review
      if (completedSteps.has(step)) return true;
      // Can click current step (no-op)
      if (step === currentStep) return true;
      // Cannot skip ahead
      return false;
    },
    [completedSteps, currentStep],
  );

  // -----------------------------------------------------------------------
  // Active step content
  // -----------------------------------------------------------------------

  const stepContent = useMemo(() => {
    switch (currentStep) {
      case 0:
        return <SelectListStep onNext={handleNext} />;
      case 1:
        return <ColumnMapper onNext={handleNext} onBack={handleBack} />;
      case 2:
        return (
          <PaginationConfig onNext={handleNext} onBack={handleBack} />
        );
      case 3:
        return (
          <ExtractionProgress
            onViewData={handleViewData}
            onExport={handleExport}
            onNewExtraction={handleNewExtraction}
          />
        );
      default:
        return null;
    }
  }, [currentStep, handleNext, handleBack, handleViewData, handleExport, handleNewExtraction]);

  // -----------------------------------------------------------------------
  // Error banner
  // -----------------------------------------------------------------------

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="flex items-center gap-2 mx-4 mt-2 px-3 py-2 rounded-lg bg-status-error/5 border border-status-error/20 animate-slide-in-up">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="flex-1 text-xs text-status-error">{error}</span>
        <button
          type="button"
          onClick={() => setError(null)}
          className="flex-shrink-0 text-status-error/60 hover:text-status-error transition-colors"
          aria-label="Dismiss error"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h2
            className="text-base font-bold text-forge-text"
            style={{ textShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}
          >
            List Extractor
          </h2>
          <p className="text-[10px] text-forge-text-muted mt-0.5">
            Extract structured data from any web page
          </p>
        </div>

        {/* Reset button (only if not on step 0) */}
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleNewExtraction}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all"
            title="Reset and start over"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Error banner */}
      {renderError()}

      {/* Stepper */}
      <div className="flex flex-col px-4 py-2">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <StepIndicator
              step={step}
              label={STEP_LABELS[step]}
              isActive={step === currentStep}
              isCompleted={completedSteps.has(step)}
              isClickable={isStepClickable(step)}
              onClick={handleGoToStep}
            />

            {/* Connector line between steps */}
            {idx < steps.length - 1 && (
              <StepConnector isCompleted={completedSteps.has(step)} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Active step content with animated transition */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div
          key={currentStep}
          className="animate-fade-in"
        >
          {stepContent}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ListExtractorView);
