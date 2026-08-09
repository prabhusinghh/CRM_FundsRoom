import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, FileStack, ChevronRight } from 'lucide-react';
import { listChallans } from '../../api/challanApi';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import ChallanTag from '../../components/common/ChallanTag';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = ['', 'Draft', 'Confirmed', 'Cancelled'];

export default function ChallanList() {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page') || 1);
  const limit = 10;

  const load = useCallback(() => {
    setLoading(true);
    listChallans({ status: status || undefined, page, limit })
      .then((res) => {
        setRows(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(load, [load]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div>
      <PageHeader
        title="Sales Challans"
        description="Delivery documents — drafted, confirmed, and shipped."
        action={
          hasRole('Admin', 'Sales') && (
            <Link to="/challans/new" className="btn-primary">
              <Plus size={16} /> New challan
            </Link>
          )
        }
      />

      <div className="card">
        <div className="flex flex-wrap gap-2 border-b border-slate-light p-4">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => updateParam('status', s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s
                  ? 'border-ink bg-ink text-white'
                  : 'border-slate-light bg-surface text-slate hover:bg-slate-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSpinner />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileStack}
            title="No challans found"
            description="Try a different filter, or create your first sales challan."
            action={
              hasRole('Admin', 'Sales') && (
                <Link to="/challans/new" className="btn-primary">
                  <Plus size={16} /> New challan
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-light text-xs uppercase tracking-wide text-slate">
                    <th className="px-4 py-3 font-medium">Challan</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium text-right">Total qty</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-slate-light last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link to={`/challans/${c.id}`}>
                          <ChallanTag number={c.challan_number} size="sm" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink">{c.customer_name}</td>
                      <td className="num px-4 py-3 text-right text-ink">{c.total_quantity}</td>
                      <td className="px-4 py-3">
                        <Badge value={c.status} />
                      </td>
                      <td className="num px-4 py-3 text-xs text-slate">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Link to={`/challans/${c.id}`}>
                          <ChevronRight size={16} className="text-slate" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} limit={limit} total={total} onPageChange={(p) => updateParam('page', p)} />
          </>
        )}
      </div>
    </div>
  );
}
