import React, { useRef, useEffect, memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePrefersReducedMotion } from '@/components/motion';

const CursorGlow = () => {
  const { activeTheme } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  const glowRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion || activeTheme !== 'dark' || isTouch) return;

    let animationFrameId;
    let isVisible = true;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
    };

    const updateGlow = () => {
      if (isVisible && glowRef.current) {
        glowRef.current.style.setProperty('--mouse-x', `${mouseX}px`);
        glowRef.current.style.setProperty('--mouse-y', `${mouseY}px`);
      }
      animationFrameId = requestAnimationFrame(updateGlow);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    animationFrameId = requestAnimationFrame(updateGlow);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTheme, prefersReducedMotion, isTouch]);

  if (prefersReducedMotion || activeTheme !== 'dark' || isTouch) {
    return null;
  }

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(139, 92, 246, 0.05), transparent 60%)'
      }}
    />
  );
};

const MemoizedCursorGlow = memo(CursorGlow);
export { MemoizedCursorGlow as CursorGlow };
export default MemoizedCursorGlow;
