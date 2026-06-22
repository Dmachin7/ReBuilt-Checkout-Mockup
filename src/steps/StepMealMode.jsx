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
    <div className="flex-1 px-4 sm:px-6 py-10 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">
          How do you want to pick meals?
        </h1>
        <p className="text-gray-500">
          You're ordering {mealCount} meals this week.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Choose own meals */}
        <button
          onClick={onOwnMeals}
          className="group text-left p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-brand-charcoal hover:shadow-md transition-all"
        >
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="font-display text-xl text-gray-900 mb-2">I'll choose my own</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Browse the full menu and hand-pick exactly what you want. You control every slot.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-brand-charcoal text-sm font-semibold group-hover:gap-2.5 transition-all">
            Browse menu <span>→</span>
          </div>
        </button>

        {/* Chef-chosen */}
        <button
          onClick={onChefChosen}
          className="group text-left p-6 rounded-2xl bg-brand-charcoal border-2 border-brand-charcoal hover:shadow-md transition-all"
        >
          <div className="text-4xl mb-4">👨‍🍳</div>
          <h2 className="font-display text-xl text-white mb-2">Chef picks for me</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We'll pre-select {mealCount} meals
            {planLabel ? ` from the ${planLabel} menu` : ' from this week\'s top picks'}.
            Swap anything you don't love.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-brand-green text-sm font-semibold group-hover:gap-2.5 transition-all">
            Pre-fill my order <span>→</span>
          </div>
        </button>
      </div>

      <button
        onClick={onBack}
        className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
