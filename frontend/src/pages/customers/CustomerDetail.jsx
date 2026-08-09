import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, MessageSquarePlus, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { getCustomer, addFollowup } from '../../api/customerApi';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { FormField, TextArea, TextInput } from '../../components/common/FormField';
import EmptyState from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const toast = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getCustomer(id)
      .then(setCustomer)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addFollowup(id, { note, follow_up_date: followUpDate || undefined });
      toast.success('Follow-up added.');
      setModalOpen(false);
      setNote('');
      setFollowUpDate('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add follow-up.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!customer) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate('/customers')}
        className="mb-4 flex items-center gap-1 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to customers
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-semibold text-ink">{customer.name}</h1>
              <Badge value={customer.status} />
            </div>
            {customer.business_name && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
                <Building2 size={14} /> {customer.business_name}
              </p>
            )}
          </div>
          {hasRole('Admin', 'Sales') && (
            <Link to={`/customers/${id}/edit`} className="btn-secondary">
              <Pencil size={14} /> Edit
            </Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-light pt-5 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone size={15} className="text-slate" />
            <span className="num text-ink">{customer.mobile}</span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={15} className="text-slate" />
              <span className="text-ink">{customer.email}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-2 text-sm sm:col-span-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-slate" />
              <span className="text-ink">{customer.address}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-slate-light pt-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate">Type</p>
            <p className="text-ink">{customer.customer_type}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate">GSTIN</p>
            <p className="num text-ink">{customer.gst_number || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate">Next follow-up</p>
            <p className="num text-ink">{customer.follow_up_date || '—'}</p>
          </div>
        </div>

        {customer.notes && (
          <div className="mt-4 border-t border-slate-light pt-4">
            <p className="text-xs uppercase tracking-wide text-slate">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between border-b border-slate-light px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">Follow-up history</h2>
          {hasRole('Admin', 'Sales') && (
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={15} /> Add follow-up
            </button>
          )}
        </div>
        <div className="p-2">
          {customer.followups.length === 0 ? (
            <EmptyState
              icon={MessageSquarePlus}
              title="No follow-ups yet"
              description="Log a call, visit, or note to build this customer's history."
            />
          ) : (
            <ul className="divide-y divide-slate-light">
              {customer.followups.map((f) => (
                <li key={f.id} className="px-4 py-3">
                  <p className="text-sm text-ink">{f.note}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate">
                    <span className="num">{new Date(f.created_at).toLocaleString()}</span>
                    {f.follow_up_date && (
                      <span className="num text-warn">Next: {f.follow_up_date}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add follow-up">
        <form onSubmit={handleAddFollowup}>
          <FormField label="Note" required>
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} required rows={3} autoFocus />
          </FormField>
          <FormField label="Next follow-up date (optional)">
            <TextInput type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </FormField>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Add follow-up'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
