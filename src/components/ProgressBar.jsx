const STEPS = [
  { id: 1, label: 'Plan & Entrées', mobileLabel: 'Entrées',   route: 'entrees' },
  { id: 2, label: 'Breakfast',      mobileLabel: 'Breakfast', route: 'breakfast' },
  { id: 3, label: 'Snacks',         mobileLabel: 'Snacks',    route: 'snacks' },
  { id: 4, label: 'Allergies',      mobileLabel: 'Allergies', route: 'allergies' },
  { id: 5, label: 'Checkout',       mobileLabel: 'Checkout',  route: 'checkout' },
];

export default function ProgressBar({ currentStep, onNavigate }) {
  const prevStep = STEPS.find(s => s.id === currentStep - 1);

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">

      {/* Header row: back pill (left) + logo (center) + spacer (right) */}
      <div className="flex items-center px-3 py-2 border-b border-gray-100">
        {/* Left — back button or invisible spacer */}
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

        {/* Center — logo */}
        <div className="flex flex-col leading-none items-center">
          <span className="font-display text-lg font-bold text-gray-900 tracking-tight">ReBuilt</span>
          <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-gray-400">MEALS</span>
        </div>

        {/* Right — spacer keeps logo centered */}
        <div className="flex-1" />
      </div>

      {/* Steps row — vertical stack (circle above label) so labels always fit on mobile */}
      <div className="flex items-center justify-center px-2 py-2">
        {STEPS.map((step, i) => {
          const isActive   = step.id === currentStep;
          const isComplete = step.id < currentStep;
          const isLast     = i === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-start">
              <button
                onClick={() => onNavigate?.(step.route)}
                className={`flex flex-col items-center gap-1 px-1.5 sm:px-2 rounded-lg transition-colors flex-shrink-0 ${
                  isActive ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {/* Circle */}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                  isComplete
                    ? 'bg-brand-green text-white'
                    : isActive
                    ? 'bg-brand-charcoal text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isComplete ? '✓' : step.id}
                </div>

                {/* Label — always shown; shorter text on mobile */}
                <span className={`text-center leading-tight whitespace-nowrap font-medium transition-colors ${
                  isActive
                    ? 'font-semibold text-gray-900'
                    : isComplete
                    ? 'text-brand-green'
                    : 'text-gray-400'
                }`}>
                  <span className="block sm:hidden text-[9px]">{step.mobileLabel}</span>
                  <span className="hidden sm:block text-[11px]">{step.label}</span>
                </span>
              </button>

              {/* Connector — mt-[10px] centers it with the 20px circle */}
              {!isLast && (
                <div className={`w-2 sm:w-5 h-px flex-shrink-0 mt-[10px] ${isComplete ? 'bg-brand-green' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
