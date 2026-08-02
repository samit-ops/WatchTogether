import React, { useRef, memo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '@/components/motion';

const MagneticButton = ({ children, className = '', as = 'button', strength = 0.15, ...rest }) => {
  const ref = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  if (prefersReducedMotion || isTouch) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * strength);
    y.set(middleY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Component = motion[as] || motion.button;

  return (
    <Component
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
};

const MemoizedMagneticButton = memo(MagneticButton);
export { MemoizedMagneticButton as MagneticButton };
export default MemoizedMagneticButton;
