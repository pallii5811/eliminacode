import { Link, useLocation } from 'react-router-dom';
import { Home, Monitor, Settings, Ticket, ChevronLeft } from 'lucide-react';
import { isDemo } from '../lib/supabase';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/display', label: 'Display', icon: Monitor },
  { path: '/operatore', label: 'Operatore', icon: Settings },
  { path: '/ticket', label: 'Ticket', icon: Ticket },
];

export default function Header({ title, showBack = false, showNav = true, minimal = false }) {
  const location = useLocation();

  if (minimal) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {showBack ? (
            <button onClick={() => window.history.back()} className="btn-icon">
              <ChevronLeft size={20} />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <h1 className="text-sm font-bold text-sacred-900">{title || 'EliminaCode'}</h1>
          {isDemo && (
            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-700">
              DEMO
            </span>
          )}
          {!isDemo && <div className="w-10" />}
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sacred-600 text-white">
            <span className="text-lg">✝</span>
          </div>
          <span className="text-base font-bold text-sacred-900">EliminaCode</span>
        </Link>

        {showNav && (
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sacred-100 text-sacred-700'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded-full bg-gold-100 px-2.5 py-1 text-[10px] font-bold text-gold-700 uppercase tracking-wider">
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {showNav && (
        <nav className="flex sm:hidden border-t border-gray-100">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-sacred-600' : 'text-gray-400'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
