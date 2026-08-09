const STATUS_STYLES = {
  // Challan statuses
  Draft: 'bg-slate-50 text-slate border-slate-light',
  Confirmed: 'bg-depot-bg text-depot border-depot/30',
  Cancelled: 'bg-signal-bg text-signal border-signal/30',
  // Customer statuses
  Lead: 'bg-warn-bg text-warn border-warn/30',
  Active: 'bg-depot-bg text-depot border-depot/30',
  Inactive: 'bg-slate-50 text-slate border-slate-light',
  // Stock movement types
  IN: 'bg-depot-bg text-depot border-depot/30',
  OUT: 'bg-signal-bg text-signal border-signal/30',
};

export default function Badge({ value, children }) {
  const style = STATUS_STYLES[value] || 'bg-slate-50 text-slate border-slate-light';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {children || value}
    </span>
  );
}
