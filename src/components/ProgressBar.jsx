// Full ordered list — used for back-nav and unlock comparisons
const FULL_STEPS = ['mealCount', 'plan', 'mealMode', 'entrees', 'breakfast', 'snacks', 'allergies', 'checkout'];

// Major circles shown in the bar (6 steps instead of 8)
const MAJOR_STEPS = [
  { id: 1, label: 'Meal Count',  mobileLabel: 'Count',     route: 'mealCount'  },
  { id: 2, label: 'Entrées',     mobileLabel: 'Entrées',   route: 'entrees'    },
  { id: 3, label: 'Breakfast',   mobileLabel: 'Breakfast', route: 'breakfast'  },
  { id: 4, label: 'Snacks',      mobileLabel: 'Snacks',    route: 'snacks'     },
  { id: 5, label: 'Allergies',   mobileLabel: 'Allergies', route: 'allergies'  },
  { id: 6, label: 'Checkout',    mobileLabel: 'Checkout',  route: 'checkout'   },
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

      {/* Steps row */}
      <div className="flex items-center justify-center px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {MAJOR_STEPS.map((step, i) => {
          const complete = isComplete(step.route);
          const active   = isActive(step.route);
          const locked   = isLocked(step.route);

          // Sub-steps for the connector BEFORE this major step
          const prevMajor = MAJOR_STEPS[i - 1];
          const subSteps  = prevMajor ? (CONNECTOR_SUBSTEPS[`${prevMajor.route}-${step.route}`] || []) : null;

          return (
            <div key={step.route} className="flex items-center flex-shrink-0">
              {/* Connector (shown for every step except the first) */}
              {i > 0 && (
                subSteps && subSteps.length > 0 ? (
                  // Connector with sub-step dots
                  <div className="flex items-center mx-1">
                    {subSteps.map((sub, si) => {
                      const subIdx     = FULL_STEPS.indexOf(sub.route);
                      const subActive  = sub.route === currentRoute;
                      const subComplete = subIdx < currentIdx;
                      const subLocked  = subIdx > unlockedIdx;

                      return (
                        <div key={sub.route} className="flex items-center">
                          {/* Line segment before dot */}
                          <div className={`w-3 sm:w-5 h-px ${subComplete || subActive ? 'bg-brand-green' : 'bg-gray-200'}`} />
                          {/* Sub-step dot — clickable if unlocked */}
                          <button
                            onClick={() => !subLocked && onNavigate?.(sub.route)}
                            disabled={subLocked}
                            title={sub.label}
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                              subLocked
                                ? 'bg-gray-200 cursor-not-allowed'
                                : subActive
                                ? 'bg-brand-charcoal ring-2 ring-brand-charcoal ring-offset-1'
                                : subComplete
                                ? 'bg-brand-green cursor-pointer'
                                : 'bg-gray-300 cursor-pointer'
                            }`}
                          />
                        </div>
                      );
                    })}
                    {/* Final line after last dot */}
                    <div className={`w-3 sm:w-5 h-px ${isComplete(step.route) || isActive(step.route) ? 'bg-brand-green' : 'bg-gray-200'}`} />
                  </div>
                ) : (
                  // Plain connector
                  <div className={`w-4 sm:w-6 h-px mx-0.5 flex-shrink-0 ${complete ? 'bg-brand-green' : 'bg-gray-200'}`} />
                )
              )}

              {/* Major step circle + label */}
              <button
                onClick={() => !locked && onNavigate?.(step.route)}
                disabled={locked}
                className={`flex flex-col items-center gap-1 px-1 sm:px-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  locked
                    ? 'cursor-not-allowed opacity-35'
                    : active
                    ? 'cursor-default'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${
                  complete
                    ? 'bg-brand-green text-white'
                    : active
                    ? 'bg-brand-charcoal text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {complete ? '✓' : step.id}
                </div>
                <span className={`text-center leading-tight whitespace-nowrap font-medium transition-colors ${
                  active    ? 'font-semibold text-gray-900' :
                  complete  ? 'text-brand-green'            :
                              'text-gray-400'
                }`}>
                  <span className="block sm:hidden text-[9px]">{step.mobileLabel}</span>
                  <span className="hidden sm:block text-[10px]">{step.label}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
