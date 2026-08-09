import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Boxes, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left: brand panel with a warehouse-racking motif */}
      <div className="relative hidden overflow-hidden bg-ink md:flex md:flex-col md:justify-between md:p-10">
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.07]"
          viewBox="0 0 400 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 6 }).map((_, col) => (
              <rect
                key={`${row}-${col}`}
                x={col * 68 + 8}
                y={row * 78 + 8}
                width="52"
                height="62"
                rx="2"
                fill="none"
                stroke="#F6F3EC"
                strokeWidth="1.5"
              />
            ))
          )}
        </svg>

        <div className="relative z-10 flex items-center gap-2 animate-[fadeIn_0.4s_ease-out]">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-kraft">
            <Boxes size={20} className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-white">Operations Portal</span>
        </div>

        <div className="relative z-10 max-w-sm animate-[fadeIn_0.5s_ease-out]">
          <h1 className="font-display text-3xl font-semibold leading-tight text-white">
            Every challan, customer, and stock count — in one ledger.
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Built for the sales floor, the warehouse racks, and the accounts desk to run off the
            same numbers.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/40">Mini ERP + CRM Operations Portal</p>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center bg-canvas p-6 md:p-10">
        <div className="w-full max-w-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-kraft">
              <Boxes size={18} className="text-white" />
            </div>
            <span className="font-display text-base font-semibold text-ink">
              Operations Portal
            </span>
          </div>

          <h2 className="font-display text-xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-slate">Use the account provided by your admin.</p>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-4">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@company.com"
              />
            </div>
            <div className="mb-2">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-md bg-signal-bg px-3 py-2 text-sm text-signal">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
