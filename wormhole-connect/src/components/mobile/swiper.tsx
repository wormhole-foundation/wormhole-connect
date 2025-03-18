import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';

type Props = {
  children: ReactNode;
  onSwipe: (props: { deltaX: number; deltaY: number }) => void;
};

/**
 * Component for handling touch swipe gestures on mobile devices
 */
function Swiper(props: Props) {
  const wrapperRef = useRef(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const { children, onSwipe } = props;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!(wrapperRef.current as any).contains(e.target)) {
      return;
    }

    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!(wrapperRef.current as any).contains(e.target)) {
        return;
      }
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      onSwipe({ deltaX, deltaY });
    },
    [startX, startY, onSwipe],
  );

  useEffect(() => {
    // To disable default scrolling behavior, we need to disable passive listeners on this component
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return <div ref={wrapperRef}>{children}</div>;
}

export default Swiper;
