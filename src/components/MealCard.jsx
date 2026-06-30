import { useState } from 'react';

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

  return (
    <div className="w-full flex items-center justify-between gap-2 py-1">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-700 leading-tight truncate">{label}</p>
        {extraPrice != null && (
          <p className="text-[9px] text-gray-400 leading-tight">+${extraPrice.toFixed(2)}</p>
        )}
      </div>

      {qty === 0 ? (
        <button
          onClick={e => { stop(e); if (!atLimit) onAdd(); }}
          disabled={atLimit}
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-base leading-none transition-colors ${
            atLimit ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : `${dotCls} hover:opacity-80`
          }`}
        >
          +
        </button>
      ) : (
        <div className="flex-shrink-0 flex items-center gap-2" onClick={stop}>
          <button
            onClick={e => { stop(e); onRemove(); }}
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-base leading-none transition-colors ${dotCls} hover:opacity-80`}
          >
            −
          </button>
          <span className="text-[13px] font-bold text-gray-700 min-w-[16px] text-center">
            {qty}
          </span>
          <button
            onClick={e => { stop(e); if (!atLimit) onAdd(); }}
            disabled={atLimit}
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-base leading-none transition-colors ${
              atLimit ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : `${dotCls} hover:opacity-80`
            }`}
          >
            +
          </button>
        </div>
      )}
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
  singleLabel = 'Single',
}) {
  const [imgError, setImgError] = useState(false);
  const cat = CATEGORY_STYLES[meal.category] || CATEGORY_STYLES.LIFESTYLE;
  const badge = meal.badge ? BADGE_STYLES[meal.badge] : null;
  const badgeWords = meal.badge ? meal.badge.split(' ') : [];

  return (
    <div
      onClick={onCardClick}
      className="relative ml-[90px] sm:ml-[100px] bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full cursor-pointer"
    >
      {/* Diagonal corner ribbon — solid clip-path triangle fills the corner exactly (no rotation math to get wrong), text is just rotated + nudged to sit inside it */}
      {badge && (
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-tr-2xl z-20 pointer-events-none">
          <div className={`absolute inset-0 [clip-path:polygon(0_0,100%_0,100%_100%)] ${badge.cls}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white translate-x-[11px] -translate-y-[11px] sm:translate-x-[13px] sm:-translate-y-[13px] transform rotate-45">
              {badgeWords.map((w, i) => (
                <div key={i} className="text-[7px] sm:text-[8px] font-extrabold tracking-wider leading-[9px] sm:leading-[10px] uppercase">
                  {w}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plate/photo — big circle, bleeds off the card's left edge, centered on the WHOLE card (equal overflow top + bottom) */}
      <div className="absolute -left-[90px] sm:-left-[100px] top-1/2 -translate-y-1/2 w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] rounded-full overflow-hidden shadow-lg bg-white z-10">
        {meal.image && !imgError ? (
          <img
            src={meal.image}
            alt={meal.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-2xl">📸</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="pl-[100px] sm:pl-[125px] pr-2 sm:pr-8 pt-2 sm:pt-3 flex-1 flex flex-col">
          <p className={`text-[8px] sm:text-[10px] font-bold tracking-widest uppercase ${cat.text} leading-tight mb-0.5`}>
            {cat.label}
          </p>

          <h3 className="text-[11px] sm:text-[14px] font-semibold text-gray-900 leading-snug mb-1">
            {meal.name}
          </h3>

          <p className="text-gray-400 text-[8px] sm:text-[10px] leading-snug line-clamp-2">
            {meal.description}
          </p>

          <div className="flex flex-wrap gap-1 mt-auto pt-1.5">
            {meal.dietary.map((d) => {
              const info = DIETARY[d] || { icon: '✓', label: d, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };
              return (
                <span
                  key={d}
                  title={d}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7px] sm:text-[9px] font-semibold ${info.cls}`}
                >
                  <span className="text-[8px] sm:text-[10px]">{info.icon}</span>
                  {info.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action rows — stacked, label left / fixed +- control right, same layout at every breakpoint */}
        <div className="flex flex-col divide-y divide-gray-100 pl-[100px] sm:pl-[125px] pr-2 sm:pr-3 pb-1 pt-1">
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
      </div>

      {/* Macro bar */}
      <div className="bg-brand-green rounded-b-2xl pl-[100px] sm:pl-[125px] pr-2 sm:pr-4 py-1 flex items-center justify-center gap-1.5 sm:gap-5">
        <MacroStat value={meal.protein} unit="g" label="Protein" />
        <div className="w-px h-4 bg-green-300" />
        <MacroStat value={meal.calories} unit="" label="Cal" />
        <div className="w-px h-4 bg-green-300" />
        <MacroStat value={meal.carbs} unit="g" label="Carbs" />
      </div>
    </div>
  );
}

function MacroStat({ value, unit, label }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-white text-[10px] sm:text-sm font-bold">{value}{unit}</span>
      <span className="text-green-100 text-[8px] sm:text-[10px]">{label}</span>
    </div>
  );
}
