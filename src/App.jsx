import { useReducer, useState, useMemo, useEffect, useRef } from 'react';
import ProgressBar from './components/ProgressBar';
import StepMealCount from './steps/StepMealCount';
import StepPlan from './steps/StepPlan';
import StepMealMode from './steps/StepMealMode';
import StepEntrees from './steps/StepEntrees';
import StepBreakfast from './steps/StepBreakfast';
import StepSnacks from './steps/StepSnacks';
import StepAllergies from './steps/StepAllergies';
import StepDelivery from './steps/StepDelivery';
import StepCheckout from './steps/StepCheckout';
import ConfirmationScreen from './steps/ConfirmationScreen';
import ShopifyRedirectScreen from './steps/ShopifyRedirectScreen';
import { useShopifyMenu } from './hooks/useShopifyMenu';
import { setWeekForSelection, earliestDeliverableMonday } from './lib/shopifyWeeks';
import { buildEntreeSelections, buildMetadataPayload, buildBreakfastMetadata, buildCartCheckoutUrl, previewDiscountCode } from './lib/shopifyCheckout';
import { defaultEntreeSelection, chefsChoiceEntreeSelection, defaultBreakfastSelection } from './lib/defaultSelections';
import { shopifyConfig } from './config/shopify';
import { loadPersistedState, savePersistedState, clearPersistedState } from './lib/persistence';
import { rbStep } from './lib/analytics';
import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS, ALLERGY_OPTIONS } from './data/meals';
import { PLAN_IMAGES } from './data/planImages';

const persisted = loadPersistedState();

// A discount code can arrive on the URL, from a marketing link like
// /mealplan/meal/entrees?discount=CODE on the storefront -- that page forwards
// the code onto this app's own URL when it embeds it. Takes precedence over a
// code left in localStorage from an earlier visit: the link the customer just
// followed is the more current intent.
function discountCodeFromUrl() {
  try {
    return new URL(window.location.href).searchParams.get('discount')?.trim() || '';
  } catch {
    return '';
  }
}

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

// Generic: sums cart quantities (singles + doubles) restricted to a given
// set of meal ids -- used for both the entrée-count gate and the
// treats_count analytics param (see rbStep('rb_treats_completed', ...)).
function computeCartCount(singles, doubles, ids) {
  let count = 0;
  Object.entries(singles).forEach(([id, qty]) => { if (ids.has(Number(id))) count += qty; });
  Object.entries(doubles).forEach(([id, qty]) => { if (ids.has(Number(id))) count += qty; });
  return count;
}

function computeUnlockedUntil(mealCount, selectedPlan, mealMode, entreeCount, breakfastCount, breakfastSkipped, deliveryMode, pickupLocationId) {
  if (!mealCount) return 'mealCount';
  if (!selectedPlan) return 'plan';
  if (!mealMode) return 'mealMode';
  if (entreeCount < mealCount) return 'entrees';
  if (!breakfastCount && !breakfastSkipped) return 'breakfast';
  if (!deliveryMode || (deliveryMode === 'pickup' && !pickupLocationId)) return 'delivery';
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
  const [discountCode, setDiscountCode] = useState(discountCodeFromUrl() || persisted?.discountCode || '');
  const [deliveryMode, setDeliveryMode] = useState(persisted?.deliveryMode || null);
  const [pickupLocationId, setPickupLocationId] = useState(persisted?.pickupLocationId || null);

  // Live-checks a discount code against a real Shopify cart the moment
  // there's enough to check with (an entrée line needs a mealCount) --
  // same previewDiscountCode mechanism Order Summary's own live preview
  // already uses, just run earlier so the banner below can say for sure
  // whether the code actually works, not just that one was found on the
  // URL. Deliberately entree-only (breakfast/snacks aren't picked yet this
  // early in the flow) -- Order Summary's own preview is still the
  // authoritative final check once the full cart is built.
  const [discountStatus, setDiscountStatus] = useState('idle'); // idle | checking | valid | invalid
  useEffect(() => {
    const trimmed = discountCode.trim();
    if (!trimmed || !mealCount) {
      setDiscountStatus('idle');
      return undefined;
    }
    setDiscountStatus('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await previewDiscountCode({ mealCount, breakfastCount: null, snackLines: [], discountCode: trimmed });
        if (!cancelled) setDiscountStatus(result && result.applicable ? 'valid' : 'invalid');
      } catch {
        if (!cancelled) setDiscountStatus('idle');
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [discountCode, mealCount]);

  const progressBarRef = useRef(null);
  useEffect(() => {
    const el = progressBarRef.current;
    if (!el) return;
    const setHeightVar = () => {
      document.documentElement.style.setProperty('--progress-bar-height', `${el.offsetHeight}px`);
    };
    setHeightVar();
    const observer = new ResizeObserver(setHeightVar);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    savePersistedState({
      step, cart, mealCount, selectedPlan, mealMode,
      breakfastCount, breakfastSkipped, allergySelected, allergyNotes, discountCode,
      deliveryMode, pickupLocationId,
    });
  }, [step, cart, mealCount, selectedPlan, mealMode, breakfastCount, breakfastSkipped, allergySelected, allergyNotes, discountCode, deliveryMode, pickupLocationId]);

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
  const snackIdSet = new Set(snackItems.map(m => m.id));

  // Breakfast/snacks for every week, not just the active one -- used only
  // to warm the image cache below, so switching weeks later doesn't hit
  // the same load-in delay for the week that wasn't active yet.
  const allBreakfastSnackImages = useMemo(() => {
    if (usingFallback) return [...BREAKFAST_ITEMS, ...SNACK_ITEMS].map(m => m.image);
    return rawWeeks
      .flatMap(w => w.meals.filter(m => m.productType === 'breakfast' || m.productType === 'snacks'))
      .map(m => m.image);
  }, [rawWeeks, usingFallback]);

  // Warm the browser's HTTP cache for every meal/plan photo as soon as the
  // menu loads, instead of waiting for each step to mount its <img> tags --
  // by the time a customer reaches Entrées/Breakfast/Snacks/Plan, the
  // images are already fetched and paint instantly instead of loading in.
  useEffect(() => {
    const urls = new Set([
      ...Object.values(PLAN_IMAGES),
      ...entreeMealsFlat.map(m => m.image),
      ...allBreakfastSnackImages,
    ].filter(Boolean));
    urls.forEach(url => { const img = new Image(); img.src = url; });
  }, [entreeMealsFlat, allBreakfastSnackImages]);

  function go(target) {
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // GA4 funnel tracking (see lib/analytics.js). rb_builder_loaded fires once
  // per app load, regardless of which step persistence resumes into.
  // rb_meal_selection_started fires every time the Entrées step opens
  // (including revisits) -- the "Continue clicked" events for each step
  // fire at their own onNext/onViewSummary call sites below instead, and
  // the checkout-review events fire from within StepCheckout.jsx, where the
  // live order total actually lives.
  useEffect(() => { rbStep('rb_builder_loaded'); }, []);
  useEffect(() => {
    if (step === 'entrees') rbStep('rb_meal_selection_started', { meal_count: mealCount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const entreeCount   = computeCartCount(cart.singles, cart.doubles, allEntreeIds);
  const unlockedUntil = computeUnlockedUntil(mealCount, selectedPlan, mealMode, entreeCount, breakfastCount, breakfastSkipped, deliveryMode, pickupLocationId);

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
  // error instead of navigating with a broken/empty cart. Async: building
  // now creates a real Storefront Cart (see buildCartCheckoutUrl) rather
  // than just assembling a URL string.
  async function buildRealCheckoutUrl() {
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

    return buildCartCheckoutUrl({
      entree: { variantId: entreeVariant.id, mealCount, metadataJson: entreeMetadataJson },
      doubleProtein: doubleProteinCount > 0 ? { quantity: doubleProteinCount } : null,
      breakfast: breakfastLine,
      snackLines,
      setWeek,
      allergiesValue,
      allergyNotesValue,
      discountCode: discountCode.trim(),
      deliveryMode,
      pickupLocationId,
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
    setDeliveryMode(null);
    setPickupLocationId(null);
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
        <ProgressBar barRef={progressBarRef} currentRoute="checkout" unlockedUntil="checkout" onNavigate={go} />
        <ConfirmationScreen orderDetails={orderDetails} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-brand-mint flex flex-col">
      {/* Confirms a discount picked up from the URL (QR codes/marketing
          links use ?discount=CODE -- see discountCodeFromUrl above) is
          actually live on this order, without digging into Order Summary.
          Also shows once a customer types a code in later, so it doubles
          as a general "this code is applied" indicator. Deliberately NOT
          brand green / flush-with-the-edge -- that read as part of the
          site chrome rather than a callout worth noticing. A raised,
          rounded, gold gradient card reads as a distinct promo banner. */}
      {discountCode.trim() && (
        <div className="px-3 sm:px-6 pt-3">
          <div className={`max-w-2xl mx-auto rounded-2xl shadow-lg border px-4 py-3 flex items-center gap-3 transition-colors ${
            discountStatus === 'valid'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 border-amber-300 text-white'
              : discountStatus === 'invalid'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <span className="text-xl sm:text-2xl flex-shrink-0">
              {discountStatus === 'valid' ? '🎉' : discountStatus === 'invalid' ? '⚠️' : '🏷️'}
            </span>
            <p className="text-xs sm:text-sm font-bold leading-snug">
              {discountStatus === 'valid' && (
                <>Code <span className="uppercase tracking-wide">{discountCode.trim()}</span> is active — enjoy the savings!</>
              )}
              {discountStatus === 'invalid' && (
                <>Code <span className="uppercase tracking-wide">{discountCode.trim()}</span> isn't valid or has expired</>
              )}
              {discountStatus === 'checking' && (
                <>Checking code <span className="uppercase tracking-wide">{discountCode.trim()}</span>…</>
              )}
              {discountStatus === 'idle' && (
                <>Code <span className="uppercase tracking-wide">{discountCode.trim()}</span> found — we'll confirm it's active once you pick your meal count</>
              )}
            </p>
          </div>
        </div>
      )}
      <ProgressBar barRef={progressBarRef} currentRoute={step} unlockedUntil={unlockedUntil} onNavigate={go} />

      {step === 'mealCount' && (
        <StepMealCount
          mealCount={mealCount}
          setMealCount={setMealCount}
          onNext={() => { rbStep('rb_count_selected', { meal_count: mealCount }); go('plan'); }}
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
          onNext={() => { rbStep('rb_entrees_completed', { meal_count: mealCount }); go('breakfast'); }}
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
          onNext={() => { rbStep('rb_breakfast_completed', { breakfast_count: breakfastCount }); go('snacks'); }}
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
          onNext={() => {
            rbStep('rb_treats_completed', { treats_count: computeCartCount(cart.singles, cart.doubles, snackIdSet) });
            go('allergies');
          }}
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
          onViewSummary={() => { rbStep('rb_allergies_completed'); go('delivery'); }}
          onCheckout={() => go('shopifyRedirect')}
          onBack={() => go('snacks')}
        />
      )}

      {step === 'delivery' && (
        <StepDelivery
          deliveryMode={deliveryMode}
          setDeliveryMode={setDeliveryMode}
          pickupLocationId={pickupLocationId}
          setPickupLocationId={setPickupLocationId}
          onNext={() => go('checkout')}
          onBack={() => go('allergies')}
        />
      )}

      {step === 'shopifyRedirect' && (
        <ShopifyRedirectScreen onBuildCheckoutUrl={buildRealCheckoutUrl} onBack={() => go('checkout')} />
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
          deliveryMode={deliveryMode}
          onBack={() => go('delivery')}
          onConfirm={() => go('shopifyRedirect')}
        />
      )}
    </div>
  );
}
