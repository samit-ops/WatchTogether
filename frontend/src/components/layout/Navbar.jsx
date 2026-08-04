import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, LogOut, User, Sun, Moon, Clock, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SidebarDrawer } from './SidebarDrawer';

export function Navbar() {
  const { user, logout } = useAuth();
  const { activeTheme, themePreference, setThemePreference } = useTheme();
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const themeIcons = {
    auto: <Clock className="h-4 w-4 text-primary" />,
    light: <Sun className="h-4 w-4 text-amber-500" />,
    dark: <Moon className="h-4 w-4 text-blue-400" />,
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-nav">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 w-full max-w-7xl">
          
          {/* Left: Mobile Hamburger Button & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl text-text hover:bg-surface transition-colors cursor-pointer md:hidden"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg shadow-[rgba(var(--primary-rgb),0.25)] transition-shadow duration-300 group-hover:shadow-[rgba(var(--primary-rgb),0.4)]">
                <Play className="h-4.5 w-4.5 fill-white text-white ml-0.5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gradient-static hidden xs:inline-block">Watch Together</span>
            </Link>
          </div>

          {/* Middle: Video Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface/80 border border-border text-text placeholder:text-muted text-xs sm:text-sm rounded-full py-2 pl-9 pr-8 focus:outline-none focus:border-primary focus:bg-surface transition-all shadow-inner"
              />
              <Search className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-muted hover:text-text p-0.5 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Right Navigation & Controls */}
          <div className="flex items-center space-x-3">
            <nav className="flex items-center space-x-3">
              {/* Theme Selector Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center gap-1.5 p-2 rounded-xl glass-card text-text text-xs font-medium cursor-pointer"
                  title={`Theme: ${themePreference.toUpperCase()} (${activeTheme.toUpperCase()} Active)`}
                >
                  <motion.div
                    key={themePreference}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.4, 0, 1] }}
                  >
                    {themeIcons[themePreference] || themeIcons.auto}
                  </motion.div>
                  <span className="hidden lg:inline capitalize">{themePreference}</span>
                </motion.button>

                <AnimatePresence>
                  {showThemeMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scaleY: 0.9, scaleX: 0.98 }}
                      animate={{ opacity: 1, scaleY: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleY: 0.9, scaleX: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.4, 0, 1] }}
                      style={{ transformOrigin: 'top right' }}
                      className="absolute right-0 mt-2 w-52 rounded-xl glass-card p-1.5 shadow-2xl z-50 text-xs"
                      onClick={() => setShowThemeMenu(false)}
                    >
                      <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted uppercase tracking-wider">
                        Theme Preference
                      </div>
                      {[
                        { key: 'auto', label: 'Auto (10AM–12PM IST)', icon: <Clock className="h-3.5 w-3.5" /> },
                        { key: 'light', label: 'Light Theme', icon: <Sun className="h-3.5 w-3.5 text-amber-500" /> },
                        { key: 'dark', label: 'Dark Theme', icon: <Moon className="h-3.5 w-3.5 text-blue-400" /> },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setThemePreference(option.key)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-all duration-200 ${
                            themePreference === option.key 
                              ? 'bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white font-bold shadow-md' 
                              : 'hover:bg-surface text-text'
                          }`}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link to="/watch-party/create" className="nav-link-animated text-sm font-medium hidden md:block">
                    Watch Party
                  </Link>
                  <Link to="/library" className="nav-link-animated text-sm font-medium hidden md:block">
                    My Library
                  </Link>
                  <Link to="/downloads" className="nav-link-animated text-sm font-medium hidden md:block">
                    Downloads
                  </Link>
                  <span className="text-sm text-muted hidden xl:inline-block border-l border-border pl-3">
                    Welcome, {user.name}
                  </span>
                  <Link to="/profile" className="text-muted hover:text-primary transition-colors hidden md:block">
                    <User className="h-5 w-5" />
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 hidden md:flex">
                    <LogOut className="h-4 w-4 mr-1.5" />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="nav-link-animated text-sm font-medium hidden sm:block">Log in</Link>
                  <Link to="/register" className="text-xs sm:text-sm font-medium btn-gradient px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg">
                    <span>Sign up</span>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Left Navigation Drawer for Mobile / Small Screens */}
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
