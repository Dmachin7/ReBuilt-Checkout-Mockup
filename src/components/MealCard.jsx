import { useState } from 'react';
import { MEAL_DETAILS, DEFAULT_MEAL_DETAILS } from '../data/mealDetails';

const CATEGORY_STYLES = {
  LIFESTYLE:     { text: 'text-green-600',  label: 'Lifestyle' },
  KETO:          { text: 'text-pink-600',   label: 'Keto' },
  PERFORMANCE:   { text: 'text-blue-600',   label: 'Performance' },
  'PLANT-BASED': { text: 'text-orange-500', label: 'Plant-Based' },
};

const BADGE_STYLES = {
  'Best Seller': { cls: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' },
  'Going Fast':  { cls: 'bg-gradient-to-r from-rose-500 to-red-500 text-white' },
  'New':         { cls: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' },
};

const DIETARY = {
  'Gluten Free': { icon: '🌾', label: 'GF',    cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  'Soy Free':    { icon: '🫘', label: 'SF',    cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
  'Dairy Free':  { icon: '🥛', label: 'DF',    cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  'Vegan':       { icon: '🌿', label: 'Vegan', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

function PortionBtn({ label, extraPrice, qty, onAdd, onRemove, atLimit, isDouble }) {
  const stop = e => e.stopPropagation();
  const dotCls = isDouble ? 'bg-brand-green text-white' : 'bg-brand-charcoal text-white';

  if (qty === 0) {
    return (
      <button
        onClick={e => { stop(e); if (!atLimit) onAdd(); }}
        disabled={atLimit}
        className={`flex-1 flex items-center justify-between px-3 py-2 rounded-full border text-[11px] font-semibold transition-colors ${
          atLimit
            ? 'border-gray-200 text-gray-300 bg-white cursor-not-allowed'
            : isDouble
            ? 'border-brand-green text-brand-green bg-white hover:bg-green-50'
            : 'border-gray-300 text-gray-600 bg-white hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <span>+ {label}</span>
        {extraPrice != null && (
          <span className={atLimit ? 'text-gray-300' : isDouble ? 'text-brand-green opacity-70' : 'text-gray-400'}>
            +${extraPrice.toFixed(2)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="flex-1 flex items-center justify-between px-3 py-2 rounded-full border border-gray-200 bg-white"
      onClick={stop}
    >
      <span className="text-[10px] text-gray-400 font-medium leading-none">✓ {label}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={e => { stop(e); onRemove(); }}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${dotCls} hover:opacity-80`}
        >
          −
        </button>
        <span className="text-xs font-bold text-gray-700 min-w-[14px] text-center">
          {qty}
        </span>
        <button
          onClick={e => { stop(e); if (!atLimit) onAdd(); }}
          disabled={atLimit}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            atLimit ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : `${dotCls} hover:opacity-80`
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function CircularImage({ src, alt, hasError, onError }) {
  if (!src || hasError) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center shadow-lg ring-2 ring-white">
        <span className="text-lg">📸</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={onError}
      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0 object-cover shadow-lg ring-2 ring-white"
    />
  );
}

export default function MealCard({
  meal,
  singleQty = 0,
  doubleQty = 0,
  onAddSingle,
  onRemoveSingle,
  onAddDouble,
  onRemoveDouble,
  atLimit,
  onCardClick,
  singleLabel = 'Single',
}) {
  const [imgError, setImgError] = useState(false);
  const cat = CATEGORY_STYLES[meal.category] || CATEGORY_STYLES.LIFESTYLE;
  const badge = meal.badge ? BADGE_STYLES[meal.badge] : null;
  const details = MEAL_DETAILS[meal.id] || DEFAULT_MEAL_DETAILS;

  return (
    <div className="relative">
      <div
        onClick={onCardClick}
        className="relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full cursor-pointer"
      >
        {/* Angled corner ribbon badge */}
        {badge && (
          <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 z-10 pointer-events-none">
            <div className={`absolute -right-4 top-5 w-28 text-center py-1.5 text-[10px] font-bold tracking-wide shadow-md transform rotate-45 whitespace-nowrap ${badge.cls}`}>
              {meal.badge}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2.5 px-3 pt-3 pb-2 flex-1">
          <CircularImage
            src={meal.image}
            alt={meal.name}
            hasError={imgError}
            onError={() => setImgError(true)}
          />

          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold tracking-widest uppercase ${cat.text} leading-tight mb-0.5`}>
              {cat.label}
            </p>

            <h3 className="font-display text-[13px] sm:text-[14px] font-semibold text-gray-900 leading-snug mb-1">
              {meal.name}
            </h3>

            <div className="flex flex-wrap gap-1 mb-1.5">
              {meal.dietary.map((d) => {
                const info = DIETARY[d] || { icon: '✓', label: d, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };
                return (
                  <span
                    key={d}
                    title={d}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${info.cls}`}
                  >
                    <span className="text-[10px]">{info.icon}</span>
                    {info.label}
                  </span>
                );
              })}
            </div>

            {/* Main components */}
            <p className="text-gray-400 text-[10px] leading-snug">
              {details.mainIngredients || details.ingredients}
            </p>
          </div>
        </div>

        {/* Full-width buttons directly above macro bar */}
        <div className="flex gap-2 px-3 pb-2.5">
          <PortionBtn
            label={singleLabel}
            qty={singleQty}
            onAdd={() => onAddSingle(meal.id)}
            onRemove={() => onRemoveSingle(meal.id)}
            atLimit={atLimit}
          />
          {meal.doubleProtein && (
            <PortionBtn
              label="Double Protein"
              extraPrice={meal.doubleProteinPrice}
              qty={doubleQty}
              onAdd={() => onAddDouble(meal.id)}
              onRemove={() => onRemoveDouble(meal.id)}
              atLimit={atLimit}
              isDouble
            />
          )}
        </div>

        {/* Macro bar — ReBuilt green */}
        <div className="bg-brand-green px-4 py-2 flex items-center justify-center gap-5 mt-auto">
          <MacroStat value={meal.protein} unit="g" label="Protein" />
          <div className="w-px h-4 bg-green-300" />
          <MacroStat value={meal.calories} unit="" label="Cal" />
          <div className="w-px h-4 bg-green-300" />
          <MacroStat value={meal.carbs} unit="g" label="Carbs" />
        </div>
      </div>
    </div>
  );
}

function MacroStat({ value, unit, label }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-white text-xs sm:text-sm font-bold">{value}{unit}</span>
      <span className="text-green-100 text-[10px]">{label}</span>
    </div>
  );
}
