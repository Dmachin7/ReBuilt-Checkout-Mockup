const STEPS = [
  { id: 1, label: 'Meal Count',  mobileLabel: 'Count',     route: 'mealCount'  },
  { id: 2, label: 'Backup Plan', mobileLabel: 'Plan',      route: 'plan'       },
  { id: 3, label: 'Meal Mode',   mobileLabel: 'Mode',      route: 'mealMode'   },
  { id: 4, label: 'Entrées',     mobileLabel: 'Entrées',   route: 'entrees'    },
  { id: 5, label: 'Breakfast',   mobileLabel: 'Breakfast', route: 'breakfast'  },
  { id: 6, label: 'Snacks',      mobileLabel: 'Snacks',    route: 'snacks'     },
  { id: 7, label: 'Allergies',   mobileLabel: 'Allergies', route: 'allergies'  },
  { id: 8, label: 'Checkout',    mobileLabel: 'Checkout',  route: 'checkout'   },
];

export default function ProgressBar({ currentStep, unlockedUpTo = 1, onNavigate }) {
  const prevStep = STEPS.find(s => s.id === currentStep - 1);

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">

      {/* Header row */}
      <div className="flex items-center px-3 py-2 border-b border-gray-100">
        <div className="flex-1 flex items-center">
          {prevStep ? (
            <button
              onClick={() => onNavigate?.(prevStep.route)}
              className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors select-none"
            >
              ← Back
            </button>
          ) : null}
        </div>

        <div className="flex flex-col leading-none items-center">
          <span className="font-display text-lg font-bold text-gray-900 tracking-tight">ReBuilt</span>
          <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-gray-400">MEALS</span>
        </div>

        <div className="flex-1" />
      </div>

      {/* Steps row — scrollable on very small screens */}
      <div className="flex items-center justify-center px-1 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {STEPS.map((step, i) => {
          const isActive   = step.id === currentStep;
          const isComplete = step.id < currentStep;
          const isLocked   = step.id > unlockedUpTo;
          const isLast     = i === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-start flex-shrink-0">
              <button
                onClick={() => !isLocked && onNavigate?.(step.route)}
                disabled={isLocked}
                className={`flex flex-col items-center gap-1 px-1 sm:px-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  isLocked
                    ? 'cursor-not-allowed opacity-35'
                    : isActive
                    ? 'cursor-default'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                  isComplete
                    ? 'bg-brand-green text-white'
                    : isActive
                    ? 'bg-brand-charcoal text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isComplete ? '✓' : step.id}
                </div>

                <span className={`text-center leading-tight whitespace-nowrap font-medium transition-colors ${
                  isActive
                    ? 'font-semibold text-gray-900'
                    : isComplete
                    ? 'text-brand-green'
                    : 'text-gray-400'
                }`}>
                  <span className="block sm:hidden text-[8px]">{step.mobileLabel}</span>
                  <span className="hidden sm:block text-[10px]">{step.label}</span>
                </span>
              </button>

              {!isLast && (
                <div className={`w-1.5 sm:w-3 h-px flex-shrink-0 mt-[10px] ${isComplete ? 'bg-brand-green' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
