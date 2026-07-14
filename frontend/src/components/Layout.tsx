import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Award, LogOut, LayoutDashboard, Play, Calendar } from 'lucide-react';

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
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Navigation Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-sky-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="font-display font-extrabold text-white text-sm">Ch</span>
            </div>
            <span className="font-display font-bold text-lg tracking-wider text-white">Chaturang</span>
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
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-full text-xs font-semibold text-amber-400 shadow-md">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>{user.rating} ELO</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-400 flex items-center gap-1.5 px-2.5 sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Links (Below Header) */}
        {user && (
          <div className="md:hidden border-t border-zinc-900/80 bg-zinc-950/40 px-4 py-2 flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive ? 'text-violet-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Page Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
