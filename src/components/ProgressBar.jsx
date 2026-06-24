const FULL_STEPS = ['mealCount', 'plan', 'mealMode', 'entrees', 'breakfast', 'snacks', 'allergies', 'checkout'];

const MAJOR_STEPS = [
  { id: 1, label: 'Meal Count', short: 'Count',    route: 'mealCount'  },
  { id: 2, label: 'Entrées',    short: 'Entrées',  route: 'entrees'    },
  { id: 3, label: 'Breakfast',  short: 'Bfast',    route: 'breakfast'  },
  { id: 4, label: 'Snacks',     short: 'Snacks',   route: 'snacks'     },
  { id: 5, label: 'Allergies',  short: 'Allrgy',   route: 'allergies'  },
  { id: 6, label: 'Checkout',   short: 'Checkout', route: 'checkout'   },
];

export default function ProgressBar({ currentRoute, unlockedUntil = 'mealCount', onNavigate }) {
  const currentIdx  = FULL_STEPS.indexOf(currentRoute);
  const unlockedIdx = FULL_STEPS.indexOf(unlockedUntil);
  const maxUnlocked = Math.max(unlockedIdx, currentIdx);

  const prevRoute = currentIdx > 0 ? FULL_STEPS[currentIdx - 1] : null;

  function isLocked(route)   { return FULL_STEPS.indexOf(route) > maxUnlocked; }
  function isComplete(route) { return FULL_STEPS.indexOf(route) < currentIdx; }
  function isActive(route)   { return route === currentRoute; }

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">

      {/* Header: back button + logo */}
      <div className="flex items-center px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-100">
        <div className="flex-1 flex items-center">
          {prevRoute ? (
            <button
              onClick={() => onNavigate?.(prevRoute)}
              className="inline-flex items-center gap-1.5 bg-brand-charcoal hover:bg-gray-800 active:bg-gray-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-colors select-none shadow-sm"
            >
              ← Back
            </button>
          ) : null}
        </div>
        <div className="flex flex-col leading-none items-center">
          <span className="font-display text-lg sm:text-xl font-bold text-gray-900 tracking-tight">ReBuilt</span>
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400">MEALS</span>
        </div>
        <div className="flex-1" />
      </div>

      {/* Steps row */}
      <div className="overflow-x-auto py-2 sm:py-3" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center justify-center min-w-max mx-auto px-3 sm:px-8">
          {MAJOR_STEPS.map((step, i) => {
            const complete = isComplete(step.route);
            const active   = isActive(step.route);
            const locked   = isLocked(step.route);

            // Connector between this step and the previous major step
            let connector = null;
            if (i > 0) {
              const prevMajor = MAJOR_STEPS[i - 1];
              const segStart  = FULL_STEPS.indexOf(prevMajor.route);
              const segEnd    = FULL_STEPS.indexOf(step.route);
              const hasGap    = segEnd - segStart > 1;

              if (hasGap) {
                // Fill bar — grows as user advances through the sub-steps
                const total    = segEnd - segStart;
                const progress = Math.min(Math.max(currentIdx - segStart, 0), total);
                const fillPct  = Math.round((progress / total) * 100);
                connector = (
                  <div className="relative mx-1 sm:mx-2 flex-shrink-0 h-1.5 w-12 sm:w-20 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full transition-all duration-500"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                );
              } else {
                // Plain line for adjacent major steps
                connector = (
                  <div className={`w-3 sm:w-10 h-px mx-0.5 sm:mx-1 flex-shrink-0 ${complete ? 'bg-brand-green' : 'bg-gray-200'}`} />
                );
              }
            }

            return (
              <div key={step.route} className="flex items-center flex-shrink-0">
                {connector}

                <button
                  onClick={() => !locked && onNavigate?.(step.route)}
                  disabled={locked}
                  className={`flex flex-col items-center gap-0.5 sm:gap-1 px-0.5 sm:px-2 rounded-lg transition-colors flex-shrink-0 ${
                    locked  ? 'cursor-not-allowed opacity-35' :
                    active  ? 'cursor-default' :
                              'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-sm font-bold flex-shrink-0 transition-colors ${
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
                    <span className="hidden sm:block text-xs">{step.label}</span>
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
