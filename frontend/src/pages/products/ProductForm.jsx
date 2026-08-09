import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getProduct, createProduct, updateProduct } from '../../api/productApi';
import PageHeader from '../../components/common/PageHeader';
import { FormField, TextInput } from '../../components/common/FormField';
import { PageSpinner } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  unit_price: '',
  current_stock: '0',
  min_stock_alert: '0',
  warehouse_location: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    getProduct(id)
      .then((p) =>
        setForm({
          name: p.name || '',
          sku: p.sku || '',
          category: p.category || '',
          unit_price: p.unit_price || '',
          current_stock: String(p.current_stock),
          min_stock_alert: String(p.min_stock_alert),
          warehouse_location: p.warehouse_location || '',
        })
      )
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) {
        // current_stock is intentionally excluded from the edit payload —
        // the API only allows it to be set at creation.
        const { current_stock, ...editable } = form;
        await updateProduct(id, { ...editable, unit_price: Number(form.unit_price), min_stock_alert: Number(form.min_stock_alert) });
        toast.success('Product updated.');
        navigate(`/products/${id}`);
      } else {
        const created = await createProduct({
          ...form,
          unit_price: Number(form.unit_price),
          current_stock: Number(form.current_stock),
          min_stock_alert: Number(form.min_stock_alert),
        });
        toast.success('Product added.');
        navigate(`/products/${created.id}`);
      }
    } catch (err) {
      const fieldErrors = {};
      (err.response?.data?.errors || []).forEach((e2) => {
        fieldErrors[e2.field] = e2.message;
      });
      setErrors(fieldErrors);
      toast.error(err.response?.data?.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <PageHeader title={isEdit ? 'Edit product' : 'Add product'} />

      <form onSubmit={handleSubmit} className="card p-6">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField label="Product name" required error={errors.name}>
            <TextInput value={form.name} onChange={set('name')} required maxLength={150} />
          </FormField>
          <FormField label="SKU / code" required error={errors.sku}>
            <TextInput value={form.sku} onChange={set('sku')} required maxLength={50} className="num" />
          </FormField>
          <FormField label="Category" error={errors.category}>
            <TextInput value={form.category} onChange={set('category')} />
          </FormField>
          <FormField label="Unit price (₹)" required error={errors.unit_price}>
            <TextInput
              type="number"
              step="0.01"
              min="0"
              value={form.unit_price}
              onChange={set('unit_price')}
              required
              className="num"
            />
          </FormField>
          <FormField
            label="Opening stock"
            error={errors.current_stock}
          >
            <TextInput
              type="number"
              min="0"
              value={form.current_stock}
              onChange={set('current_stock')}
              disabled={isEdit}
              className="num"
            />
            {isEdit && (
              <p className="mt-1 text-xs text-slate">
                Stock can only change through a stock movement — see the product detail page.
              </p>
            )}
          </FormField>
          <FormField label="Minimum stock alert" error={errors.min_stock_alert}>
            <TextInput
              type="number"
              min="0"
              value={form.min_stock_alert}
              onChange={set('min_stock_alert')}
              className="num"
            />
          </FormField>
          <FormField label="Warehouse location" error={errors.warehouse_location}>
            <TextInput value={form.warehouse_location} onChange={set('warehouse_location')} placeholder="e.g. A1" />
          </FormField>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  );
}
