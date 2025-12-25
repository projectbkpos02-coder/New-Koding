import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useGPS } from '../hooks/useGPS';
import {
  ShoppingCart,
  Trophy,
  FileText,
  Settings,
  LogOut,
  Package
} from 'lucide-react';

const navigation = [
  { name: 'POS', href: '/rider', icon: ShoppingCart, color: 'primary' },
  { name: 'Leaderboard', href: '/rider/leaderboard', icon: Trophy, color: 'accent' },
  { name: 'Laporan', href: '/rider/reports', icon: FileText, color: 'purple' },
  { name: 'Pengaturan', href: '/rider/settings', icon: Settings, color: 'secondary' },
];

export default function RiderLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Initialize GPS tracking
  useGPS();

  const getActiveColor = (color) => {
    const colors = {
      primary: 'text-primary bg-primary/10',
      secondary: 'text-secondary bg-secondary/10',
      accent: 'text-accent bg-accent/10',
      purple: 'text-[hsl(270,70%,60%)] bg-[hsl(270,70%,60%)]/10',
      default: 'text-primary bg-primary/10',
    };
    return colors[color] || colors.default;
  };

  const getGlowColor = (color) => {
    const colors = {
      primary: 'bg-primary/30',
      secondary: 'bg-secondary/30',
      accent: 'bg-accent/30',
      purple: 'bg-[hsl(270,70%,60%)]/30',
      default: 'bg-primary/30',
    };
    return colors[color] || colors.default;
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-secondary rounded-xl flex items-center justify-center shadow-glow-secondary">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground">POS Rider</span>
              <p className="text-xs text-muted-foreground">Rider Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">Rider</p>
            </div>
            <div className="w-9 h-9 bg-gradient-secondary rounded-full flex items-center justify-center shadow-md">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="pb-nav-safe">
        <div className="p-4 max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 shadow-xl backdrop-blur-xl">
        {/* Decorative top border with gradient */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />
        
        <div 
          className="flex items-center justify-evenly h-16 max-w-screen-xl mx-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group relative flex flex-col items-center justify-center flex-1 h-full min-w-[4rem] max-w-[6rem] px-2 space-y-1 transition-all duration-300",
                  "hover:scale-105 active:scale-95"
                )}
              >
                {/* Active indicator - floating dot */}
                {active && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current animate-bounce-in" />
                )}

                {/* Icon container with background */}
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                  active 
                    ? cn(getActiveColor(item.color), "shadow-md scale-110") 
                    : "text-muted-foreground group-hover:bg-muted/50 group-hover:text-foreground"
                )}>
                  {/* Glow effect on active */}
                  {active && (
                    <div className={cn(
                      "absolute inset-0 rounded-xl blur-sm opacity-50 animate-pulse-slow",
                      getGlowColor(item.color)
                    )} />
                  )}
                  
                  <item.icon className={cn(
                    "w-5 h-5 relative z-10 transition-transform duration-300",
                    active && "animate-scale-in"
                  )} />
                </div>

                {/* Label */}
                <span className={cn(
                  "text-[0.65rem] sm:text-xs font-semibold text-center leading-tight truncate max-w-full transition-all duration-300",
                  active 
                    ? "text-foreground" 
                    : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.name}
                </span>

                {/* Bottom active indicator */}
                {active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-current rounded-full animate-fade-in-up" />
                )}
              </Link>
            );
          })}
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className="group relative flex flex-col items-center justify-center flex-1 h-full min-w-[4rem] max-w-[6rem] px-2 space-y-1 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl text-destructive/70 group-hover:bg-destructive/10 group-hover:text-destructive transition-all duration-300">
              <LogOut className="w-5 h-5 relative z-10" />
            </div>
            <span className="text-[0.65rem] sm:text-xs font-semibold text-center leading-tight text-destructive/70 group-hover:text-destructive transition-colors">
              Keluar
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
