import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';

export const STATE_SETTLED_DELAY = 250;

// This hook covers up the delays between state updates triggering effects which trigger more state updates.
export const useIsStateSettled = () => {
  const [isStateSettled, setIsStateSettled] = useState(true);
  const isCalculating = useSelector(
    // excludes sending gas as that doesn't trigger additional hooks
    (state: RootState) =>
      state.transferInput.isCalculating.validation ||
      state.transferInput.isCalculating.availableRoutes,
  );
  useEffect(() => {
    // when a calculation is running, immediately show loaders
    if (isCalculating) {
      setIsStateSettled(false);
    } else {
      // only clear loaders after the state has settled for a duration
      const id = setTimeout(() => {
        setIsStateSettled(true);
      }, STATE_SETTLED_DELAY);
      return () => {
        clearTimeout(id);
      };
    }
  }, [isCalculating]);
  return isStateSettled;
};
