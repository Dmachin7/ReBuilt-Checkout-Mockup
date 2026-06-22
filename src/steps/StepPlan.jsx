import { useState } from 'react';
import { PLANS } from '../data/meals';

export default function StepPlan({ selectedPlan, setSelectedPlan, onNext, onBack }) {
  const [expandedPlan, setExpandedPlan] = useState(null);

  return (
    <div className="flex-1 px-4 sm:px-6 py-10 max-w-2xl mx-auto w-full">
      <div className="mb-2">
        <h1 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">
          Just-in-case plan
        </h1>
        <p className="text-gray-500 text-sm">
          You'll choose your own meals every week — this is only used if you <em>forget</em> to pick before the Thursday deadline.
        </p>
        <span className="inline-block mt-2 text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
          Optional
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
        {PLANS.map(plan => (
          <div key={plan.id} className="flex flex-col">
            <button
              onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
              className={`w-full h-[80px] text-left p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                selectedPlan === plan.id
                  ? 'border-brand-green bg-green-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: plan.color }} />
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{plan.name}</p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5 line-clamp-1">{plan.tagline}</p>
              </div>
            </button>
            <button
              onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
              className="text-[10px] text-brand-green font-medium text-center mt-1 py-0.5 hover:underline"
            >
              {expandedPlan === plan.id ? 'Hide ▲' : 'What is this? ▼'}
            </button>
            {expandedPlan === plan.id && (
              <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600 animate-reveal">
                <p className="mb-1.5">{plan.description}</p>
                <ul className="space-y-0.5">
                  {plan.highlights.map(h => (
                    <li key={h} className="flex items-start gap-1">
                      <span className="text-brand-green flex-shrink-0">✓</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl font-bold text-base bg-brand-green hover:bg-brand-green-dark text-white transition-colors shadow-sm"
        >
          {selectedPlan ? 'Continue →' : 'Skip for now →'}
        </button>
        <button
          onClick={onBack}
          className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
