import { Tag } from 'lucide-react';

// The one deliberately "designed" data element: a challan number rendered
// like a stamped shipping tag, tying the digital record back to the paper
// document it replaces.
export default function ChallanTag({ number, size = 'md' }) {
  const sizing = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span
      className={`num inline-flex items-center gap-1.5 rounded border border-dashed border-kraft/50 bg-kraft-light/40 text-kraft-dark font-medium tracking-wide ${sizing}`}
    >
      <Tag size={size === 'sm' ? 12 : 14} strokeWidth={2} />
      {number}
    </span>
  );
}
