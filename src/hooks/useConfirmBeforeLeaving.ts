import { useEffect } from 'react';

const unloadHandler = (e: BeforeUnloadEvent) => {
  e.preventDefault();

  // Included for legacy support (e.g. Chrome/Edge < 119)
  e.returnValue = true;

  return true;
};

const useConfirmBeforeLeaving = (shouldConfirm: boolean): void => {
  useEffect(() => {
    const cancel = () => {
      window.removeEventListener('beforeunload', unloadHandler);
    };

    if (shouldConfirm) {
      window.addEventListener('beforeunload', unloadHandler);
      return cancel;
    } else {
      cancel();
    }
  }, [shouldConfirm]);
};

export default useConfirmBeforeLeaving;
