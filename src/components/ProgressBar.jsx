// Full ordered list — used for back-nav and unlock comparisons
const FULL_STEPS = ['mealCount', 'plan', 'mealMode', 'entrees', 'breakfast', 'snacks', 'allergies', 'checkout'];

// Major circles shown in the bar (6 steps instead of 8)
const MAJOR_STEPS = [
  { id: 1, label: 'Meal Count', short: 'Count',    route: 'mealCount'  },
  { id: 2, label: 'Entrées',    short: 'Entrées',  route: 'entrees'    },
  { id: 3, label: 'Breakfast',  short: 'Bfast',    route: 'breakfast'  },
  { id: 4, label: 'Snacks',     short: 'Snacks',   route: 'snacks'     },
  { id: 5, label: 'Allergies',  short: 'Diet',     route: 'allergies'  },
  { id: 6, label: 'Checkout',   short: 'Checkout', route: 'checkout'   },
];

// Sub-steps that live in the connector between two major steps
const CONNECTOR_SUBSTEPS = {
  'mealCount-entrees': [
    { route: 'plan',     label: 'Plan' },
    { route: 'mealMode', label: 'Mode' },
  ],
};

export default function ProgressBar({ currentRoute, unlockedUntil = 'mealCount', onNavigate }) {
  const currentIdx   = FULL_STEPS.indexOf(currentRoute);
  const unlockedIdx  = FULL_STEPS.indexOf(unlockedUntil);

  const prevRoute = currentIdx > 0 ? FULL_STEPS[currentIdx - 1] : null;

  function isLocked(route) {
    return FULL_STEPS.indexOf(route) > unlockedIdx;
  }
  function isComplete(route) {
    return FULL_STEPS.indexOf(route) < currentIdx;
  }
  function isActive(route) {
    return route === currentRoute;
  }

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">

      {/* Header: back pill + logo */}
      <div className="flex items-center px-3 py-2 border-b border-gray-100">
        <div className="flex-1 flex items-center">
          {prevRoute ? (
            <button
              onClick={() => onNavigate?.(prevRoute)}
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

      {/* Steps row — outer handles scroll, inner min-w-max+mx-auto fixes justify-center clipping on overflow */}
      <div className="overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center justify-center min-w-max mx-auto px-3">
          {MAJOR_STEPS.map((step, i) => {
            const complete = isComplete(step.route);
            const active   = isActive(step.route);
            const locked   = isLocked(step.route);

            const prevMajor = MAJOR_STEPS[i - 1];
            const subSteps  = prevMajor ? (CONNECTOR_SUBSTEPS[`${prevMajor.route}-${step.route}`] || []) : null;

            return (
              <div key={step.route} className="flex items-center flex-shrink-0">
                {i > 0 && (
                  subSteps && subSteps.length > 0 ? (
                    <div className="flex items-center mx-0.5">
                      {subSteps.map((sub) => {
                        const subIdx      = FULL_STEPS.indexOf(sub.route);
                        const subActive   = sub.route === currentRoute;
                        const subComplete = subIdx < currentIdx;
                        const subLocked   = subIdx > unlockedIdx;
                        return (
                          <div key={sub.route} className="flex items-center">
                            <div className={`w-2.5 sm:w-4 h-px ${subComplete || subActive ? 'bg-brand-green' : 'bg-gray-200'}`} />
                            <button
                              onClick={() => !subLocked && onNavigate?.(sub.route)}
                              disabled={subLocked}
                              title={sub.label}
                              className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                                subLocked   ? 'bg-gray-200 cursor-not-allowed' :
                                subActive   ? 'bg-brand-charcoal ring-1 ring-brand-charcoal ring-offset-1' :
                                subComplete ? 'bg-brand-green cursor-pointer' :
                                              'bg-gray-300 cursor-pointer'
                              }`}
                            />
                          </div>
                        );
                      })}
                      <div className={`w-2.5 sm:w-4 h-px ${isComplete(step.route) || isActive(step.route) ? 'bg-brand-green' : 'bg-gray-200'}`} />
                    </div>
                  ) : (
                    <div className={`w-3 sm:w-5 h-px mx-0.5 flex-shrink-0 ${complete ? 'bg-brand-green' : 'bg-gray-200'}`} />
                  )
                )}

                <button
                  onClick={() => !locked && onNavigate?.(step.route)}
                  disabled={locked}
                  className={`flex flex-col items-center gap-0.5 px-0.5 sm:px-1 rounded-lg transition-colors flex-shrink-0 ${
                    locked  ? 'cursor-not-allowed opacity-35' :
                    active  ? 'cursor-default' :
                              'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                    complete ? 'bg-brand-green text-white' :
                    active   ? 'bg-brand-charcoal text-white' :
                               'bg-gray-200 text-gray-400'
                  }`}>
                    {complete ? '✓' : step.id}
                  </div>
                  <span className={`text-center leading-tight whitespace-nowrap font-medium transition-colors ${
                    active   ? 'font-semibold text-gray-900' :
                    complete ? 'text-brand-green' :
                               'text-gray-400'
                  }`}>
                    <span className="block sm:hidden text-[8px]">{step.short}</span>
                    <span className="hidden sm:block text-[10px]">{step.label}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
