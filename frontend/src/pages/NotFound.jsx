import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <EmptyState 
        title="404 - Page Not Found" 
        description="The page you are looking for doesn't exist or has been moved." 
        action={
          <Button asChild>
            <Link to="/">Go back home</Link>
          </Button>
        }
      />
    </div>
  );
}
