import { useReducer, useState } from 'react';
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
import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from './data/meals';

const ALL_ENTREE_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2].map(m => m.id));
const ALL_SNACK_IDS = SNACK_ITEMS.map(m => m.id);

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
      BREAKFAST_ITEMS.forEach(m => delete newSingles[m.id]);
      action.ids.forEach(id => { newSingles[id] = (newSingles[id] || 0) + 1; });
      return { ...state, singles: newSingles };
    }
    case 'CLEAR_SNACKS': {
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

function computeEntreeCount(singles, doubles) {
  let count = 0;
  Object.entries(singles).forEach(([id, qty]) => { if (ALL_ENTREE_IDS.has(Number(id))) count += qty; });
  Object.entries(doubles).forEach(([id, qty]) => { if (ALL_ENTREE_IDS.has(Number(id))) count += qty; });
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
  const [step, setStep] = useState('mealCount');
  const [cart, dispatch] = useReducer(cartReducer, { singles: {}, doubles: {} });
  const [orderDetails, setOrderDetails] = useState(null);
  const [mealCount, setMealCount] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [mealMode, setMealMode] = useState(null);
  const [breakfastCount, setBreakfastCount] = useState(null);
  const [breakfastSkipped, setBreakfastSkipped] = useState(false);

  function go(target) {
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const entreeCount   = computeEntreeCount(cart.singles, cart.doubles);
  const unlockedUntil = computeUnlockedUntil(mealCount, selectedPlan, mealMode, entreeCount, breakfastCount, breakfastSkipped);

  function handleAddSingle(id)    { dispatch({ type: 'ADD_SINGLE', id }); }
  function handleRemoveSingle(id) { dispatch({ type: 'REMOVE_SINGLE', id }); }
  function handleAddDouble(id)    { dispatch({ type: 'ADD_DOUBLE', id }); }
  function handleRemoveDouble(id) { dispatch({ type: 'REMOVE_DOUBLE', id }); }
  function handleClearCart()      { dispatch({ type: 'RESET' }); }

  function handleChefChosen() {
    const planCategoryMap = { lifestyle: 'LIFESTYLE', performance: 'PERFORMANCE', keto: 'KETO', plant_based: 'PLANT-BASED' };
    const category = planCategoryMap[selectedPlan] || null;
    const pool = category ? MEALS_WEEK1.filter(m => m.category === category) : MEALS_WEEK1;
    const supplement = category ? MEALS_WEEK1.filter(m => m.category !== category) : [];
    const ordered = [...pool, ...supplement];
    const ids = [];
    for (let i = 0; i < mealCount; i++) ids.push(ordered[i % ordered.length].id);
    dispatch({ type: 'SET_BULK_SINGLES', ids });
    setMealMode('chef');
    go('entrees');
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
      if (count) {
        const shuffled = [...BREAKFAST_ITEMS].sort(() => Math.random() - 0.5);
        const ids = [];
        for (let i = 0; i < count; i++) ids.push(shuffled[i % shuffled.length].id);
        dispatch({ type: 'SET_BULK_BREAKFAST', ids });
      } else {
        dispatch({ type: 'SET_BULK_BREAKFAST', ids: [] });
      }
    }
  }

  function handleSkipBreakfast() {
    setBreakfastSkipped(true);
    setBreakfastCount(null);
    go('snacks');
  }

  function handleSkipSnacks() {
    dispatch({ type: 'CLEAR_SNACKS', ids: ALL_SNACK_IDS });
    go('allergies');
  }

  function handleConfirm(details) {
    setOrderDetails(details);
    go('confirmation');
  }

  function handleReset() {
    dispatch({ type: 'RESET' });
    setOrderDetails(null);
    setMealCount(null);
    setSelectedPlan(null);
    setMealMode(null);
    setBreakfastCount(null);
    setBreakfastSkipped(false);
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
          entreeCount={entreeCount}
          mealMode={mealMode}
          selectedPlan={selectedPlan}
          onNext={() => go('breakfast')}
          onBack={() => go('mealMode')}
        />
      )}

      {step === 'breakfast' && (
        <StepBreakfast
          {...sharedCartProps}
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
          onNext={() => go('allergies')}
          onSkipSnacks={handleSkipSnacks}
          onBack={() => go('breakfast')}
          breakfastCount={breakfastCount}
        />
      )}

      {step === 'allergies' && (
        <StepAllergies
          onViewSummary={() => go('checkout')}
          onCheckout={() => go('shopifyRedirect')}
          onBack={() => go('snacks')}
        />
      )}

      {step === 'shopifyRedirect' && (
        <ShopifyRedirectScreen onBack={() => go('allergies')} />
      )}

      {step === 'checkout' && (
        <StepCheckout
          {...sharedCartProps}
          onBack={() => go('allergies')}
          onConfirm={() => go('shopifyRedirect')}
        />
      )}
    </div>
  );
}
