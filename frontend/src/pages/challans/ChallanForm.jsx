import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { getChallan, createChallan, updateChallan } from '../../api/challanApi';
import { listCustomers } from '../../api/customerApi';
import { listProducts } from '../../api/productApi';
import PageHeader from '../../components/common/PageHeader';
import EntityPicker from '../../components/common/EntityPicker';
import ChallanTag from '../../components/common/ChallanTag';
import { PageSpinner } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

let lineIdCounter = 0;

export default function ChallanForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [customer, setCustomer] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(null); // null | 'draft' | 'confirm'
  const [challanNumber, setChallanNumber] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getChallan(id).then((c) => {
      if (c.status !== 'Draft') {
        toast.error('Only draft challans can be edited.');
        navigate(`/challans/${id}`);
        return;
      }
      setChallanNumber(c.challan_number);
      setCustomer({ id: c.customer_id, name: c.customer_name, mobile: c.customer_mobile });
      setLines(
        c.items.map((item) => ({
          lineId: ++lineIdCounter,
          product: {
            id: item.product_id,
            name: item.product_name_snapshot,
            sku: item.product_sku_snapshot,
            unit_price: item.unit_price_snapshot,
            current_stock: null,
          },
          quantity: String(item.quantity),
        }))
      );
      setLoading(false);
    });
  }, [id, isEdit, navigate, toast]);

  const addLine = (product) => {
    if (lines.some((l) => l.product.id === product.id)) {
      toast.error(`${product.name} is already on this challan — update its quantity instead.`);
      return;
    }
    setLines((prev) => [...prev, { lineId: ++lineIdCounter, product, quantity: '1' }]);
  };

  const updateQuantity = (lineId, quantity) => {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)));
  };

  const removeLine = (lineId) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  const totalQuantity = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
  const totalValue = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * Number(l.product.unit_price || 0),
    0
  );

  const buildPayload = () => ({
    customer_id: customer.id,
    items: lines.map((l) => ({ product_id: l.product.id, quantity: Number(l.quantity) })),
  });

  const validate = () => {
    if (!customer) {
      toast.error('Select a customer first.');
      return false;
    }
    if (lines.length === 0) {
      toast.error('Add at least one product.');
      return false;
    }
    if (lines.some((l) => !l.quantity || Number(l.quantity) <= 0)) {
      toast.error('Every line item needs a quantity greater than zero.');
      return false;
    }
    return true;
  };

  const handleSave = async (mode) => {
    if (!validate()) return;
    setSaving(mode);
    try {
      if (isEdit) {
        await updateChallan(id, buildPayload());
        toast.success('Challan updated.');
        navigate(`/challans/${id}`);
      } else {
        const created = await createChallan({
          ...buildPayload(),
          status: mode === 'confirm' ? 'Confirmed' : 'Draft',
        });
        toast.success(mode === 'confirm' ? 'Challan created and confirmed.' : 'Challan saved as draft.');
        navigate(`/challans/${created.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save challan.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <PageHeader
        title={isEdit ? 'Edit challan' : 'New sales challan'}
        description={challanNumber ? <ChallanTag number={challanNumber} size="sm" /> : undefined}
      />

      <div className="card p-6">
        <div className="mb-5">
          <label className="label">Customer</label>
          <EntityPicker
            placeholder="Search customers by name or mobile…"
            searchFn={(q) => listCustomers({ search: q, limit: 8 }).then((res) => res.data)}
            renderResult={(c) => (
              <div>
                <p className="font-medium text-ink">{c.name}</p>
                <p className="num text-xs text-slate">{c.mobile}</p>
              </div>
            )}
            selected={customer}
            onSelect={setCustomer}
            onClear={() => setCustomer(null)}
          />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <label className="label !mb-0">Products</label>
        </div>

        {lines.length > 0 && (
          <div className="mb-3 overflow-hidden rounded-md border border-slate-light">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-light bg-slate-50 text-xs uppercase tracking-wide text-slate">
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium text-right">Unit price</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const overStock =
                    l.product.current_stock != null && Number(l.quantity) > l.product.current_stock;
                  return (
                    <tr key={l.lineId} className="border-b border-slate-light last:border-0">
                      <td className="px-3 py-2">
                        <p className="text-ink">{l.product.name}</p>
                        <p className="num text-xs text-slate">{l.product.sku}</p>
                      </td>
                      <td className="num px-3 py-2 text-right text-ink">
                        ₹{Number(l.product.unit_price).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={l.quantity}
                          onChange={(e) => updateQuantity(l.lineId, e.target.value)}
                          className="num input w-20 py-1 text-right"
                        />
                        {overStock && (
                          <p className="mt-1 flex items-center justify-end gap-1 text-xs text-signal">
                            <AlertTriangle size={11} /> only {l.product.current_stock} in stock
                          </p>
                        )}
                      </td>
                      <td className="num px-3 py-2 text-right text-ink">
                        ₹{((Number(l.quantity) || 0) * Number(l.product.unit_price)).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(l.lineId)}
                          aria-label="Remove line item"
                          className="text-slate hover:text-signal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-5">
          <EntityPicker
            placeholder="Search products by name or SKU to add…"
            searchFn={(q) => listProducts({ search: q, limit: 8 }).then((res) => res.data)}
            renderResult={(p) => (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="num text-xs text-slate">{p.sku}</p>
                </div>
                <span className="num text-xs text-slate">{p.current_stock} in stock</span>
              </div>
            )}
            onSelect={addLine}
            selected={null}
          />
        </div>

        <div className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate">
            <span className="num font-semibold text-ink">{totalQuantity}</span> total units
          </span>
          <span className="num text-sm font-semibold text-ink">₹{totalValue.toFixed(2)}</span>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving !== null}
            onClick={() => handleSave('draft')}
          >
            {saving === 'draft' ? 'Saving…' : isEdit ? 'Save changes' : 'Save as draft'}
          </button>
          {!isEdit && (
            <button
              type="button"
              className="btn-primary"
              disabled={saving !== null}
              onClick={() => handleSave('confirm')}
            >
              {saving === 'confirm' ? 'Confirming…' : 'Save & confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
