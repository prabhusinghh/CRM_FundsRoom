import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, PlusCircle, MinusCircle, History, AlertTriangle } from 'lucide-react';
import { getProduct, getStockLog, addStockMovement } from '../../api/productApi';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { FormField, TextInput, TextArea } from '../../components/common/FormField';
import EmptyState from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [log, setLog] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalType, setModalType] = useState(null); // 'IN' | 'OUT' | null
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProduct = useCallback(() => getProduct(id).then(setProduct), [id]);
  const loadLog = useCallback(
    () => getStockLog(id, { page: logPage, limit: 8 }).then((res) => {
      setLog(res.data);
      setLogTotal(res.total);
    }),
    [id, logPage]
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProduct(), loadLog()]).finally(() => setLoading(false));
  }, [loadProduct, loadLog]);

  const openModal = (type) => {
    setModalType(type);
    setQuantity('');
    setReason('');
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addStockMovement(id, {
        quantity_changed: Number(quantity),
        movement_type: modalType,
        reason,
      });
      toast.success(`Stock ${modalType === 'IN' ? 'added' : 'removed'} successfully.`);
      setModalType(null);
      await Promise.all([loadProduct(), loadLog()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record stock movement.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!product) return null;

  const isLow = product.current_stock <= product.min_stock_alert;

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate('/products')}
        className="mb-4 flex items-center gap-1 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to products
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">{product.name}</h1>
            <p className="num mt-1 text-sm text-slate">{product.sku}</p>
          </div>
          {hasRole('Admin', 'Warehouse') && (
            <Link to={`/products/${id}/edit`} className="btn-secondary">
              <Pencil size={14} /> Edit
            </Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-light pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate">Unit price</p>
            <p className="num mt-0.5 text-lg font-semibold text-ink">
              ₹{Number(product.unit_price).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate">Current stock</p>
            <p className={`num mt-0.5 flex items-center gap-1 text-lg font-semibold ${isLow ? 'text-signal' : 'text-ink'}`}>
              {isLow && <AlertTriangle size={15} />}
              {product.current_stock}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate">Alert at</p>
            <p className="num mt-0.5 text-lg font-semibold text-ink">{product.min_stock_alert}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate">Location</p>
            <p className="mt-0.5 text-lg font-semibold text-ink">{product.warehouse_location || '—'}</p>
          </div>
        </div>

        {product.category && (
          <div className="mt-4 border-t border-slate-light pt-4 text-sm">
            <span className="text-xs uppercase tracking-wide text-slate">Category </span>
            <span className="text-ink">{product.category}</span>
          </div>
        )}

        {hasRole('Admin', 'Warehouse') && (
          <div className="mt-5 flex gap-2 border-t border-slate-light pt-5">
            <button onClick={() => openModal('IN')} className="btn-secondary">
              <PlusCircle size={15} className="text-depot" /> Stock in
            </button>
            <button onClick={() => openModal('OUT')} className="btn-secondary">
              <MinusCircle size={15} className="text-signal" /> Stock out
            </button>
          </div>
        )}
      </div>

      <div className="card mt-6">
        <div className="flex items-center gap-2 border-b border-slate-light px-5 py-4">
          <History size={16} className="text-slate" />
          <h2 className="font-display text-base font-semibold text-ink">Stock movement log</h2>
        </div>
        {log.length === 0 ? (
          <EmptyState icon={History} title="No movements yet" description="Stock changes will be logged here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-light text-xs uppercase tracking-wide text-slate">
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium text-right">Qty</th>
                    <th className="px-4 py-2.5 font-medium">Reason</th>
                    <th className="px-4 py-2.5 font-medium">Reference</th>
                    <th className="px-4 py-2.5 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((m) => (
                    <tr key={m.id} className="border-b border-slate-light last:border-0">
                      <td className="px-4 py-2.5">
                        <Badge value={m.movement_type} />
                      </td>
                      <td className="num px-4 py-2.5 text-right text-ink">{m.quantity_changed}</td>
                      <td className="px-4 py-2.5 text-ink">{m.reason || '—'}</td>
                      <td className="num px-4 py-2.5 text-xs text-slate">{m.reference_type}</td>
                      <td className="num px-4 py-2.5 text-xs text-slate">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={logPage} limit={8} total={logTotal} onPageChange={setLogPage} />
          </>
        )}
      </div>

      <Modal
        open={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalType === 'IN' ? 'Stock in' : 'Stock out'}
      >
        <form onSubmit={handleSubmitMovement}>
          <FormField label="Quantity" required>
            <TextInput
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              autoFocus
              className="num"
            />
          </FormField>
          {modalType === 'OUT' && (
            <p className="-mt-2 mb-4 text-xs text-slate">
              Currently in stock: <span className="num">{product.current_stock}</span>
            </p>
          )}
          <FormField label="Reason" required>
            <TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={2}
              placeholder={modalType === 'IN' ? 'e.g. Purchase order received' : 'e.g. Damaged in warehouse'}
            />
          </FormField>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModalType(null)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : `Confirm ${modalType === 'IN' ? 'stock in' : 'stock out'}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
