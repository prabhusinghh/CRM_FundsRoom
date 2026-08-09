import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, CheckCircle2, XCircle, User } from 'lucide-react';
import { getChallan, confirmChallan, cancelChallan } from '../../api/challanApi';
import Badge from '../../components/common/Badge';
import ChallanTag from '../../components/common/ChallanTag';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { PageSpinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ChallanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const toast = useToast();

  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // 'confirm' | 'cancel' | null
  const [working, setWorking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getChallan(id)
      .then(setChallan)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const handleConfirm = async () => {
    setWorking(true);
    try {
      await confirmChallan(id);
      toast.success('Challan confirmed — stock has been deducted.');
      setDialog(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm challan.');
    } finally {
      setWorking(false);
    }
  };

  const handleCancel = async () => {
    setWorking(true);
    try {
      await cancelChallan(id);
      toast.success(
        challan.status === 'Confirmed' ? 'Challan cancelled — stock has been reversed.' : 'Challan cancelled.'
      );
      setDialog(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel challan.');
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!challan) return null;

  const canEdit = challan.status === 'Draft' && hasRole('Admin', 'Sales');
  const canConfirm = challan.status === 'Draft' && hasRole('Admin', 'Sales', 'Warehouse');
  const canCancel = challan.status !== 'Cancelled' && hasRole('Admin', 'Sales');

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate('/challans')}
        className="mb-4 flex items-center gap-1 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to challans
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <ChallanTag number={challan.challan_number} />
            <div className="mt-2 flex items-center gap-2">
              <Badge value={challan.status} />
              <span className="num text-xs text-slate">
                Created {new Date(challan.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Link to={`/challans/${id}/edit`} className="btn-secondary">
                <Pencil size={14} /> Edit
              </Link>
            )}
            {canCancel && (
              <button className="btn-danger" onClick={() => setDialog('cancel')}>
                <XCircle size={14} /> Cancel
              </button>
            )}
            {canConfirm && (
              <button className="btn-primary" onClick={() => setDialog('confirm')}>
                <CheckCircle2 size={14} /> Confirm
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-slate-light pt-5 text-sm">
          <User size={15} className="text-slate" />
          <Link to={`/customers/${challan.customer_id}`} className="font-medium text-ink hover:text-kraft">
            {challan.customer_name}
          </Link>
          <span className="num text-slate">· {challan.customer_mobile}</span>
        </div>
      </div>

      <div className="card mt-6">
        <div className="border-b border-slate-light px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-light text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium text-right">Unit price</th>
                <th className="px-5 py-3 font-medium text-right">Qty</th>
                <th className="px-5 py-3 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-light last:border-0">
                  <td className="px-5 py-3">
                    <p className="text-ink">{item.product_name_snapshot}</p>
                    <p className="num text-xs text-slate">{item.product_sku_snapshot}</p>
                  </td>
                  <td className="num px-5 py-3 text-right text-ink">
                    ₹{Number(item.unit_price_snapshot).toFixed(2)}
                  </td>
                  <td className="num px-5 py-3 text-right text-ink">{item.quantity}</td>
                  <td className="num px-5 py-3 text-right text-ink">
                    ₹{(Number(item.unit_price_snapshot) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={2} />
                <td className="num px-5 py-3 text-right font-semibold text-ink">
                  {challan.total_quantity} units
                </td>
                <td className="num px-5 py-3 text-right font-semibold text-ink">
                  ₹
                  {challan.items
                    .reduce((sum, i) => sum + Number(i.unit_price_snapshot) * i.quantity, 0)
                    .toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="border-t border-slate-light px-5 py-3 text-xs text-slate">
          Prices shown are snapshotted at the time this challan was created and won't change even if the
          product's live price does.
        </p>
      </div>

      <ConfirmDialog
        open={dialog === 'confirm'}
        onClose={() => setDialog(null)}
        onConfirm={handleConfirm}
        title="Confirm this challan?"
        message="This will deduct stock for every item on this challan. If any product doesn't have enough stock, the whole confirmation will be cancelled and nothing will change."
        confirmLabel="Confirm challan"
        loading={working}
      />
      <ConfirmDialog
        open={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onConfirm={handleCancel}
        title="Cancel this challan?"
        message={
          challan.status === 'Confirmed'
            ? 'This challan has already been confirmed — cancelling it will reverse the stock deduction for every item.'
            : 'This draft will be marked as cancelled and can no longer be edited or confirmed.'
        }
        confirmLabel="Cancel challan"
        tone="danger"
        loading={working}
      />
    </div>
  );
}
