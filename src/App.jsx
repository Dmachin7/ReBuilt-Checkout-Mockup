import { useReducer, useState } from 'react';
import ProgressBar from './components/ProgressBar';
import StepEntrees from './steps/StepEntrees';
import StepBreakfast from './steps/StepBreakfast';
import StepSnacks from './steps/StepSnacks';
import StepAllergies from './steps/StepAllergies';
import StepCheckout from './steps/StepCheckout';
import ConfirmationScreen from './steps/ConfirmationScreen';

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const prev = state.quantities[action.id] || 0;
      return { ...state, quantities: { ...state.quantities, [action.id]: prev + 1 } };
    }
    case 'REMOVE': {
      const prev = state.quantities[action.id] || 0;
      const next = Math.max(0, prev - 1);
      const q = { ...state.quantities, [action.id]: next };
      if (next === 0) delete q[action.id];
      return { ...state, quantities: q };
    }
    case 'TOGGLE_DOUBLE_PROTEIN': {
      const prev = state.doubleProteins[action.id];
      return { ...state, doubleProteins: { ...state.doubleProteins, [action.id]: !prev } };
    }
    case 'RESET':
      return { quantities: {}, doubleProteins: {} };
    default:
      return state;
  }
}

function stepToNumber(step) {
  const map = { entrees: 1, breakfast: 2, snacks: 3, allergies: 4, checkout: 5 };
  return map[step] || 1;
}

export default function App() {
  const [step, setStep] = useState('entrees');
  const [cart, dispatch] = useReducer(cartReducer, { quantities: {}, doubleProteins: {} });
  const [orderDetails, setOrderDetails] = useState(null);
  const [mealCount] = useState(5);

  function go(target) {
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAdd(id)           { dispatch({ type: 'ADD', id }); }
  function handleRemove(id)        { dispatch({ type: 'REMOVE', id }); }
  function handleDoubleProtein(id) { dispatch({ type: 'TOGGLE_DOUBLE_PROTEIN', id }); }

  function handleConfirm(details) {
    setOrderDetails(details);
    go('confirmation');
  }

  function handleReset() {
    dispatch({ type: 'RESET' });
    setOrderDetails(null);
    go('entrees');
  }

  if (step === 'confirmation') {
    return (
      <div className="min-h-svh bg-brand-mint flex flex-col">
        <ProgressBar currentStep={5} onNavigate={go} />
        <ConfirmationScreen orderDetails={orderDetails} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-brand-mint flex flex-col">
      <ProgressBar currentStep={stepToNumber(step)} onNavigate={go} />

      {step === 'entrees' && (
        <StepEntrees
          cart={cart.quantities}
          doubleProteins={cart.doubleProteins}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onDoubleProteinToggle={handleDoubleProtein}
          onNext={() => go('breakfast')}
          mealCount={mealCount}
        />
      )}

      {step === 'breakfast' && (
        <StepBreakfast
          cart={cart.quantities}
          doubleProteins={cart.doubleProteins}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onDoubleProteinToggle={handleDoubleProtein}
          onNext={() => go('snacks')}
          onBack={() => go('entrees')}
          mealCount={mealCount}
        />
      )}

      {step === 'snacks' && (
        <StepSnacks
          cart={cart.quantities}
          doubleProteins={cart.doubleProteins}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onDoubleProteinToggle={handleDoubleProtein}
          onNext={() => go('allergies')}
          onBack={() => go('breakfast')}
          mealCount={mealCount}
        />
      )}

      {step === 'allergies' && (
        <StepAllergies
          onNext={() => go('checkout')}
          onBack={() => go('snacks')}
        />
      )}

      {step === 'checkout' && (
        <StepCheckout
          cart={cart.quantities}
          doubleProteins={cart.doubleProteins}
          onBack={() => go('allergies')}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
