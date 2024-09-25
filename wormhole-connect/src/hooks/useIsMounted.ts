import { MutableRefObject, useEffect, useRef } from 'react';

export const useIsMounted = (): MutableRefObject<boolean> => {
  const isMounted = useRef<boolean>(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
};
