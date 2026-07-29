import React from 'react';
import { cn } from '@/utils/cn';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-xl bg-surface/30", className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-surface p-4">
          <Icon className="h-8 w-8 text-muted" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
