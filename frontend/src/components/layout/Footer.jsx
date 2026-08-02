import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Shield, Globe, Users, Zap } from 'lucide-react';
import { ScrollReveal } from '@/components/motion';

export function Footer() {
  return (
    <ScrollReveal>
      <footer className="relative border-t border-transparent bg-surface/30 pt-12 pb-8 mt-24">
        {/* Animated Gradient top border */}
        <div className="gradient-divider absolute top-0 left-0 right-0" />
        
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg shadow-[rgba(var(--primary-rgb),0.25)]">
                  <Play className="h-4.5 w-4.5 fill-white text-white ml-0.5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-gradient-static">WatchTogether</span>
              </Link>
              <p className="text-sm text-muted max-w-sm leading-relaxed">
                The next-generation social video platform. Synchronized watch parties, real-time WebRTC calling, AI translations, and high-definition video streaming.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Globe className="w-3.5 h-3.5" /> Multilingual
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Users className="w-3.5 h-3.5" /> Watch Party
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Shield className="w-3.5 h-3.5" /> Secure OTP
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-text uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/watch-party/create" className="hover:text-primary transition-colors">Create Watch Party</Link></li>
                <li><Link to="/library" className="hover:text-primary transition-colors">My Library</Link></li>
                <li><Link to="/downloads" className="hover:text-primary transition-colors">Downloads</Link></li>
                <li><Link to="/subscriptions" className="hover:text-primary transition-colors">Subscription Plans</Link></li>
              </ul>
            </div>

            {/* Platform Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-text uppercase tracking-wider">Features</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> WebRTC Live Calls</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> Screen Sharing</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> Instant Translation</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> Controlled Downloads</li>
              </ul>
            </div>
          </div>

          <div className="gradient-divider mb-6" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
            <p>&copy; {new Date().getFullYear()} <span className="font-semibold text-text">WatchTogether</span>. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-text cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-text cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-text cursor-pointer transition-colors">Community Guidelines</span>
            </div>
          </div>
        </div>
      </footer>
    </ScrollReveal>
  );
}
