import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-6 md:py-0 mt-auto">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
        <p className="text-sm text-muted text-center leading-loose md:text-left">
          &copy; {new Date().getFullYear()} Watch Together. Built for the Internship Assignment.
        </p>
      </div>
    </footer>
  );
}
