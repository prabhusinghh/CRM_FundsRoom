import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Package, ChevronRight, AlertTriangle, Download } from 'lucide-react';
import { listProducts } from '../../api/productApi';
import PageHeader from '../../components/common/PageHeader';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { generateProductStockPDF } from '../../utils/pdfGenerator';

export default function ProductList() {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const lowStock = searchParams.get('lowStock') === 'true';
  const page = Number(searchParams.get('page') || 1);
  const limit = 10;

  const load = useCallback(() => {
    setLoading(true);
    listProducts({ search: search || undefined, lowStock: lowStock || undefined, page, limit })
      .then((res) => {
        setRows(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [search, lowStock, page]);

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
        title="Products"
        description="Inventory across all warehouse locations."
        action={
          <div className="flex gap-2">
            {rows.length > 0 && (
              <button className="btn-secondary" onClick={() => generateProductStockPDF(rows)}>
                <Download size={16} /> Export PDF
              </button>
            )}
            {hasRole('Admin', 'Warehouse') && (
              <Link to="/products/new" className="btn-primary">
                <Plus size={16} /> Add product
              </Link>
            )}
          </div>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-light p-4 sm:flex-row sm:items-center">
          <div className="sm:w-72">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name or SKU…" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => updateParam('lowStock', e.target.checked ? 'true' : '')}
              className="h-4 w-4 rounded border-slate-light text-kraft focus:ring-kraft"
            />
            Low stock only
          </label>
        </div>

        {loading ? (
          <PageSpinner />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Try a different search or filter, or add your first product."
            action={
              hasRole('Admin', 'Warehouse') && (
                <Link to="/products/new" className="btn-primary">
                  <Plus size={16} /> Add product
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
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Unit price</th>
                    <th className="px-4 py-3 font-medium text-right">Stock</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const isLow = p.current_stock <= p.min_stock_alert;
                    return (
                      <tr key={p.id} className="border-b border-slate-light last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link to={`/products/${p.id}`} className="font-medium text-ink hover:text-kraft">
                            {p.name}
                          </Link>
                        </td>
                        <td className="num px-4 py-3 text-slate">{p.sku}</td>
                        <td className="px-4 py-3 text-slate">{p.category || '—'}</td>
                        <td className="num px-4 py-3 text-right text-ink">
                          ₹{Number(p.unit_price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`num inline-flex items-center gap-1 font-medium ${
                              isLow ? 'text-signal' : 'text-ink'
                            }`}
                          >
                            {isLow && <AlertTriangle size={13} />}
                            {p.current_stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate">{p.warehouse_location || '—'}</td>
                        <td className="px-2 py-3 text-right">
                          <Link to={`/products/${p.id}`}>
                            <ChevronRight size={16} className="text-slate" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
