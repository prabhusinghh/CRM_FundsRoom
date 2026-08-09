import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 20, className = '' }) {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-kraft ${className}`}
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}
