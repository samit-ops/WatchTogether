import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 w-full max-w-7xl">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Watch Together</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/watch-party/create" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
                  Watch Party
                </Link>
                <Link to="/library" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
                  My Library
                </Link>
                <span className="text-sm text-muted hidden lg:inline-block ml-2 border-l border-border pl-4">
                  Welcome, {user.name}
                </span>
                <Link to="/profile" className="text-muted hover:text-primary transition-colors ml-2">
                  <User className="h-5 w-5" />
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-500 hover:bg-red-500/10">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Log in</Link>
                <Link to="/register" className="text-sm font-medium hover:text-primary transition-colors bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 shadow-sm">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
