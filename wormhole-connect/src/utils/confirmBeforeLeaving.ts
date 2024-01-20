import { useEffect } from 'react';

const unloadHandler = (e: Event) => {
  e = e ?? window.event;
  if (e) e.returnValue = true;
  return true;
};

const useConfirmBeforeLeaving = (shouldConfirm: boolean) => {
  useEffect(() => {
    let cancel = () => {
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
