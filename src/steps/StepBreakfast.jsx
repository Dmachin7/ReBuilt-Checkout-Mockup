import { useState } from 'react';
import MealCard from '../components/MealCard';
import MealModal from '../components/MealModal';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import { BREAKFAST_ITEMS } from '../data/meals';

export default function StepBreakfast({ cart, doubleProteins, onAdd, onRemove, onDoubleProteinToggle, onNext, onBack, mealCount }) {
  const [modalMeal, setModalMeal] = useState(null);

  return (
    <div className="flex gap-6 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
      <div className="flex-1 min-w-0 pb-32 space-y-5">

        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-1">Breakfast Add-ons</h2>
          <p className="text-gray-500 text-sm">Completely optional — your entrées are already saved.</p>
        </div>

        {/* SKIP — large dark banner */}
        <button
          onClick={onNext}
          className="w-full flex items-center justify-between gap-4 bg-brand-charcoal hover:bg-gray-800 text-white rounded-2xl px-6 py-5 transition-colors shadow-md group"
        >
          <div className="text-left">
            <p className="font-bold text-lg leading-tight">Skip Breakfast</p>
            <p className="text-gray-400 text-sm mt-0.5">Jump to Snacks → your selections are safe</p>
          </div>
          <div className="w-11 h-11 rounded-full border-2 border-gray-600 group-hover:border-brand-green group-hover:bg-brand-green flex items-center justify-center text-xl transition-all flex-shrink-0">
            →
          </div>
        </button>

        <p className="text-center text-xs text-gray-400">— or browse breakfast options below —</p>

        {/* Next-step hint */}
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>🍎</span> Snack options available after this step
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-7">
          {BREAKFAST_ITEMS.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              qty={cart[meal.id] || 0}
              onAdd={onAdd}
              onRemove={onRemove}
              onDoubleProteinToggle={onDoubleProteinToggle}
              doubleProtein={!!doubleProteins[meal.id]}
              onCardClick={() => setModalMeal(meal)}
            />
          ))}
        </div>

        <div className="pt-2">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            ← Back to Entrées
          </button>
        </div>
      </div>

      <CartSidebar cart={cart} doubleProteins={doubleProteins} mealCount={mealCount} />

      <MobileCartBar
        cart={cart}
        doubleProteins={doubleProteins}
        mealCount={mealCount}
        onContinue={onNext}
        continueLabel="Continue to Snacks →"
      />

      {modalMeal && (
        <MealModal
          meal={modalMeal}
          onClose={() => setModalMeal(null)}
          qty={cart[modalMeal.id] || 0}
          onAdd={onAdd}
          onRemove={onRemove}
          doubleProtein={!!doubleProteins[modalMeal.id]}
          onDoubleProteinToggle={onDoubleProteinToggle}
          atLimit={false}
        />
      )}
    </div>
  );
}
