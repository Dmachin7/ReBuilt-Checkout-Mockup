import { useState } from 'react';
import { PLANS } from '../data/meals';

const PLAN_IMAGES = {
  lifestyle:    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
  performance:  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  keto:         'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
  chefs_choice: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400&q=80',
  plant_based:  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80',
};

export default function StepPlan({ selectedPlan, setSelectedPlan, onNext, onBack }) {
  const [expandedPlan, setExpandedPlan] = useState(null);

  return (
    <div className="flex-1 px-4 sm:px-6 py-3 sm:py-5 max-w-3xl lg:max-w-5xl mx-auto w-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="mb-3 sm:mb-4 flex-shrink-0">
        <h1 className="font-display text-xl sm:text-3xl text-gray-900 mb-1">
          Choose your meal preference
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm">
          Sets your backup plan if you miss the meal selection deadline, and helps us send you meals you'll love.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 flex-1 min-h-0 mb-3">
        {PLANS.map(plan => {
          const img = PLAN_IMAGES[plan.id];
          const isSelected = selectedPlan === plan.id;
          const isExpanded = expandedPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border-2 overflow-hidden transition-all flex flex-col ${
                isSelected
                  ? 'border-brand-green shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Full-bleed hero image */}
              <div
                className="relative w-full overflow-hidden cursor-pointer flex-shrink-0"
                style={{ aspectRatio: '16/7' }}
                onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
              >
                {img ? (
                  <img src={img} alt={plan.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-xs shadow-md">
                    ✓
                  </div>
                )}
              </div>

              {/* Title row */}
              <div
                className={`px-3 pt-2 pb-1 cursor-pointer flex-shrink-0 ${isSelected ? 'bg-green-50' : 'bg-white'}`}
                onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
              >
                <p className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">{plan.name}</p>
                <p className="text-gray-500 text-[10px] mt-0.5 line-clamp-1 hidden sm:block">{plan.tagline}</p>
              </div>

              {/* Details toggle */}
              <div className={`px-3 pb-2 ${isSelected ? 'bg-green-50' : 'bg-white'}`}>
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  className="text-[10px] text-brand-green font-semibold hover:underline"
                >
                  {isExpanded ? '▲ Hide' : '▼ Details'}
                </button>

                {isExpanded && (
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100 animate-reveal">
                    <p className="text-[10px] text-gray-600 leading-relaxed mb-1.5">{plan.description}</p>
                    <ul className="space-y-0.5">
                      {plan.highlights.map(h => (
                        <li key={h} className="flex items-start gap-1 text-[10px] text-gray-600">
                          <span className="text-brand-green flex-shrink-0 mt-0.5">✓</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating on mobile, inline on sm+ */}
      <div className="fixed sm:static bottom-4 inset-x-4 sm:inset-auto z-20 flex-shrink-0 space-y-2">
        <button
          onClick={onNext}
          disabled={!selectedPlan}
          className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all shadow-md ${
            selectedPlan
              ? 'bg-brand-green hover:bg-brand-green-dark text-white'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
          }`}
        >
          {selectedPlan ? 'Continue →' : 'Pick a preference to continue'}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button
          onClick={onBack}
          className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-1.5 transition-colors text-center"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
