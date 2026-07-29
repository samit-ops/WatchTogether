import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Home</h1>
      <EmptyState title="Home Page" description="This is a placeholder for the Home Page." />
    </div>
  );
}
