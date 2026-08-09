import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getCustomer, createCustomer, updateCustomer } from '../../api/customerApi';
import PageHeader from '../../components/common/PageHeader';
import { FormField, TextInput, TextArea, Select } from '../../components/common/FormField';
import { PageSpinner } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

const emptyForm = {
  name: '',
  mobile: '',
  email: '',
  business_name: '',
  gst_number: '',
  customer_type: 'Retail',
  address: '',
  status: 'Lead',
  follow_up_date: '',
  notes: '',
};

export default function CustomerForm() {
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
    getCustomer(id)
      .then((c) =>
        setForm({
          name: c.name || '',
          mobile: c.mobile || '',
          email: c.email || '',
          business_name: c.business_name || '',
          gst_number: c.gst_number || '',
          customer_type: c.customer_type || 'Retail',
          address: c.address || '',
          status: c.status || 'Lead',
          follow_up_date: c.follow_up_date || '',
          notes: c.notes || '',
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
      const payload = { ...form, follow_up_date: form.follow_up_date || null };
      if (isEdit) {
        await updateCustomer(id, payload);
        toast.success('Customer updated.');
      } else {
        const created = await createCustomer(payload);
        toast.success('Customer added.');
        navigate(`/customers/${created.id}`);
        return;
      }
      navigate(`/customers/${id}`);
    } catch (err) {
      const fieldErrors = {};
      (err.response?.data?.errors || []).forEach((e2) => {
        fieldErrors[e2.field] = e2.message;
      });
      setErrors(fieldErrors);
      toast.error(err.response?.data?.message || 'Could not save customer.');
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
      <PageHeader title={isEdit ? 'Edit customer' : 'Add customer'} />

      <form onSubmit={handleSubmit} className="card p-6">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField label="Full name" required error={errors.name}>
            <TextInput value={form.name} onChange={set('name')} required maxLength={150} />
          </FormField>
          <FormField label="Mobile number" required error={errors.mobile}>
            <TextInput value={form.mobile} onChange={set('mobile')} required placeholder="98765 43210" />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <TextInput type="email" value={form.email} onChange={set('email')} />
          </FormField>
          <FormField label="Business name" error={errors.business_name}>
            <TextInput value={form.business_name} onChange={set('business_name')} />
          </FormField>
          <FormField label="GST number" error={errors.gst_number}>
            <TextInput value={form.gst_number} onChange={set('gst_number')} placeholder="15-character GSTIN" />
          </FormField>
          <FormField label="Customer type">
            <Select value={form.customer_type} onChange={set('customer_type')}>
              <option>Retail</option>
              <option>Wholesale</option>
              <option>Distributor</option>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={set('status')}>
              <option>Lead</option>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          </FormField>
          <FormField label="Next follow-up date" error={errors.follow_up_date}>
            <TextInput type="date" value={form.follow_up_date} onChange={set('follow_up_date')} />
          </FormField>
        </div>

        <FormField label="Address">
          <TextArea value={form.address} onChange={set('address')} rows={2} />
        </FormField>
        <FormField label="Notes">
          <TextArea value={form.notes} onChange={set('notes')} rows={3} />
        </FormField>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
