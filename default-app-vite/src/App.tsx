import React, { useState, useEffect } from 'react';
import { Truck, Package, Activity, Search, LogOut, CheckCircle, PackageOpen, Clock, Plus, X, Loader2, RefreshCw, AlertCircle, AlertTriangle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import classNames from 'classnames';
import { supabase } from './lib/supabase';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Profile {
  id: string;
  role: 'Admin' | 'Importer';
  company_name: string;
}

interface Shipment {
  id: string;
  importer_id: string;
  office_code: string;
  year: string;
  commercial_reference: string;
  trn: string;
  tracking_role: string;
  status: string;
  customs_reference: string | null;
  last_scraped_at: string | null;
  created_at: string;
  profiles?: { company_name: string };
}

interface ShipmentStatus {
  id: string;
  shipment_id: string;
  status_type: string;
  status_value: string;
  date_time_assigned: string | null;
  date_time_completed: string | null;
}

// ─────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
    if (error) console.error('Profile fetch error:', error);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  const role = profile?.role || 'Importer';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      <Sidebar role={role} onLogout={handleLogout} companyName={profile?.company_name || ''} />
      <main className="flex-1 p-8 overflow-y-auto">
        {role === 'Admin' ? <AdminDashboard /> : <ImporterDashboard />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// Login Screen (Supabase Auth)
// ─────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signUpRole, setSignUpRole] = useState<'Admin' | 'Importer'>('Importer');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }

      // Create profile
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          role: signUpRole,
          company_name: companyName || email.split('@')[0],
        });
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setSubmitting(false); return; }
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full text-white shadow-lg shadow-blue-500/30">
            <Truck size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-1">Broker<span className="text-blue-600">Track</span></h1>
        <p className="text-center text-slate-500 mb-8"> {isSignUp ? 'Create your account' : 'Sign in to your portal'}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Email Address" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          {isSignUp && (
            <>
              <input
                type="text" placeholder="Company Name" value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setSignUpRole('Importer')}
                  className={classNames('flex-1 py-2 rounded-lg text-sm font-medium border transition',
                    signUpRole === 'Importer' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}>Importer</button>
                <button type="button" onClick={() => setSignUpRole('Admin')}
                  className={classNames('flex-1 py-2 rounded-lg text-sm font-medium border transition',
                    signUpRole === 'Admin' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}>Admin / Broker</button>
              </div>
            </>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-blue-600 font-semibold hover:underline">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
function Sidebar({ role, onLogout, companyName }: { role: string; onLogout: () => void; companyName: string }) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex h-screen sticky top-0">
      <div className="p-6 flex items-center space-x-3 text-white">
        <Truck size={24} className="text-blue-500" />
        <span className="text-xl font-bold tracking-wide">Broker<span className="text-blue-500">Track</span></span>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-2">
        <a href="#" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-3 rounded-lg font-medium">
          <Activity size={20} />
          <span>Dashboard</span>
        </a>
        <a href="#" className="flex items-center space-x-3 hover:bg-slate-800 px-4 py-3 rounded-lg font-medium transition-colors">
          <Search size={20} />
          <span>Track Declaration</span>
        </a>
        {role === 'Admin' && (
          <a href="#" className="flex items-center space-x-3 hover:bg-slate-800 px-4 py-3 rounded-lg font-medium transition-colors">
            <Package size={20} />
            <span>Clients</span>
          </a>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 mb-2 px-4">{companyName}</div>
        <button onClick={onLogout} className="flex items-center space-x-3 w-full hover:bg-slate-800 px-4 py-3 rounded-lg font-medium transition-colors text-slate-400 hover:text-white">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// Admin Dashboard
// ─────────────────────────────────────────────
function AdminDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importers, setImporters] = useState<Profile[]>([]);
  const [scraping, setScraping] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadShipments();
    loadImporters();
  }, []);

  async function loadShipments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shipments')
      .select('*, profiles(company_name), shipment_statuses(*)')
      .order('created_at', { ascending: false });
    if (data) setShipments(data as any);
    if (error) console.error(error);
    setLoading(false);
  }

  async function deleteShipment(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to stop tracking this shipment?')) return;
    const { error } = await supabase.from('shipments').delete().eq('id', id);
    if (error) alert(error.message);
    else loadShipments();
  }

  async function loadImporters() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'Importer');
    if (data) setImporters(data);
  }

  async function scrapeShipments(shipmentId?: string) {
    if (shipmentId) setScrapingId(shipmentId);
    else setScraping(true);
    setScrapeMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(shipmentId ? { shipmentId } : {}),
      });
      const json = await res.json();
      if (res.ok) {
        setScrapeMsg(`✓ ${json.message}`);
        loadShipments();
      } else {
        setScrapeMsg(`✗ ${json.error || 'Scrape failed'}`);
      }
    } catch (err: any) {
      setScrapeMsg(`✗ ${err.message}`);
    } finally {
      setScraping(false);
      setScrapingId(null);
      setTimeout(() => setScrapeMsg(''), 5000);
    }
  }

  const stats = {
    active: shipments.length,
    pending: shipments.filter(s => s.status !== 'Released' && s.status !== 'Not Valid').length,
    cleared: shipments.filter(s => s.status === 'Released' || s.status === 'Release Ready').length,
    invalid: shipments.filter(s => s.status === 'Not Valid').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Broker Overview</h2>
          <p className="text-slate-500 mt-2">Manage tracking automation and view all clients.</p>
        </div>
        <div className="flex items-center gap-3">
          {scrapeMsg && (
            <span className={classNames('text-sm font-medium px-3 py-1.5 rounded-lg',
              scrapeMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            )}>{scrapeMsg}</span>
          )}
          <button onClick={() => scrapeShipments()} disabled={scraping}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
            <RefreshCw size={16} className={scraping ? 'animate-spin' : ''} />
            {scraping ? 'Scraping...' : 'Scrape All Now'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Tracking" value={String(stats.active)} icon={<PackageOpen size={24} className="text-blue-500" />} />
        <StatCard title="Pending" value={String(stats.pending)} icon={<Clock size={24} className="text-amber-500" />} />
        <StatCard title="Cleared" value={String(stats.cleared)} icon={<CheckCircle size={24} className="text-emerald-500" />} />
        <StatCard title="Not Valid" value={String(stats.invalid)} icon={<AlertCircle size={24} className="text-rose-500" />} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-lg">Active Declarations</h3>
          <button onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus size={16} /> Track New Shipment
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <PackageOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium">No shipments tracked yet.</p>
            <p className="text-sm mt-1">Click "Track New Shipment" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Office</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4 text-right">Last Scraped</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {expandedId === s.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          <span className="font-semibold text-blue-600">{s.commercial_reference}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{s.profiles?.company_name || '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{s.office_code}</td>
                      <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                      <td className="px-6 py-4 text-right text-slate-500 text-xs">
                        {s.last_scraped_at ? new Date(s.last_scraped_at).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); scrapeShipments(s.id); }} disabled={scrapingId === s.id}
                            className="text-slate-400 hover:text-blue-600 transition-colors" title="Refresh this shipment">
                            <RefreshCw size={16} className={scrapingId === s.id ? 'animate-spin' : ''} />
                          </button>
                          <button onClick={(e) => deleteShipment(e, s.id)} className="text-slate-300 hover:text-rose-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === s.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-10 py-4 border-b border-slate-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Customs Ref</p>
                              <p className="font-mono text-slate-700">{s.customs_reference || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Importer Name</p>
                              <p className="text-slate-700">{(s as any).shipment_statuses?.find((st: any) => st.status_type === 'ATTR:IMPORTER NAME')?.status_value || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Lane Assigned</p>
                              <p className={classNames('font-bold',
                                (s as any).shipment_statuses?.find((st: any) => st.status_type === 'ATTR:LANE ASSIGNED')?.status_value === 'Green' ? 'text-emerald-600' :
                                  (s as any).shipment_statuses?.find((st: any) => st.status_type === 'ATTR:LANE ASSIGNED')?.status_value === 'Yellow' ? 'text-amber-600' :
                                    (s as any).shipment_statuses?.find((st: any) => st.status_type === 'ATTR:LANE ASSIGNED')?.status_value === 'Red' ? 'text-rose-600' : 'text-slate-700'
                              )}>{(s as any).shipment_statuses?.find((st: any) => st.status_type === 'ATTR:LANE ASSIGNED')?.status_value || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Exit Note</p>
                              <p className="text-slate-700">{(s as any).shipment_statuses?.find((st: any) => st.status_type === 'ATTR:CUSTOMS EXIT NOTE')?.status_value || '—'}</p>
                            </div>
                          </div>

                          {/* ASSIGNED UNITS SECTION */}
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Assigned Customs Units</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {((s as any).shipment_statuses || []).filter((st: any) => !st.status_type.startsWith('ATTR:')).map((st: any) => {
                                const isPending = st.status_value.toUpperCase().includes('PENDING');
                                const isQueried = st.status_value.toUpperCase().includes('QUERY') || st.status_value.toUpperCase().includes('QUERIED');
                                const dateStr = ((s as any).shipment_statuses || []).find((d: any) => d.status_type === `ATTR:DATE:${st.status_type}`)?.status_value;
                                const isOverdue = isPending && dateStr && (Date.now() - new Date(dateStr).getTime() > 4 * 60 * 60 * 1000);
                                return (
                                  <div key={st.status_type} className={classNames('flex justify-between items-center bg-white p-2.5 rounded-lg border shadow-sm', (isOverdue || isQueried) ? 'border-red-200 bg-red-50/50' : 'border-slate-100')}>
                                    <span className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
                                      {(isOverdue || isQueried) && <span title={isQueried ? 'Queried' : 'Pending > 4hrs'} className="flex"><AlertTriangle size={14} className="text-red-500" /></span>}
                                      {st.status_type}
                                    </span>
                                    <span className={classNames('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                                      st.status_value.toUpperCase().includes('APPROVED') || st.status_value.toUpperCase().includes('COMPLETED') || st.status_value.toUpperCase().includes('GENERATED') ? 'bg-emerald-100 text-emerald-700' :
                                        isQueried || isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    )}>{st.status_value}</span>
                                  </div>
                                )
                              })}
                              {((s as any).shipment_statuses || []).filter((st: any) => !st.status_type.startsWith('ATTR:')).length === 0 && (
                                <p className="text-slate-500 italic text-sm">No units assigned yet.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddForm && (
        <AddShipmentModal
          importers={importers}
          onClose={() => setShowAddForm(false)}
          onAdded={() => { setShowAddForm(false); loadShipments(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Add Shipment Modal
// ─────────────────────────────────────────────
function AddShipmentModal({ importers, onClose, onAdded }: { importers: Profile[]; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ importer_id: '', office_code: 'JMKCT', year: '2026', commercial_reference: '', trn: '', tracking_role: 'Declarant' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('shipments').insert({
      importer_id: form.importer_id || null,
      office_code: form.office_code,
      year: form.year,
      commercial_reference: form.commercial_reference,
      trn: form.trn,
      tracking_role: form.tracking_role,
      status: 'Pending',
    });

    if (insertError) { setError(insertError.message); setSubmitting(false); return; }
    onAdded();
  }

  const offices = [
    { code: 'JMKCT', name: 'Kingston Container Terminal' },
    { code: 'JMKWL', name: 'Kingston Wharves' },
    { code: 'JMMBJ', name: 'Sangster International' },
    { code: 'JMNMJ', name: 'Norman Manley International' },
    { code: 'JMPCU', name: 'Port Customs Unit' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        <h3 className="text-xl font-bold text-slate-900 mb-6">Track New Shipment</h3>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Assign to Client</label>
            <select value={form.importer_id} onChange={e => setForm({ ...form, importer_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select Client —</option>
              {importers.map(imp => <option key={imp.id} value={imp.id}>{imp.company_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Office</label>
              <select value={form.office_code} onChange={e => setForm({ ...form, office_code: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {offices.map(o => <option key={o.code} value={o.code}>{o.code} - {o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Year</label>
              <input type="text" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Commercial Reference</label>
            <input type="text" placeholder="e.g. CBJ286" required value={form.commercial_reference}
              onChange={e => setForm({ ...form, commercial_reference: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">TRN</label>
            <input type="text" placeholder="e.g. 1203709130000" required value={form.trn}
              onChange={e => setForm({ ...form, trn: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm({ ...form, tracking_role: 'Declarant' })}
                className={classNames('flex-1 py-2 rounded-lg text-sm font-medium border transition',
                  form.tracking_role === 'Declarant' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200')}>
                Declarant
              </button>
              <button type="button" onClick={() => setForm({ ...form, tracking_role: 'Importer' })}
                className={classNames('flex-1 py-2 rounded-lg text-sm font-medium border transition',
                  form.tracking_role === 'Importer' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200')}>
                Importer
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Importer Dashboard
// ─────────────────────────────────────────────
function ImporterDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ShipmentStatus[]>>({});
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadMyShipments();
  }, []);

  async function loadMyShipments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get profile
    const { data: profile } = await supabase.from('profiles').select('company_name').eq('id', user.id).single();
    if (profile) setCompanyName(profile.company_name);

    // Get my shipments
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('importer_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setShipments(data);
      // Load statuses for each
      for (const s of data) {
        const { data: statusData } = await supabase
          .from('shipment_statuses')
          .select('*')
          .eq('shipment_id', s.id)
          .order('created_at', { ascending: true });
        if (statusData) {
          setStatuses(prev => ({ ...prev, [s.id]: statusData }));
        }
      }
    }
    if (error) console.error(error);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome, {companyName}</h2>
          <p className="text-slate-500">Here is the real-time status of your declarations.</p>
        </div>
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold border border-slate-200 text-sm">
          {companyName.substring(0, 2).toUpperCase()}
        </div>
      </header>

      <h3 className="font-semibold text-lg mb-4 text-slate-800">Your Monitored Shipments</h3>

      {shipments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <PackageOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">No shipments assigned to you yet.</p>
          <p className="text-sm mt-1">Your broker will add tracking entries for you.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {shipments.map((shipment) => (
            <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded text-sm font-medium border border-slate-200">
                      {shipment.commercial_reference}
                    </span>
                    <StatusBadge status={shipment.status} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{shipment.office_code}</h4>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock size={14} />
                    {shipment.last_scraped_at
                      ? `Last updated from customs: ${new Date(shipment.last_scraped_at).toLocaleString()}`
                      : 'Awaiting first scrape...'}
                  </p>
                </div>

              </div>

              {/* Details Accordion Button */}
              <button
                onClick={() => setExpandedId(expandedId === shipment.id ? null : shipment.id)}
                className="mt-4 text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                {expandedId === shipment.id ? <><ChevronUp size={16} /> Hide Details</> : <><ChevronDown size={16} /> View Declaration Details</>}
              </button>

              {expandedId === shipment.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Customs Ref</p>
                    <p className="font-mono text-slate-700">{shipment.customs_reference || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Lane Assigned</p>
                    <p className={classNames('font-bold',
                      statuses[shipment.id]?.find(st => st.status_type === 'ATTR:LANE ASSIGNED')?.status_value === 'Green' ? 'text-emerald-600' :
                        statuses[shipment.id]?.find(st => st.status_type === 'ATTR:LANE ASSIGNED')?.status_value === 'Yellow' ? 'text-amber-600' :
                          statuses[shipment.id]?.find(st => st.status_type === 'ATTR:LANE ASSIGNED')?.status_value === 'Red' ? 'text-rose-600' : 'text-slate-700'
                    )}>{statuses[shipment.id]?.find(st => st.status_type === 'ATTR:LANE ASSIGNED')?.status_value || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Customs Release</p>
                    <p className="text-slate-700">{statuses[shipment.id]?.find(st => st.status_type === 'ATTR:CUSTOMS RELEASE')?.status_value || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Exit Note Status</p>
                    <p className="text-slate-700">{statuses[shipment.id]?.find(st => st.status_type === 'ATTR:CUSTOMS EXIT NOTE')?.status_value || '—'}</p>
                  </div>

                  {/* ASSIGNED UNITS SECTION */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Assigned Customs Units</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(statuses[shipment.id] || []).filter(st => !st.status_type.startsWith('ATTR:')).map(st => {
                        const isPending = st.status_value.toUpperCase().includes('PENDING');
                        const isQueried = st.status_value.toUpperCase().includes('QUERY') || st.status_value.toUpperCase().includes('QUERIED');
                        const dateStr = (statuses[shipment.id] || []).find((d) => d.status_type === `ATTR:DATE:${st.status_type}`)?.status_value;
                        const isOverdue = isPending && dateStr && (Date.now() - new Date(dateStr).getTime() > 4 * 60 * 60 * 1000);
                        return (
                          <div key={st.status_type} className={classNames('flex justify-between items-center p-2.5 rounded-lg border', (isOverdue || isQueried) ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50')}>
                            <span className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
                              {(isOverdue || isQueried) && <span title={isQueried ? 'Queried' : 'Pending > 4hrs'} className="flex"><AlertTriangle size={14} className="text-red-500" /></span>}
                              {st.status_type}
                            </span>
                            <span className={classNames('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                              st.status_value.toUpperCase().includes('APPROVED') || st.status_value.toUpperCase().includes('COMPLETED') || st.status_value.toUpperCase().includes('GENERATED') ? 'bg-emerald-100 text-emerald-700' :
                                isQueried || isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            )}>{st.status_value}</span>
                          </div>
                        )
                      })}
                      {(statuses[shipment.id] || []).filter(st => !st.status_type.startsWith('ATTR:')).length === 0 && (
                        <p className="text-slate-500 italic text-sm">No units assigned yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────
function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">{icon}</div>
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Released: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Release Ready': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Pending: 'bg-slate-100 text-slate-700 border-slate-200',
    Assessment: 'bg-blue-100 text-blue-700 border-blue-200',
    'Assessment Notice Need to be Paid': 'bg-orange-100 text-orange-700 border-orange-200',
    'Not Valid': 'bg-rose-100 text-rose-700 border-rose-200',
    Queried: 'bg-rose-100 text-rose-700 border-rose-200',
  }[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={classNames('px-2.5 py-1 text-xs font-semibold rounded-full border', styles)}>
      {status}
    </span>
  );
}
