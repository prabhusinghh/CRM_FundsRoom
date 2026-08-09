import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileStack,
  Boxes,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/challans', label: 'Sales Challans', icon: FileStack },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuth();

  const content = (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-kraft">
            <Boxes size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-tight">Operations</p>
            <p className="text-xs leading-tight text-white/50">Portal</p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-sm font-medium text-white">{user?.name}</p>
        <p className="text-xs text-white/50">{user?.role}</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: permanent sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink text-white md:flex">
        {content}
      </aside>

      {/* Mobile: slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/50 animate-[fadeIn_0.15s_ease-out]"
            onClick={onCloseMobile}
            role="presentation"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink text-white">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
