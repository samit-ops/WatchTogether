import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export function Loader({ className, size = 24, ...props }) {
  return (
    <Loader2 
      className={cn("animate-spin text-primary", className)} 
      size={size} 
      {...props} 
    />
  );
}
