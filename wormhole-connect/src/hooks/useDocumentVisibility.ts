import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook to track the visibility of the document.
 * This hook can be used to pause/resume certain actions based on document visibility.
 * Usage: const isDocumentVisible = useDocumentVisibility();
 *
 * @returns {boolean} - Returns true if the document is visible, false otherwise.
 */

export const useDocumentVisibility = (): boolean => {
  const [isDocumentVisible, setIsDocumentVisible] = useState(!document.hidden);

  const onVisibilityChange = useCallback(() => {
    setIsDocumentVisible(!document.hidden);
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [onVisibilityChange]);

  return isDocumentVisible;
};
