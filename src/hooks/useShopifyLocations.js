import { useEffect, useState } from 'react';
import { fetchPickupLocations } from '../lib/shopifyLocations';

export function useShopifyLocations() {
  const [state, setState] = useState({ loading: true, error: null, locations: [] });

  useEffect(() => {
    let cancelled = false;
    fetchPickupLocations()
      .then(locations => { if (!cancelled) setState({ loading: false, error: null, locations }); })
      .catch(err => { if (!cancelled) setState({ loading: false, error: err.message, locations: [] }); });
    return () => { cancelled = true; };
  }, []);

  return state;
}
