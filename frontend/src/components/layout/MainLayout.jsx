import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PageTransition } from '@/components/motion';

export function MainLayout() {
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 30, restDelta: 0.001 });

  // Always reset page scroll to top when opening any feature or video
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Glowing Top Scroll Progress Bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] origin-left z-[100] shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]"
      />

      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 w-full max-w-7xl">
        <AnimatePresence>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
