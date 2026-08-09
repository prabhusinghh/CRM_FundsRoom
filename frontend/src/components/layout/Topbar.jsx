import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onOpenMobileNav }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-light bg-surface/95 px-4 backdrop-blur md:px-6">
      <button
        onClick={onOpenMobileNav}
        className="rounded p-1.5 text-ink hover:bg-slate-50 md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-kraft-light text-xs font-semibold text-kraft-dark">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="hidden text-ink sm:inline">{user?.name}</span>
          <ChevronDown size={14} className="text-slate" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-44 rounded-md border border-slate-light bg-surface py-1 shadow-lift animate-[fadeIn_0.1s_ease-out]">
            <div className="border-b border-slate-light px-3 py-2">
              <p className="text-sm font-medium text-ink">{user?.name}</p>
              <p className="text-xs text-slate">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-signal hover:bg-signal-bg"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
