import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Award, LogOut, LayoutDashboard, Play, Calendar, BookOpen } from 'lucide-react';

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
    { label: 'My Games', path: '/my-games', icon: Calendar },
    { label: 'Academy', path: '/academy', icon: BookOpen },
    { label: 'Progress', path: '/progress', icon: Award },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Floating Navigation Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-5xl z-50 bg-black/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl shadow-black/45">
        <div className="px-5 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="h-7 w-7 rounded-md bg-gradient-to-tr from-violet-600 to-sky-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="font-display font-extrabold text-white text-xs">Ch</span>
            </div>
            <span className="font-display font-bold text-sm tracking-wider text-white">Chaturang</span>
          </Link>

          {/* Navigation Links (Desktop) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                      isActive
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-300 shadow-md">
                <Award className="w-3.5 h-3.5 shrink-0 text-brand-accent" strokeWidth={1.5} />
                <span>{user.rating} ELO</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-400 flex items-center gap-1.5 px-2 py-1 h-8 rounded-full"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Links (Below Header) */}
        {user && (
          <div className="md:hidden border-t border-white/5 bg-zinc-950/20 px-4 py-2 flex justify-around rounded-b-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-300 ${
                    isActive ? 'text-brand-accent font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Page Body with top padding matching floating navbar height */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-28 pb-12">
        {children}
      </main>
    </div>
  );
};
