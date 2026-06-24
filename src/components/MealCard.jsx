import { useState } from 'react';

const CATEGORY_STYLES = {
  LIFESTYLE:     { pill: 'bg-green-100 text-green-700',   label: 'Lifestyle' },
  KETO:          { pill: 'bg-pink-100 text-pink-700',     label: 'Keto' },
  PERFORMANCE:   { pill: 'bg-blue-100 text-blue-700',     label: 'Performance' },
  'PLANT-BASED': { pill: 'bg-orange-100 text-orange-700', label: 'Plant-Based' },
};

const BADGE_STYLES = {
  'Best Seller': { cls: 'bg-amber-400 text-white',  icon: '★' },
  'Going Fast':  { cls: 'bg-rose-500 text-white',   icon: '🔥' },
  'New':         { cls: 'bg-emerald-500 text-white', icon: '✦' },
};

function PortionBtn({ label, extraPrice, qty, onAdd, onRemove, atLimit, isDouble }) {
  const stop = e => e.stopPropagation();
  const activeCls = isDouble ? 'bg-brand-green text-white' : 'bg-brand-charcoal text-white';

  if (qty === 0) {
    return (
      <button
        onClick={e => { stop(e); if (!atLimit) onAdd(); }}
        disabled={atLimit}
        className={`flex-1 flex items-center justify-between px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-colors ${
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
      className="flex-1 flex items-center justify-between px-2.5 py-1 rounded-full border border-gray-200 bg-white"
      onClick={stop}
    >
      <span className="text-[10px] text-gray-400 font-medium">✓ {label}</span>
      <div className="flex items-center gap-1">
        <button onClick={e => { stop(e); onRemove(); }} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${activeCls} hover:opacity-80`}>−</button>
        <span className="text-xs font-bold text-gray-700 w-4 text-center">{qty}</span>
        <button
          onClick={e => { stop(e); if (!atLimit) onAdd(); }}
          disabled={atLimit}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${atLimit ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : `${activeCls} hover:opacity-80`}`}
        >+</button>
      </div>
    </div>
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
}) {
  const [imgError, setImgError] = useState(false);
  const cat   = CATEGORY_STYLES[meal.category] || CATEGORY_STYLES.LIFESTYLE;
  const badge = meal.badge ? BADGE_STYLES[meal.badge] : null;

  return (
    /*
     * No pl/pr offset here — card takes the full column width.
     * The circle is positioned inside the content row (relative),
     * so it's centred only on the content area and never overlaps the macro bar.
     * Card has no overflow-hidden; macro bar carries its own rounded-b-2xl.
     */
    <div className="relative">

      {/* Badge — absolute on the outer wrapper, top-right of card */}
      {badge && (
        <div className={`absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${badge.cls}`}>
          <span>{badge.icon}</span>
          {meal.badge}
        </div>
      )}

      <div
        onClick={onCardClick}
        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer"
      >
        {/*
         * Content row — `relative` so the circle is positioned inside it.
         * min-h-[128px] guarantees the row is at least as tall as the circle,
         * so the circle never bleeds into the macro bar below.
         */}
        <div className="relative flex items-center min-h-[128px]">

          {/* Circle — centred on the content row, bleeds ~16 px outside card on sm+ */}
          <div className="absolute -left-0 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-32 h-32 flex-shrink-0">
            {meal.image && !imgError ? (
              <img
                src={meal.image}
                alt={meal.name}
                onError={() => setImgError(true)}
                className="w-full h-full rounded-full object-cover shadow-xl"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center shadow-xl">
                <span className="text-3xl">📸</span>
                <span className="text-[9px] text-gray-400 mt-0.5 text-center leading-tight px-2">Coming soon</span>
              </div>
            )}
          </div>

          {/* Text content — left padding clears the circle's interior footprint */}
          {/* Mobile: circle flush (128 px inside) + 8 px gap = 136 px → pl-[136px]  */}
          {/* sm+:    circle bleeds 16 px, so 112 px inside  + 8 px gap = 120 px → sm:pl-[120px] */}
          <div className="flex-1 pl-[136px] sm:pl-[120px] pr-3 py-3 flex flex-col gap-1.5">

            <span className={`self-start text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${cat.pill}`}>
              {cat.label}
            </span>

            <h3 className="font-display text-[14px] sm:text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">
              {meal.name}
            </h3>

            <div className="flex flex-wrap gap-1">
              {meal.dietary.map(d => (
                <span key={d} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                  {d}
                </span>
              ))}
            </div>

            <div className="flex gap-1.5 mt-auto pt-0.5">
              <PortionBtn
                label="Single"
                qty={singleQty}
                onAdd={() => onAddSingle(meal.id)}
                onRemove={() => onRemoveSingle(meal.id)}
                atLimit={atLimit}
              />
              {meal.doubleProtein && (
                <PortionBtn
                  label="2× Protein"
                  extraPrice={meal.doubleProteinPrice}
                  qty={doubleQty}
                  onAdd={() => onAddDouble(meal.id)}
                  onRemove={() => onRemoveDouble(meal.id)}
                  atLimit={atLimit}
                  isDouble
                />
              )}
            </div>
          </div>
        </div>

        {/* Macro bar — rounded-b-2xl owns the bottom corners (card has no overflow-hidden) */}
        <div className="bg-brand-charcoal rounded-b-2xl px-3 py-2 flex items-center justify-center gap-3">
          <MacroStat value={meal.protein} unit="g" label="Protein" />
          <div className="w-px h-3 bg-gray-600" />
          <MacroStat value={meal.calories} unit="" label="Cal" />
          <div className="w-px h-3 bg-gray-600" />
          <MacroStat value={meal.carbs} unit="g" label="Carbs" />
        </div>
      </div>
    </div>
  );
}

function MacroStat({ value, unit, label }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-white text-xs font-bold">{value}{unit}</span>
      <span className="text-gray-400 text-[10px]">{label}</span>
    </div>
  );
}
