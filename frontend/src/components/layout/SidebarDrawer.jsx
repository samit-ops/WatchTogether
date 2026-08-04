import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, X, Home, Video, FolderHeart, Download, 
  Sparkles, Upload, User, LogOut, Search, Sun, Moon, Clock 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function SidebarDrawer({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { activeTheme, themePreference, setThemePreference } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      onClose();
      setSearchTerm('');
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Watch Party', path: '/watch-party/create', icon: Video, protected: true },
    { label: 'My Library', path: '/library', icon: FolderHeart, protected: true },
    { label: 'Downloads', path: '/downloads', icon: Download, protected: true },
    { label: 'Subscriptions', path: '/subscriptions', icon: Sparkles },
    { label: 'Upload Video', path: '/upload', icon: Upload, protected: true },
    { label: 'My Profile', path: '/profile', icon: User, protected: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sliding Left Navigation Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] glass-card border-r border-border bg-background/95 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg">
                    <Play className="h-4.5 w-4.5 fill-white text-white ml-0.5" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-gradient-static">Watch Together</span>
                </Link>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Search Bar Input */}
              <form onSubmit={handleSearchSubmit} className="mb-5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface border border-border text-text placeholder:text-muted text-xs rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:border-primary transition-all shadow-inner"
                  />
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted pointer-events-none" />
                </div>
              </form>

              {/* Navigation Links */}
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Navigation
                </div>
                {navItems.map((item) => {
                  if (item.protected && !user) return null;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-text hover:bg-surface hover:text-primary transition-all duration-200"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Theme & User Controls */}
            <div className="border-t border-border pt-4 mt-6 space-y-4">
              {/* Theme Preference */}
              <div className="space-y-2">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Theme ({themePreference.toUpperCase()})
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface rounded-xl border border-border">
                  {[
                    { key: 'auto', label: 'Auto', icon: Clock },
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                  ].map((t) => {
                    const TIcon = t.icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setThemePreference(t.key)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          themePreference === t.key
                            ? 'bg-primary text-white shadow-md'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        <TIcon className="h-3.5 w-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Account / Auth */}
              {user ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 px-3 py-2 bg-surface/50 rounded-xl border border-border">
                    <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text truncate">{user.name}</p>
                      <p className="text-[10px] text-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-red-500/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex items-center justify-center py-2.5 rounded-xl text-xs font-bold bg-surface hover:bg-surface-light border border-border text-text transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={onClose}
                    className="flex items-center justify-center py-2.5 rounded-xl text-xs font-bold btn-gradient shadow-md text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
