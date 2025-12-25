import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  ClipboardList,
  Undo2,
  AlertTriangle,
  BarChart3,
  Users,
  LogOut,
  MapPin,
  Menu,
  X,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, color: 'primary' },
  { name: 'Produk', href: '/admin/products', icon: Package, color: 'accent' },
  { name: 'Produksi', href: '/admin/production', icon: Factory, color: 'secondary' },
  { name: 'Distribusi', href: '/admin/distribution', icon: Truck, color: 'purple' },
  { name: 'Opname', href: '/admin/stock-opname', icon: ClipboardList, color: 'primary' },
];

const moreNavigation = [
  { name: 'Return', href: '/admin/returns', icon: Undo2, color: 'accent' },
  { name: 'Reject', href: '/admin/rejects', icon: AlertTriangle, color: 'destructive' },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3, color: 'purple' },
  { name: 'GPS', href: '/admin/gps', icon: MapPin, color: 'secondary' },
];

const superAdminNav = [
  { name: 'Users', href: '/admin/users', icon: Users, color: 'primary' },
];

export default function AdminLayout({ children }) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();

  const allMoreNav = isSuperAdmin ? [...moreNavigation, ...superAdminNav] : moreNavigation;

  const getActiveColor = (color) => {
    const colors = {
      primary: 'text-primary bg-primary/10',
      secondary: 'text-secondary bg-secondary/10',
      accent: 'text-accent bg-accent/10',
      purple: 'text-[hsl(270,70%,60%)] bg-[hsl(270,70%,60%)]/10',
      destructive: 'text-destructive bg-destructive/10',
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
      destructive: 'bg-destructive/30',
      default: 'bg-primary/30',
    };
    return colors[color] || colors.default;
  };

  const isActive = (path) => location.pathname === path;
  const isMoreActive = allMoreNav.some(item => location.pathname === item.href);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground">POS Rider</span>
              <p className="text-xs text-muted-foreground hidden sm:block">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* More Menu Modal */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setMoreOpen(false)}>
          <div 
            className="absolute bottom-20 left-4 right-4 bg-card rounded-2xl shadow-xl p-4 animate-slide-up border border-border/50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Menu Lainnya</h3>
              <button onClick={() => setMoreOpen(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {allMoreNav.map((item, index) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 hover-scale animate-fade-in-up",
                    isActive(item.href)
                      ? getActiveColor(item.color)
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              ))}
              <button
                onClick={() => { setMoreOpen(false); logout(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-300 hover-scale animate-fade-in-up"
                style={{ animationDelay: `${allMoreNav.length * 50}ms` }}
              >
                <LogOut className="w-6 h-6" />
                <span className="text-xs font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="pb-nav-safe">
        <div className="p-4 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 shadow-xl backdrop-blur-xl">
        {/* Decorative top border with gradient */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <div 
          className="flex items-center justify-evenly h-16 max-w-screen-xl mx-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {navigation.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group relative flex flex-col items-center justify-center flex-1 h-full min-w-[3.5rem] max-w-[5rem] px-1 space-y-1 transition-all duration-300",
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
                  "text-[0.6rem] sm:text-xs font-semibold text-center leading-tight truncate max-w-full transition-all duration-300",
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
          
          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "group relative flex flex-col items-center justify-center flex-1 h-full min-w-[3.5rem] max-w-[5rem] px-1 space-y-1 transition-all duration-300",
              "hover:scale-105 active:scale-95"
            )}
          >
            {isMoreActive && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-bounce-in" />
            )}
            <div className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
              isMoreActive 
                ? "bg-primary/10 text-primary shadow-md scale-110" 
                : "text-muted-foreground group-hover:bg-muted/50 group-hover:text-foreground"
            )}>
              {isMoreActive && (
                <div className="absolute inset-0 rounded-xl blur-sm opacity-50 animate-pulse-slow bg-primary/30" />
              )}
              <Menu className="w-5 h-5 relative z-10" />
            </div>
            <span className={cn(
              "text-[0.6rem] sm:text-xs font-semibold text-center leading-tight truncate max-w-full transition-all duration-300",
              isMoreActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              Lainnya
            </span>
            {isMoreActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full animate-fade-in-up" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
