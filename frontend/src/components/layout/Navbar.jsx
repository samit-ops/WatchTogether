import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, LogOut, User, Sun, Moon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { activeTheme, themePreference, setThemePreference } = useTheme();
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

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
          <nav className="flex items-center space-x-3">
            {/* Theme Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-surface border border-border hover:border-primary/50 text-text transition-colors text-xs font-medium"
                title={`Theme Preference: ${themePreference.toUpperCase()} (${activeTheme.toUpperCase()} Active)`}
              >
                {themePreference === 'auto' ? (
                  <Clock className="h-4 w-4 text-primary" />
                ) : themePreference === 'light' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-400" />
                )}
                <span className="hidden sm:inline capitalize">{themePreference}</span>
              </button>

              {showThemeMenu && (
                <div 
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-border p-1.5 shadow-2xl z-50 text-xs"
                  onClick={() => setShowThemeMenu(false)}
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                    Theme Preference
                  </div>
                  <button
                    onClick={() => setThemePreference('auto')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                      themePreference === 'auto' ? 'bg-primary text-white font-bold' : 'hover:bg-background text-text'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Auto (10AM-12PM IST)
                    </span>
                  </button>
                  <button
                    onClick={() => setThemePreference('light')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                      themePreference === 'light' ? 'bg-primary text-white font-bold' : 'hover:bg-background text-text'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      Light Theme
                    </span>
                  </button>
                  <button
                    onClick={() => setThemePreference('dark')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                      themePreference === 'dark' ? 'bg-primary text-white font-bold' : 'hover:bg-background text-text'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Moon className="h-3.5 w-3.5 text-blue-400" />
                      Dark Theme
                    </span>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/watch-party/create" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
                  Watch Party
                </Link>
                <Link to="/library" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
                  My Library
                </Link>
                <Link to="/downloads" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
                  Downloads
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
