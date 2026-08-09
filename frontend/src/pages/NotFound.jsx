import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <PackageSearch size={40} className="text-slate" />
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-1 text-sm text-slate">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary mt-5">
        Back to dashboard
      </Link>
    </div>
  );
}
