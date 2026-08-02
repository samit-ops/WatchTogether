import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}

export const FadeIn = ({ children, delay = 0, className = '', as = 'div', ...rest }) => {
  const prefersReduced = usePrefersReducedMotion();
  const Tag = as;

  if (prefersReduced) {
    return <Tag className={className} {...rest}>{children}</Tag>;
  }

  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0, 1], delay }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export const ScrollReveal = ({ children, delay = 0, className = '', as = 'div', ...rest }) => {
  const prefersReduced = usePrefersReducedMotion();
  const Tag = as;

  if (prefersReduced) {
    return <Tag className={className} {...rest}>{children}</Tag>;
  }

  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0, 1], delay }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export const StaggerContainer = ({ children, className = '', stagger = 0.06, animate = false, ...rest }) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return <div className={className} {...rest}>{children}</div>;
  }

  const animationProps = animate ? { animate: "visible" } : { whileInView: "visible" };

  return (
    <motion.div
      className={className}
      initial="hidden"
      {...animationProps}
      viewport={{ once: true, margin: '-30px' }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = '', ...rest }) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return <div className={className} {...rest}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.25, 0.4, 0, 1] } }
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export const PageTransition = ({ children, className = '', ...rest }) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return <div className={className} {...rest}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.35, ease: [0.25, 0.4, 0, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
