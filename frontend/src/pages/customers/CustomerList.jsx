import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { listCustomers } from '../../api/customerApi';
import PageHeader from '../../components/common/PageHeader';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = ['', 'Lead', 'Active', 'Inactive'];
const TYPE_OPTIONS = ['', 'Retail', 'Wholesale', 'Distributor'];

export default function CustomerList() {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';
  const page = Number(searchParams.get('page') || 1);
  const limit = 10;

  const load = useCallback(() => {
    setLoading(true);
    listCustomers({ search: search || undefined, status: status || undefined, type: type || undefined, page, limit })
      .then((res) => {
        setRows(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [search, status, type, page]);

  useEffect(() => {
    const debounce = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [load, search]);

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
        title="Customers"
        description="Your CRM — leads, accounts, and follow-ups."
        action={
          hasRole('Admin', 'Sales') && (
            <Link to="/customers/new" className="btn-primary">
              <Plus size={16} /> Add customer
            </Link>
          )
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-light p-4 sm:flex-row sm:items-center">
          <div className="sm:w-72">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, mobile, business…" />
          </div>
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="input sm:w-40"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s || 'All statuses'}
              </option>
            ))}
          </select>
          <select value={type} onChange={(e) => updateParam('type', e.target.value)} className="input sm:w-40">
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t || 'All types'}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <PageSpinner />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Try a different search or filter, or add your first customer."
            action={
              hasRole('Admin', 'Sales') && (
                <Link to="/customers/new" className="btn-primary">
                  <Plus size={16} /> Add customer
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
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Mobile</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Follow-up</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-slate-light last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link to={`/customers/${c.id}`} className="font-medium text-ink hover:text-kraft">
                          {c.name}
                        </Link>
                        {c.business_name && <p className="text-xs text-slate">{c.business_name}</p>}
                      </td>
                      <td className="num px-4 py-3 text-ink">{c.mobile}</td>
                      <td className="px-4 py-3 text-slate">{c.customer_type}</td>
                      <td className="px-4 py-3">
                        <Badge value={c.status} />
                      </td>
                      <td className="num px-4 py-3 text-slate">{c.follow_up_date || '—'}</td>
                      <td className="px-2 py-3 text-right">
                        <Link to={`/customers/${c.id}`}>
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
