const PLAN_LABELS = {
  lifestyle:    'Lifestyle',
  performance:  'Performance',
  keto:         'Keto',
  chefs_choice: "Chef's Choice",
  plant_based:  'Plant-Based',
};

export default function StepMealMode({ selectedPlan, mealCount, onChefChosen, onOwnMeals, onBack }) {
  const planLabel = selectedPlan ? PLAN_LABELS[selectedPlan] : null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-4 sm:py-8 max-w-2xl mx-auto w-full pb-16 sm:pb-10">

      <div className="mb-4 sm:mb-8">
        <h1 className="font-display text-xl sm:text-4xl text-gray-900 mb-1 sm:mb-2">
          How do you want to pick meals?
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">
          You're ordering {mealCount} meals this week.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">

        {/* Choose own meals */}
        <button
          onClick={onOwnMeals}
          className="group text-left p-3 sm:p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-brand-charcoal hover:shadow-md transition-all"
        >
          {/* Emoji only on desktop */}
          <div className="hidden sm:block text-4xl mb-4">🎯</div>
          <h2 className="font-display text-sm sm:text-xl text-gray-900 mb-1 sm:mb-2 leading-snug">
            I'll choose my own
          </h2>
          <p className="text-gray-500 text-xs leading-relaxed hidden sm:block">
            Browse the full menu and hand-pick exactly what you want. You control every slot.
          </p>
          <div className="mt-1.5 sm:mt-4 inline-flex items-center gap-1 text-brand-charcoal text-xs sm:text-sm font-semibold group-hover:gap-2 transition-all">
            Browse menu →
          </div>
        </button>

        {/* Chef-chosen */}
        <button
          onClick={onChefChosen}
          className="group text-left p-3 sm:p-6 rounded-2xl bg-brand-charcoal border-2 border-brand-charcoal hover:shadow-md transition-all"
        >
          <div className="hidden sm:block text-4xl mb-4">👨‍🍳</div>
          <h2 className="font-display text-sm sm:text-xl text-white mb-1 sm:mb-2 leading-snug">
            Chef picks for me
          </h2>
          <p className="text-gray-400 text-xs leading-relaxed hidden sm:block">
            We'll pre-select {mealCount} meals
            {planLabel ? ` from the ${planLabel} menu` : " from this week's top picks"}.
            Swap anything you don't love.
          </p>
          <div className="mt-1.5 sm:mt-4 inline-flex items-center gap-1 text-brand-green text-xs sm:text-sm font-semibold group-hover:gap-2 transition-all">
            Pre-fill my order →
          </div>
        </button>
      </div>

      <div className="fixed sm:static bottom-4 inset-x-4 sm:inset-auto z-20">
        <button
          onClick={onBack}
          className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors text-center"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
