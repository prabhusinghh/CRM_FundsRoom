import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function EntityPicker({ placeholder, searchFn, renderResult, onSelect, selected, onClear }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => {
      searchFn(query).then((res) => {
        setResults(res);
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, searchFn]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-slate-light bg-slate-50 px-3 py-2">
        <div className="text-sm">{renderResult(selected)}</div>
        {onClear && (
          <button type="button" onClick={onClear} aria-label="Clear selection" className="text-slate hover:text-signal">
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="input pl-9"
        />
      </div>
      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-light bg-surface shadow-lift">
          {loading ? (
            <p className="px-3 py-2 text-sm text-slate">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate">No matches</p>
          ) : (
            results.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                  setQuery('');
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                {renderResult(r)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
