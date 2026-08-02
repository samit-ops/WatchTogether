import React, { useRef, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/components/motion';

const TiltCard = ({ children, className = '', maxTilt = 8, ...rest }) => {
  const ref = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), { stiffness: 300, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), { stiffness: 300, damping: 25 });

  if (prefersReducedMotion || isTouch) {
    return <div className={className} {...rest}>{children}</div>;
  }

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

const MemoizedTiltCard = memo(TiltCard);
export { MemoizedTiltCard as TiltCard };
export default MemoizedTiltCard;
