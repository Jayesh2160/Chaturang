import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Award, LogOut, LayoutDashboard, Play, Calendar, BookOpen, Globe } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Play Chess', path: '/play', icon: Play },
    { label: 'Play Online', path: '/play?gameMode=ONLINE', icon: Globe, isLive: true },
    { label: 'My Games', path: '/my-games', icon: Calendar },
    { label: 'Academy', path: '/academy', icon: BookOpen },
    { label: 'Progress', path: '/progress', icon: Award },
  ];

  const guestNavItems = [
    { label: 'Play Chess', path: '/play', icon: Play },
    { label: 'Play Online', path: '/play?gameMode=ONLINE', icon: Globe, isLive: true },
    { label: 'Academy', path: '/academy', icon: BookOpen },
  ];

  const activeNavList = user ? navItems : guestNavItems;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Floating Navigation Header */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 bg-zinc-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/5 transition-all">
        <div className="px-5 h-16 flex items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-500 to-sky-400 flex items-center justify-center shadow-lg shadow-violet-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-white text-xs tracking-tight">Ch</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-sm tracking-wider text-white">Chaturang</span>
              <span className="text-[9px] font-semibold text-purple-400 tracking-widest uppercase -mt-0.5">Grandmaster Arena</span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-full border border-white/5">
            {activeNavList.map((item) => {
              const Icon = item.icon;
              const isOnlineLink = item.path.includes('gameMode=ONLINE');
              const isActive = isOnlineLink
                ? location.pathname === '/play' && location.search.includes('gameMode=ONLINE')
                : location.pathname === item.path && !location.search.includes('gameMode=ONLINE');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-white/15 to-white/10 text-white font-bold shadow-sm border border-white/10'
                      : isOnlineLink
                      ? 'text-purple-300 hover:text-white hover:bg-purple-500/15'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isOnlineLink ? 'text-purple-400' : ''}`} strokeWidth={1.75} />
                  {item.label}
                  {item.isLive && (
                    <span className="relative flex h-2 w-2 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-zinc-900 to-zinc-900/80 border border-white/10 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-zinc-200 shadow-md">
                <Award className="w-3.5 h-3.5 shrink-0 text-brand-accent" strokeWidth={2} />
                <span>{user.rating} ELO</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl hover:bg-red-950/20 hover:border-red-500/20 border border-transparent transition-all"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-zinc-400 hover:text-white px-3.5 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 px-4 py-2 rounded-xl transition-all shadow-md shadow-white/10"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation Links (Below Header) */}
        <div className="md:hidden border-t border-white/5 bg-zinc-950/40 px-3 py-2 flex justify-around rounded-b-2xl">
          {activeNavList.map((item) => {
            const Icon = item.icon;
            const isOnlineLink = item.path.includes('gameMode=ONLINE');
            const isActive = isOnlineLink
              ? location.pathname === '/play' && location.search.includes('gameMode=ONLINE')
              : location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-300 ${
                  isActive ? 'text-brand-accent font-bold' : isOnlineLink ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {item.isLive && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </div>
                <span>{item.label.split(' ')[1] || item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Page Body with top padding matching floating navbar height */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {children}
      </main>
    </div>
  );
};
