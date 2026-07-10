import { useReducer, useState, useMemo, useEffect } from 'react';
import ProgressBar from './components/ProgressBar';
import StepMealCount from './steps/StepMealCount';
import StepPlan from './steps/StepPlan';
import StepMealMode from './steps/StepMealMode';
import StepEntrees from './steps/StepEntrees';
import StepBreakfast from './steps/StepBreakfast';
import StepSnacks from './steps/StepSnacks';
import StepAllergies from './steps/StepAllergies';
import StepCheckout from './steps/StepCheckout';
import ConfirmationScreen from './steps/ConfirmationScreen';
import ShopifyRedirectScreen from './steps/ShopifyRedirectScreen';
import { useShopifyMenu } from './hooks/useShopifyMenu';
import { setWeekForSelection, earliestDeliverableMonday } from './lib/shopifyWeeks';
import { buildEntreeSelections, buildMetadataPayload, buildBreakfastMetadata, buildCheckoutUrl } from './lib/shopifyCheckout';
import { defaultEntreeSelection, chefsChoiceEntreeSelection, defaultBreakfastSelection } from './lib/defaultSelections';
import { shopifyConfig } from './config/shopify';
import { loadPersistedState, savePersistedState, clearPersistedState } from './lib/persistence';
import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS, ALLERGY_OPTIONS } from './data/meals';

const persisted = loadPersistedState();

const PLAN_TO_KEY = { lifestyle: 'lifestyle', performance: 'performance', keto: 'keto', plant_based: 'plant' };
const CATEGORY_TO_PLAN_KEY = { LIFESTYLE: 'lifestyle', PERFORMANCE: 'performance', KETO: 'keto', 'PLANT-BASED': 'plant' };

// Used only if the live Shopify fetch hard-fails (offline dev, bad token,
// etc.) so the mockup still demos. A collection that legitimately returns
// zero products is shown as empty, not silently swapped for this.
const FALLBACK_WEEKS = [
  { id: 'w1', handle: null, deliveryDate: null, label: 'Week of Jul 13', meals: MEALS_WEEK1 },
  { id: 'w2', handle: null, deliveryDate: null, label: 'Week of Jul 20', meals: MEALS_WEEK2 },
];

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_SINGLE': {
      const prev = state.singles[action.id] || 0;
      return { ...state, singles: { ...state.singles, [action.id]: prev + 1 } };
    }
    case 'REMOVE_SINGLE': {
      const prev = state.singles[action.id] || 0;
      const next = Math.max(0, prev - 1);
      const s = { ...state.singles, [action.id]: next };
      if (next === 0) delete s[action.id];
      return { ...state, singles: s };
    }
    case 'ADD_DOUBLE': {
      const prev = state.doubles[action.id] || 0;
      return { ...state, doubles: { ...state.doubles, [action.id]: prev + 1 } };
    }
    case 'REMOVE_DOUBLE': {
      const prev = state.doubles[action.id] || 0;
      const next = Math.max(0, prev - 1);
      const d = { ...state.doubles, [action.id]: next };
      if (next === 0) delete d[action.id];
      return { ...state, doubles: d };
    }
    case 'SET_BULK_SINGLES': {
      const singles = {};
      action.ids.forEach(id => { singles[id] = (singles[id] || 0) + 1; });
      return { singles, doubles: {} };
    }
    case 'SET_BULK_BREAKFAST': {
      const newSingles = { ...state.singles };
      (action.clearIds || []).forEach(id => delete newSingles[id]);
      action.ids.forEach(id => { newSingles[id] = (newSingles[id] || 0) + 1; });
      return { ...state, singles: newSingles };
    }
    case 'CLEAR_SNACKS': {
      const s = { ...state.singles };
      const d = { ...state.doubles };
      action.ids.forEach(id => { delete s[id]; delete d[id]; });
      return { singles: s, doubles: d };
    }
    case 'CLEAR_ENTREES': {
      const s = { ...state.singles };
      const d = { ...state.doubles };
      action.ids.forEach(id => { delete s[id]; delete d[id]; });
      return { singles: s, doubles: d };
    }
    case 'RESET':
      return { singles: {}, doubles: {} };
    default:
      return state;
  }
}

function computeEntreeCount(singles, doubles, allEntreeIds) {
  let count = 0;
  Object.entries(singles).forEach(([id, qty]) => { if (allEntreeIds.has(Number(id))) count += qty; });
  Object.entries(doubles).forEach(([id, qty]) => { if (allEntreeIds.has(Number(id))) count += qty; });
  return count;
}

function computeUnlockedUntil(mealCount, selectedPlan, mealMode, entreeCount, breakfastCount, breakfastSkipped) {
  if (!mealCount) return 'mealCount';
  if (!selectedPlan) return 'plan';
  if (!mealMode) return 'mealMode';
  if (entreeCount < mealCount) return 'entrees';
  if (!breakfastCount && !breakfastSkipped) return 'breakfast';
  return 'checkout';
}

export default function App() {
  const [step, setStep] = useState(persisted?.step || 'mealCount');
  const [cart, dispatch] = useReducer(cartReducer, persisted?.cart || { singles: {}, doubles: {} });
  const [orderDetails, setOrderDetails] = useState(null);
  const [mealCount, setMealCount] = useState(persisted?.mealCount ?? null);
  const [selectedPlan, setSelectedPlan] = useState(persisted?.selectedPlan ?? null);
  const [mealMode, setMealMode] = useState(persisted?.mealMode ?? null);
  const [breakfastCount, setBreakfastCount] = useState(persisted?.breakfastCount ?? null);
  const [breakfastSkipped, setBreakfastSkipped] = useState(persisted?.breakfastSkipped ?? false);
  const [allergySelected, setAllergySelected] = useState(persisted?.allergySelected || new Set());
  const [allergyNotes, setAllergyNotes] = useState(persisted?.allergyNotes || '');
  const [discountCode, setDiscountCode] = useState(persisted?.discountCode || '');

  useEffect(() => {
    savePersistedState({
      step, cart, mealCount, selectedPlan, mealMode,
      breakfastCount, breakfastSkipped, allergySelected, allergyNotes, discountCode,
    });
  }, [step, cart, mealCount, selectedPlan, mealMode, breakfastCount, breakfastSkipped, allergySelected, allergyNotes, discountCode]);

  const menu = useShopifyMenu(2);
  const usingFallback = !!menu.error;
  const rawWeeks = usingFallback ? FALLBACK_WEEKS : menu.weeks;
  const menuLoading = !usingFallback && menu.loading;

  // `weeks` stays entrées-only (a live collection bundles all product
  // types together, see meal.productType). Breakfast/snacks are pulled
  // from whichever week is active in the Entrées week tabs, since each
  // week's collection has its own breakfast/snacks products.
  const weeks = useMemo(
    () => rawWeeks.map(w => ({
      ...w,
      meals: usingFallback ? w.meals : w.meals.filter(m => m.productType === 'entrees'),
    })),
    [rawWeeks, usingFallback]
  );
  const [activeWeekId, setActiveWeekId] = useState('w1');
  const activeRawWeek = rawWeeks.find(w => w.id === activeWeekId) || rawWeeks[0];
  const breakfastItems = usingFallback
    ? BREAKFAST_ITEMS
    : (activeRawWeek ? activeRawWeek.meals.filter(m => m.productType === 'breakfast') : []);
  const snackItems = usingFallback
    ? SNACK_ITEMS
    : (activeRawWeek ? activeRawWeek.meals.filter(m => m.productType === 'snacks') : []);

  const entreeMealsFlat = useMemo(() => weeks.flatMap(w => w.meals), [weeks]);
  const allEntreeIds = useMemo(
    () => new Set(entreeMealsFlat.map(m => m.id)),
    [entreeMealsFlat]
  );

  function go(target) {
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const entreeCount   = computeEntreeCount(cart.singles, cart.doubles, allEntreeIds);
  const unlockedUntil = computeUnlockedUntil(mealCount, selectedPlan, mealMode, entreeCount, breakfastCount, breakfastSkipped);

  function handleAddSingle(id)    { dispatch({ type: 'ADD_SINGLE', id }); }
  function handleRemoveSingle(id) { dispatch({ type: 'REMOVE_SINGLE', id }); }
  function handleAddDouble(id)    { dispatch({ type: 'ADD_DOUBLE', id }); }
  function handleRemoveDouble(id) { dispatch({ type: 'REMOVE_DOUBLE', id }); }
  function handleClearCart() {
    dispatch({ type: 'RESET' });
    go('entrees');
  }

  // Follows ReBuilt's confirmed default-fill algorithm (see
  // src/lib/defaultSelections.js) rather than a naive round-robin -- the
  // old `index % pool.length` approach could double up on one meal while
  // never selecting another (e.g. 5 Performance meals producing
  // [2,1,1,1,0] instead of the correct [1,1,1,1,1]).
  function rechefMeals(weekMeals) {
    let selections;
    if (selectedPlan === 'chefs_choice') {
      const perfPool = weekMeals.filter(m => m.category === 'PERFORMANCE');
      const lifePool = weekMeals.filter(m => m.category === 'LIFESTYLE');
      selections = chefsChoiceEntreeSelection(perfPool, lifePool, mealCount);
    } else {
      const planCategoryMap = { lifestyle: 'LIFESTYLE', performance: 'PERFORMANCE', keto: 'KETO', plant_based: 'PLANT-BASED' };
      const category = planCategoryMap[selectedPlan] || null;
      const pool = category ? weekMeals.filter(m => m.category === category) : weekMeals;
      selections = defaultEntreeSelection(pool, mealCount);
    }
    const ids = [];
    selections.forEach(({ meal, quantity }) => {
      for (let i = 0; i < quantity; i++) ids.push(meal.id);
    });
    dispatch({ type: 'SET_BULK_SINGLES', ids });
  }

  function handleChefChosen() {
    rechefMeals(weeks[0] ? weeks[0].meals : []);
    setMealMode('chef');
    go('entrees');
  }

  // Breakfast/snacks are week-specific products, so switching the active
  // entrées week invalidates whatever breakfast/snack items were already
  // in the cart -- they belonged to the previous week's collection.
  function changeActiveWeek(weekId) {
    if (weekId === activeWeekId) return;
    dispatch({ type: 'SET_BULK_BREAKFAST', ids: [], clearIds: breakfastItems.map(m => m.id) });
    dispatch({ type: 'CLEAR_SNACKS', ids: snackItems.map(m => m.id) });
    setActiveWeekId(weekId);
  }

  function handleSelectWeek(weekId) {
    changeActiveWeek(weekId);
  }

  function handleRechefWeek(weekId) {
    const week = weeks.find(w => w.id === weekId);
    rechefMeals(week ? week.meals : []);
    changeActiveWeek(weekId);
  }

  function handleClearEntrees(weekId) {
    dispatch({ type: 'CLEAR_ENTREES', ids: [...allEntreeIds] });
    if (weekId) changeActiveWeek(weekId);
  }

  function handleOwnMeals() {
    dispatch({ type: 'RESET' });
    setMealMode('own');
    go('entrees');
  }

  function handleSetBreakfastCount(count) {
    setBreakfastCount(count);
    setBreakfastSkipped(false);
    if (mealMode === 'chef') {
      const clearIds = breakfastItems.map(m => m.id);
      if (count) {
        // Keto-plan customers default to Keto-only breakfast items;
        // everyone else draws from the full lineup -- see
        // defaultBreakfastSelection in lib/defaultSelections.js. Replaces
        // a random shuffle that didn't match ReBuilt's real default logic
        // at all.
        const isKetoPlan = selectedPlan === 'keto';
        const selections = defaultBreakfastSelection(breakfastItems, count, isKetoPlan);
        const ids = [];
        selections.forEach(({ meal, quantity }) => {
          for (let i = 0; i < quantity; i++) ids.push(meal.id);
        });
        dispatch({ type: 'SET_BULK_BREAKFAST', ids, clearIds });
      } else {
        dispatch({ type: 'SET_BULK_BREAKFAST', ids: [], clearIds });
      }
    }
  }

  function handleSkipBreakfast() {
    setBreakfastSkipped(true);
    setBreakfastCount(null);
    go('snacks');
  }

  function handleSkipSnacks() {
    dispatch({ type: 'CLEAR_SNACKS', ids: snackItems.map(m => m.id) });
    go('allergies');
  }

  function handleConfirm(details) {
    setOrderDetails(details);
    go('confirmation');
  }

  // Builds the real Shopify checkout URL from current cart state -- see
  // src/lib/shopifyCheckout.js. Returns null if there's nothing orderable
  // yet (e.g. no meal count picked), so ShopifyRedirectScreen can show an
  // error instead of navigating with a broken/empty cart.
  function buildRealCheckoutUrl() {
    if (!mealCount) return null;
    const entreeMeals = weeks.flatMap(w => w.meals);
    const entreeIdSet = new Set(entreeMeals.map(m => m.id));
    const entreeSingles = Object.fromEntries(Object.entries(cart.singles).filter(([id]) => entreeIdSet.has(Number(id))));
    const entreeDoubles = Object.fromEntries(Object.entries(cart.doubles).filter(([id]) => entreeIdSet.has(Number(id))));

    const { userSelections, singleProteinCount, doubleProteinCount } = buildEntreeSelections({
      singles: entreeSingles, doubles: entreeDoubles, entreeMeals,
    });
    if (userSelections.length === 0) return null;

    // Which week's meals are actually in the cart -- the delivery date
    // (_setWeek) must match the menu those meals came from.
    const selectionWeek = weeks.find(w => w.meals.some(m => (cart.singles[m.id] || 0) + (cart.doubles[m.id] || 0) > 0)) || weeks[0];
    if (!selectionWeek) return null;
    const setWeek = selectionWeek.deliveryDate
      ? setWeekForSelection(selectionWeek.deliveryDate, new Date())
      : earliestDeliverableMonday(new Date());

    const defaultPlanKey = PLAN_TO_KEY[selectedPlan] || CATEGORY_TO_PLAN_KEY[userSelections[0].planName.toUpperCase()] || 'lifestyle';
    const entreeMetadataJson = buildMetadataPayload({
      setWeek, mealCount, defaultPlanKey, userSelections, singleProteinCount, doubleProteinCount,
    });

    const entreeVariant = shopifyConfig.entreesVariants[mealCount];
    if (!entreeVariant) return null;

    const allergyLabels = [...allergySelected]
      .filter(id => id !== 'none')
      .map(id => ALLERGY_OPTIONS.find(o => o.id === id)?.label)
      .filter(Boolean);
    const allergiesValue = allergyLabels.length ? allergyLabels.join(', ') : 'No Allergies';
    const allergyNotesValue = allergyNotes.trim() || 'No Allergies Notes';

    // Breakfast: same flat box-rate model as entrées, its own variant map
    // keyed by count (shopifyConfig.breakfastVariants).
    let breakfastLine = null;
    if (breakfastCount && shopifyConfig.breakfastVariants[breakfastCount]) {
      const breakfastVariant = shopifyConfig.breakfastVariants[breakfastCount];
      const breakfastMetadataJson = buildBreakfastMetadata({
        setWeek, breakfastCount, singles: cart.singles, doubles: cart.doubles, breakfastMeals: breakfastItems,
        isKetoPlan: selectedPlan === 'keto',
      });
      breakfastLine = { variantId: breakfastVariant.id, metadataJson: breakfastMetadataJson };
    }

    // Snacks: each selected item is its own cart line (see shopifyCheckout.js).
    const snackIdSet = new Set(snackItems.map(m => m.id));
    const snackLines = [];
    [cart.singles, cart.doubles].forEach(source => {
      Object.entries(source).forEach(([id, qty]) => {
        if (qty <= 0) return;
        const meal = snackItems.find(m => m.id === Number(id));
        if (meal && snackIdSet.has(meal.id)) snackLines.push({ meal, quantity: qty });
      });
    });

    return buildCheckoutUrl({
      entree: { variantId: entreeVariant.id, mealCount, metadataJson: entreeMetadataJson },
      doubleProtein: doubleProteinCount > 0 ? { quantity: doubleProteinCount } : null,
      breakfast: breakfastLine,
      snackLines,
      setWeek,
      allergiesValue,
      allergyNotesValue,
      discountCode: discountCode.trim(),
    });
  }

  function handleReset() {
    dispatch({ type: 'RESET' });
    setOrderDetails(null);
    setMealCount(null);
    setSelectedPlan(null);
    setMealMode(null);
    setBreakfastCount(null);
    setBreakfastSkipped(false);
    setDiscountCode('');
    setAllergySelected(new Set());
    setAllergyNotes('');
    clearPersistedState();
    go('mealCount');
  }

  const sharedCartProps = {
    singles: cart.singles,
    doubles: cart.doubles,
    onAddSingle: handleAddSingle,
    onRemoveSingle: handleRemoveSingle,
    onAddDouble: handleAddDouble,
    onRemoveDouble: handleRemoveDouble,
    mealCount,
    onClear: handleClearCart,
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-svh bg-brand-mint flex flex-col">
        <ProgressBar currentRoute="checkout" unlockedUntil="checkout" onNavigate={go} />
        <ConfirmationScreen orderDetails={orderDetails} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-brand-mint flex flex-col">
      <ProgressBar currentRoute={step} unlockedUntil={unlockedUntil} onNavigate={go} />

      {step === 'mealCount' && (
        <StepMealCount
          mealCount={mealCount}
          setMealCount={setMealCount}
          onNext={() => go('plan')}
        />
      )}

      {step === 'plan' && (
        <StepPlan
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          onNext={() => go('mealMode')}
          onBack={() => go('mealCount')}
        />
      )}

      {step === 'mealMode' && (
        <StepMealMode
          selectedPlan={selectedPlan}
          mealCount={mealCount}
          onChefChosen={handleChefChosen}
          onOwnMeals={handleOwnMeals}
          onBack={() => go('plan')}
        />
      )}

      {step === 'entrees' && (
        <StepEntrees
          {...sharedCartProps}
          weeks={weeks}
          activeWeek={activeWeekId}
          onSelectWeek={handleSelectWeek}
          entreeMeals={entreeMealsFlat}
          breakfastItems={breakfastItems}
          snackItems={snackItems}
          menuLoading={menuLoading}
          menuError={menu.error}
          mealDetails={menu.mealDetails}
          entreeCount={entreeCount}
          mealMode={mealMode}
          onNext={() => go('breakfast')}
          onBack={() => go('mealMode')}
          onClearEntrees={handleClearEntrees}
          onRechefWeek={handleRechefWeek}
        />
      )}

      {step === 'breakfast' && (
        <StepBreakfast
          {...sharedCartProps}
          items={breakfastItems}
          entreeMeals={entreeMealsFlat}
          breakfastItems={breakfastItems}
          snackItems={snackItems}
          mealDetails={menu.mealDetails}
          mealMode={mealMode}
          breakfastCount={breakfastCount}
          onSetBreakfastCount={handleSetBreakfastCount}
          onSkipBreakfast={handleSkipBreakfast}
          onNext={() => go('snacks')}
          onBack={() => go('entrees')}
        />
      )}

      {step === 'snacks' && (
        <StepSnacks
          {...sharedCartProps}
          items={snackItems}
          entreeMeals={entreeMealsFlat}
          breakfastItems={breakfastItems}
          snackItems={snackItems}
          mealDetails={menu.mealDetails}
          onNext={() => go('allergies')}
          onSkipSnacks={handleSkipSnacks}
          onBack={() => go('breakfast')}
          breakfastCount={breakfastCount}
        />
      )}

      {step === 'allergies' && (
        <StepAllergies
          selected={allergySelected}
          setSelected={setAllergySelected}
          customText={allergyNotes}
          setCustomText={setAllergyNotes}
          onViewSummary={() => go('checkout')}
          onCheckout={() => go('shopifyRedirect')}
          onBack={() => go('snacks')}
        />
      )}

      {step === 'shopifyRedirect' && (
        <ShopifyRedirectScreen checkoutUrl={buildRealCheckoutUrl()} onBack={() => go('checkout')} />
      )}

      {step === 'checkout' && (
        <StepCheckout
          {...sharedCartProps}
          weeks={weeks}
          breakfastCount={breakfastCount}
          breakfastItems={breakfastItems}
          snackItems={snackItems}
          discountCode={discountCode}
          setDiscountCode={setDiscountCode}
          allergySelected={allergySelected}
          allergyNotes={allergyNotes}
          onBack={() => go('allergies')}
          onConfirm={() => go('shopifyRedirect')}
        />
      )}
    </div>
  );
}
