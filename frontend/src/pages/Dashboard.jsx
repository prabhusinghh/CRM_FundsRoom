import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, PackageX, FileClock, CheckCircle2, ArrowUpRight, Clock } from 'lucide-react';
import { listCustomers } from '../api/customerApi';
import { listProducts } from '../api/productApi';
import { listChallans } from '../api/challanApi';
import Badge from '../components/common/Badge';
import ChallanTag from '../components/common/ChallanTag';
import { PageSpinner } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, icon: Icon, tone = 'ink' }) {
  const toneStyles = {
    ink: 'bg-ink text-white',
    kraft: 'bg-kraft text-white',
    signal: 'bg-signal text-white',
    depot: 'bg-depot text-white',
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="num text-2xl font-semibold text-ink">{value}</p>
        <p className="text-sm text-slate">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ customers: 0, lowStock: 0, draftChallans: 0, confirmedChallans: 0 });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentChallans, setRecentChallans] = useState([]);
  const [upcomingLeads, setUpcomingLeads] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listCustomers({ limit: 1 }),
      listProducts({ lowStock: true, limit: 5 }),
      listChallans({ status: 'Draft', limit: 1 }),
      listChallans({ status: 'Confirmed', limit: 1 }),
      listChallans({ limit: 5 }),
      listCustomers({ status: 'Lead', limit: 5 }),
    ])
      .then(([customersRes, lowStockRes, draftRes, confirmedRes, recentRes, leadsRes]) => {
        if (cancelled) return;
        setStats({
          customers: customersRes.total,
          lowStock: lowStockRes.total,
          draftChallans: draftRes.total,
          confirmedChallans: confirmedRes.total,
        });
        setLowStockProducts(lowStockRes.data);
        setRecentChallans(recentRes.data);
        setUpcomingLeads(leadsRes.data.filter((c) => c.follow_up_date));
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate">Here's what's moving through the portal today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" value={stats.customers} icon={Users} tone="ink" />
        <StatCard label="Low stock items" value={stats.lowStock} icon={PackageX} tone="signal" />
        <StatCard label="Draft challans" value={stats.draftChallans} icon={FileClock} tone="kraft" />
        <StatCard label="Confirmed challans" value={stats.confirmedChallans} icon={CheckCircle2} tone="depot" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low stock alert */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-light px-5 py-4">
            <h2 className="font-display text-base font-semibold text-ink">Low stock alert</h2>
            <Link
              to="/products?lowStock=true"
              className="flex items-center gap-1 text-xs font-medium text-kraft hover:text-kraft-dark"
            >
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="p-2">
            {lowStockProducts.length === 0 ? (
              <EmptyState
                icon={PackageX}
                title="Nothing running low"
                description="All products are above their alert threshold."
              />
            ) : (
              <ul className="divide-y divide-slate-light">
                {lowStockProducts.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/products/${p.id}`}
                      className="flex items-center justify-between px-3 py-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        <p className="num text-xs text-slate">{p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="num text-sm font-semibold text-signal">
                          {p.current_stock} left
                        </p>
                        <p className="num text-xs text-slate">alert at {p.min_stock_alert}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent challans */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-light px-5 py-4">
            <h2 className="font-display text-base font-semibold text-ink">Recent challans</h2>
            <Link
              to="/challans"
              className="flex items-center gap-1 text-xs font-medium text-kraft hover:text-kraft-dark"
            >
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="p-2">
            {recentChallans.length === 0 ? (
              <EmptyState
                icon={FileClock}
                title="No challans yet"
                description="Challans you create will show up here."
              />
            ) : (
              <ul className="divide-y divide-slate-light">
                {recentChallans.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/challans/${c.id}`}
                      className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <ChallanTag number={c.challan_number} size="sm" />
                        <p className="mt-1 truncate text-sm text-ink">{c.customer_name}</p>
                      </div>
                      <Badge value={c.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming follow-ups */}
      <div className="card mt-6">
        <div className="flex items-center justify-between border-b border-slate-light px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">Leads with a follow-up set</h2>
          <Link
            to="/customers?status=Lead"
            className="flex items-center gap-1 text-xs font-medium text-kraft hover:text-kraft-dark"
          >
            View all <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="p-2">
          {upcomingLeads.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No follow-ups scheduled"
              description="Leads with a follow-up date will show up here."
            />
          ) : (
            <ul className="divide-y divide-slate-light">
              {upcomingLeads.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/customers/${c.id}`}
                    className="flex items-center justify-between px-3 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{c.name}</p>
                      <p className="num text-xs text-slate">{c.mobile}</p>
                    </div>
                    <p className="num text-sm text-warn">{c.follow_up_date}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
