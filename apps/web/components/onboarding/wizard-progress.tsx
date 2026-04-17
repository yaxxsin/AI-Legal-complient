'use client';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <div key={step} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '✓' : step}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center max-w-[80px] leading-tight ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {labels[i]}
                </span>
              </div>

              {/* Connecting line */}
              {step < totalSteps && (
                <div className="flex-1 mx-2 mt-[-20px]">
                  <div
                    className={`h-0.5 rounded-full transition-colors duration-300 ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
