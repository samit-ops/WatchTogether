import React from 'react';
import { ScrollReveal } from '@/components/motion';

export function Footer() {
  return (
    <ScrollReveal>
      <footer className="relative border-t border-transparent bg-background py-8 md:py-0 mt-auto">
        {/* Gradient top border */}
        <div className="gradient-divider absolute top-0 left-0 right-0" />
        
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted text-center leading-loose md:text-left">
            &copy; {new Date().getFullYear()} <span className="font-semibold text-gradient-static">Watch Together</span>. Built for the Internship Assignment.
          </p>
        </div>
      </footer>
    </ScrollReveal>
  );
}
