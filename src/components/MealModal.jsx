import { useEffect } from 'react';

const CATEGORY_STYLES = {
  LIFESTYLE:     { text: 'text-green-600',  label: 'Lifestyle' },
  KETO:          { text: 'text-pink-600',   label: 'Keto' },
  PERFORMANCE:   { text: 'text-blue-600',   label: 'Performance' },
  'PLANT-BASED': { text: 'text-orange-500', label: 'Plant-Based' },
};

const DIETARY = {
  'Gluten Free': { icon: '🌾', label: 'Gluten Free', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  'Soy Free':    { icon: '🫘', label: 'Soy Free',    cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
  'Dairy Free':  { icon: '🥛', label: 'Dairy Free',  cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  'Vegan':       { icon: '🌿', label: 'Vegan',        cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

const DETAILS = {
  1:   { ingredients: 'Penne pasta, ground turkey, sweet green peas, cream of mushroom sauce, grated parmesan, roasted garlic, extra-virgin olive oil, sea salt, cracked black pepper, fresh parsley, chicken broth.', fat: 12, fiber: 4, sodium: 820, sugar: 3 },
  2:   { ingredients: 'Lean ground beef, center-cut bacon, broccoli florets, San Marzano crushed tomatoes, classic spaghetti, fresh basil, garlic, oregano, olive oil, sea salt, black pepper.', fat: 22, fiber: 5, sodium: 940, sugar: 6 },
  3:   { ingredients: 'Slow-roasted pork shoulder, black beans, cilantro lime rice, fresh pico de gallo (tomato, onion, jalapeño, cilantro, lime), pickled red onion, sea salt, cumin, garlic powder.', fat: 16, fiber: 8, sodium: 780, sugar: 4 },
  4:   { ingredients: 'Ground turkey, kidney beans, crushed tomatoes, chicken broth, chili powder, cumin, garlic, onion, jalapeño, all-natural honey cornbread (cornmeal, eggs, honey, buttermilk), roasted asparagus, shredded cheddar.', fat: 10, fiber: 7, sodium: 890, sugar: 8 },
  5:   { ingredients: 'Wild-caught salmon fillet, fingerling potatoes, broccolini, lemon zest, fresh dill, capers, olive oil, Dijon mustard, garlic, sea salt, cracked pepper.', fat: 18, fiber: 5, sodium: 640, sugar: 2 },
  6:   { ingredients: 'Organic extra-firm tofu, jasmine rice, baby bok choy, red bell peppers, Thai basil, coconut aminos, sesame oil, ginger, garlic, lime juice, rice vinegar, red pepper flakes.', fat: 9, fiber: 6, sodium: 710, sugar: 5 },
  7:   { ingredients: 'Shredded chicken breast, housemade buffalo sauce (hot sauce, butter, vinegar, garlic powder), elbow pasta, sharp cheddar, cream cheese, whole milk, panko breadcrumbs, scallions.', fat: 20, fiber: 3, sodium: 1100, sugar: 4 },
  8:   { ingredients: 'Bone-in pork shoulder (slow-cooked), apple cider vinegar BBQ sauce, cauliflower mash (cauliflower, butter, cream cheese, garlic), green beans, smoked paprika, sea salt, black pepper.', fat: 24, fiber: 6, sodium: 860, sugar: 5 },
  9:   { ingredients: 'Lean ground beef, taco seasoning (chili powder, cumin, paprika, garlic), shredded cheddar, fresh pico de gallo, sour cream, avocado, cilantro lime cauliflower rice, lime juice, sea salt.', fat: 22, fiber: 5, sodium: 820, sugar: 3 },
  10:  { ingredients: 'Sweet potato, canned chickpeas, coconut milk, crushed tomatoes, garam masala, cumin, turmeric, ginger, garlic, onion, jasmine rice, fresh cilantro, lime, sea salt.', fat: 8, fiber: 9, sodium: 620, sugar: 9 },
  11:  { ingredients: 'Boneless chicken thighs, raw honey, garlic, soy sauce, sesame oil, sweet potato wedges, broccolini, olive oil, garlic powder, sea salt, cracked pepper, red pepper flakes.', fat: 14, fiber: 5, sodium: 760, sugar: 12 },
  101: { ingredients: 'Boneless chicken thighs, crushed tomatoes, heavy cream, garam masala, cumin, coriander, turmeric, ginger, garlic, butter, basmati rice, fresh cilantro, sea salt.', fat: 16, fiber: 3, sodium: 870, sugar: 7 },
  102: { ingredients: 'USDA Choice beef brisket (dry-rubbed, smoked 12 hrs), roasted sweet potatoes, charred broccolini, fresh chimichurri (parsley, oregano, garlic, red wine vinegar, olive oil), smoked salt.', fat: 28, fiber: 5, sodium: 790, sugar: 6 },
  103: { ingredients: 'Green and black lentils, cremini and portobello mushrooms, vegetable broth, Worcestershire (vegan), thyme, rosemary, garlic, onion, carrots, cauliflower mash, nutritional yeast, sea salt.', fat: 4, fiber: 11, sodium: 680, sugar: 5 },
  104: { ingredients: 'Sashimi-grade yellowfin tuna, cauliflower rice, Persian cucumber, edamame, avocado, pickled ginger, sesame seeds, sriracha mayo (sriracha, Japanese mayo), coconut aminos, nori.', fat: 14, fiber: 4, sodium: 720, sugar: 3 },
  105: { ingredients: 'Marinated chicken breast (lemon, oregano, garlic), herbed quinoa, cherry tomatoes, Kalamata olives, crumbled feta, cucumber, red onion, tzatziki (Greek yogurt, dill, cucumber, garlic).', fat: 15, fiber: 5, sodium: 810, sugar: 4 },
  106: { ingredients: 'Jumbo Gulf shrimp, stone-ground cheddar grits, roasted tri-color peppers, Cajun spice blend (paprika, cayenne, garlic powder, onion powder, thyme), butter, garlic, scallions, lemon.', fat: 18, fiber: 3, sodium: 920, sugar: 3 },
  107: { ingredients: 'Jasmine rice, boneless chicken breast, scrambled eggs, frozen peas, carrots, garlic, ginger, sesame oil, teriyaki sauce (soy sauce, mirin, sake, sugar), green onion, sesame seeds.', fat: 10, fiber: 3, sodium: 890, sugar: 8 },
  108: { ingredients: 'USDA Prime ribeye steak (dry-aged 14 days), asparagus, brussels sprouts, garlic herb compound butter (butter, parsley, thyme, garlic, lemon zest), sea salt, cracked black pepper, avocado oil.', fat: 34, fiber: 4, sodium: 680, sugar: 2 },
  109: { ingredients: 'Tri-color quinoa, black beans, roasted corn, avocado, cherry tomatoes, red onion, cilantro, chipotle cashew cream (raw cashews, chipotle, lime, garlic), lime juice, cumin, sea salt.', fat: 11, fiber: 12, sodium: 590, sugar: 4 },
  201: { ingredients: 'Rolled oats, whey protein isolate, whole chia seeds, almond milk, banana, fresh blueberries, strawberries, natural almond butter, raw honey, vanilla extract, cinnamon.', fat: 9, fiber: 7, sodium: 180, sugar: 14 },
  202: { ingredients: 'Egg whites (8 large), baby spinach, roasted red bell peppers, cremini mushrooms, soft goat cheese, turkey sausage (turkey, fennel, sage, black pepper), sea salt, olive oil.', fat: 8, fiber: 3, sodium: 540, sugar: 2 },
  203: { ingredients: 'Free-range eggs (4 large), wild-caught smoked salmon, cream cheese, capers, fresh dill, red onion, everything bagel seasoning, sea salt, cracked black pepper.', fat: 22, fiber: 1, sodium: 980, sugar: 2 },
  204: { ingredients: 'Organic açaí puree, frozen banana, mixed berries (blueberry, strawberry, mango), gluten-free granola, unsweetened coconut flakes, hemp seeds, agave nectar.', fat: 8, fiber: 9, sodium: 90, sugar: 28 },
  301: { ingredients: 'Rolled oats, natural peanut butter, whey protein, Medjool dates, dark chocolate chips (70% cacao), raw honey, vanilla extract, sea salt flakes.', fat: 8, fiber: 3, sodium: 140, sugar: 10 },
  302: { ingredients: 'Whole-milk Greek yogurt, house-made granola (oats, almonds, maple syrup, coconut oil), seasonal fruit compote (strawberry, blueberry, lemon), raw local honey.', fat: 5, fiber: 2, sodium: 95, sugar: 18 },
  303: { ingredients: 'Aged parmesan (baked into crisps), fresh avocado, lime juice, jalapeño, red onion, cilantro, tomato, garlic, sea salt, black pepper.', fat: 12, fiber: 3, sodium: 380, sugar: 1 },
  304: { ingredients: 'Medjool dates, raw almonds, raw cashews, cacao nibs, coconut flakes, vanilla bean, sea salt. No added sugar. Vegan, Whole30-friendly.', fat: 10, fiber: 4, sodium: 60, sugar: 16 },
};

const DEFAULT_DETAILS = { ingredients: 'Fresh, high-quality ingredients sourced locally where possible.', fat: 12, fiber: 4, sodium: 750, sugar: 4 };

function NutritionRow({ label, value, unit, bold }) {
  return (
    <div className={`flex justify-between items-center py-1.5 border-b border-gray-100 ${bold ? 'font-bold' : ''}`}>
      <span className={`text-sm ${bold ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'text-gray-900' : 'text-gray-700'}`}>{value}{unit}</span>
    </div>
  );
}

function QtyRow({ label, price, qty, onAdd, onRemove, atLimit }) {
  const stop = e => e.stopPropagation();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">per meal</p>
        <p className="text-sm font-bold text-gray-900">${price.toFixed(2)} · {label}</p>
      </div>
      {qty === 0 ? (
        <button
          onClick={e => { stop(e); if (!atLimit) onAdd(); }}
          disabled={atLimit}
          className={`flex-shrink-0 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors ${
            atLimit
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-brand-green hover:bg-brand-green-dark text-white shadow-sm'
          }`}
        >
          {atLimit ? 'Plan full' : 'Add'}
        </button>
      ) : (
        <div className="flex-shrink-0 flex items-center gap-2 bg-brand-charcoal rounded-xl px-2 py-1.5 shadow-sm" onClick={stop}>
          <button onClick={e => { stop(e); onRemove(); }} className="w-7 h-7 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-bold flex items-center justify-center transition-colors">−</button>
          <span className="text-white font-bold text-sm min-w-[18px] text-center">{qty}</span>
          <button
            onClick={e => { stop(e); if (!atLimit) onAdd(); }}
            disabled={atLimit}
            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors ${atLimit ? 'bg-gray-600 opacity-40 cursor-not-allowed text-white' : 'bg-brand-green hover:bg-brand-green-dark text-white'}`}
          >+</button>
        </div>
      )}
    </div>
  );
}

export default function MealModal({
  meal, onClose,
  singleQty = 0, doubleQty = 0,
  onAddSingle, onRemoveSingle,
  onAddDouble, onRemoveDouble,
  atLimit,
}) {
  const cat = CATEGORY_STYLES[meal.category] || CATEGORY_STYLES.LIFESTYLE;
  const details = DETAILS[meal.id] || DEFAULT_DETAILS;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const doubleProteinVal = Math.round(meal.protein * 1.9);
  const doubleCals = meal.calories + Math.round(meal.protein * 1.5);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-36 sm:h-44 bg-brand-mint flex-shrink-0 overflow-hidden">
          {meal.image ? (
            <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
              <span className="text-5xl">📸</span>
              <span className="text-gray-400 text-sm mt-2">Photo coming soon</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors text-sm font-bold"
          >
            ✕
          </button>
          {meal.badge && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${
                meal.badge === 'Best Seller' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' :
                meal.badge === 'Going Fast'  ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white' :
                'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
              }`}>
                {meal.badge === 'Best Seller' ? '★ ' : meal.badge === 'Going Fast' ? '🔥 ' : '✦ '}
                {meal.badge}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          <div>
            <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${cat.text}`}>{cat.label}</p>
            <h2 className="font-display text-2xl text-gray-900 leading-tight mb-1.5">{meal.name}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{meal.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {meal.dietary.map(d => {
                const info = DIETARY[d] || { icon: '✓', label: d, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };
                return (
                  <span key={d} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${info.cls}`}>
                    {info.icon} {info.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Protein comparison — informational */}
          {meal.doubleProtein && (
            <div>
              <h3 className="font-display text-lg text-gray-900 mb-3">Protein Options</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                  <p className="font-bold text-gray-900 text-sm mb-2">Single Protein</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Protein</span><span className="font-semibold">{meal.protein}g</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Calories</span><span className="font-semibold">{meal.calories}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-semibold">${meal.basePrice.toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-brand-green bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900 text-sm">2× Protein</p>
                    <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                      +${meal.doubleProteinPrice?.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Protein</span><span className="font-semibold text-green-700">{doubleProteinVal}g ↑</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Calories</span><span className="font-semibold">{doubleCals}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-semibold">${(meal.basePrice + meal.doubleProteinPrice).toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nutrition Facts */}
          <div>
            <h3 className="font-display text-lg text-gray-900 mb-2">Nutrition Facts</h3>
            <div className="bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100">
              <p className="text-xs text-gray-400 py-1.5 border-b border-gray-200 mb-1">Per serving (single protein)</p>
              <NutritionRow label="Calories"           value={meal.calories}  unit=""    bold />
              <NutritionRow label="Total Fat"          value={details.fat}    unit="g" />
              <NutritionRow label="Total Carbohydrate" value={meal.carbs}     unit="g" />
              <NutritionRow label="  Dietary Fiber"    value={details.fiber}  unit="g" />
              <NutritionRow label="  Total Sugars"     value={details.sugar}  unit="g" />
              <NutritionRow label="Protein"            value={meal.protein}   unit="g"   bold />
              <NutritionRow label="Sodium"             value={details.sodium} unit="mg" />
            </div>
          </div>

          <div className="pb-2">
            <h3 className="font-display text-lg text-gray-900 mb-2">Ingredients</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{details.ingredients}</p>
          </div>
        </div>

        {/* Footer: add controls */}
        <div className="flex-shrink-0 px-5 py-4 bg-white border-t border-gray-100 space-y-3">
          <QtyRow
            label="Single"
            price={meal.basePrice}
            qty={singleQty}
            onAdd={() => { onAddSingle(meal.id); if (singleQty === 0) onClose(); }}
            onRemove={() => onRemoveSingle(meal.id)}
            atLimit={atLimit && singleQty === 0}
          />
          {meal.doubleProtein && (
            <QtyRow
              label="2× Protein"
              price={meal.basePrice + meal.doubleProteinPrice}
              qty={doubleQty}
              onAdd={() => { onAddDouble(meal.id); if (doubleQty === 0) onClose(); }}
              onRemove={() => onRemoveDouble(meal.id)}
              atLimit={atLimit && doubleQty === 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
