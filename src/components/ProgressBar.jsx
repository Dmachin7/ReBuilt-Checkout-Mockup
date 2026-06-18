const STEPS = [
  { id: 1, label: 'Plan & Entrées', route: 'entrees' },
  { id: 2, label: 'Breakfast',      route: 'breakfast' },
  { id: 3, label: 'Snacks',         route: 'snacks' },
  { id: 4, label: 'Allergies',      route: 'allergies' },
  { id: 5, label: 'Checkout',       route: 'checkout' },
];

export default function ProgressBar({ currentStep, onNavigate }) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      {/* Logo row */}
      <div className="flex items-center justify-center relative px-4 py-3 border-b border-gray-100">
        <div className="flex flex-col leading-none items-center">
          <span className="font-display text-xl font-bold text-gray-900 tracking-tight">ReBuilt</span>
          <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-gray-400">MEALS</span>
        </div>
      </div>

      {/* Steps — centered */}
      <div className="flex items-center justify-center px-3 py-2.5 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const isActive   = step.id === currentStep;
            const isComplete = step.id < currentStep;
            const isLast     = i === STEPS.length - 1;

            return (
              <div key={step.id} className="flex items-center">
                {/* Clickable step */}
                <button
                  onClick={() => onNavigate?.(step.route)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors flex-shrink-0 ${
                    isActive ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  {/* Circle indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                      isComplete
                        ? 'bg-brand-green text-white'
                        : isActive
                        ? 'bg-brand-charcoal text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isComplete ? '✓' : step.id}
                  </div>

                  {/* Label — always visible on mobile too */}
                  <span
                    className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'text-gray-900 font-semibold'
                        : isComplete
                        ? 'text-brand-green'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div className={`w-4 sm:w-6 h-px flex-shrink-0 ${isComplete ? 'bg-brand-green' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
