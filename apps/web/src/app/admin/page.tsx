'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

type Tab = 'overview' | 'users' | 'charities' | 'winners';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Data States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [charities, setCharities] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalType, setModalType] = useState<'charity' | 'user' | 'scores' | 'verify' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [userScores, setUserScores] = useState<any[]>([]);

  // Form States
  const [charityForm, setCharityForm] = useState({ name: '', description: '', imageUrl: '', category: '' });
  const [userForm, setUserForm] = useState({ name: '', charityId: '', charityPercent: 10 });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Step 1: Fetch overview first (Most critical for UI render)
      const overview = await api.reports.overview();
      setOverviewData(overview);

      // Step 2: Fetch supporting data in a separate batch
      const [charData, winnersData, usersData] = await Promise.all([
        api.charities.all(),
        api.winners.all(),
        api.users.all(),
      ]);
      
      setCharities(charData as any[]);
      setWinners(winnersData as any[]);
      setUsers(usersData as any[]);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────
  const openUserEdit = (u: any) => {
    setSelectedItem(u);
    setUserForm({
      name: u.name,
      charityId: u.charityId || '',
      charityPercent: u.charityPercent || 10
    });
    setModalType('user');
  };

  const handleUpdateUser = async () => {
    try {
      await api.users.update(selectedItem.id, userForm);
      alert('User updated!');
      setModalType(null);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const openManageScores = async (u: any) => {
    setSelectedItem(u);
    try {
      const scores = await api.scores.adminGet(u.id) as any[];
      setUserScores(scores);
      setModalType('scores');
    } catch (err: any) { alert('Failed to load scores: ' + err.message); }
  };

  const handleUpdateScore = async (scoreId: string, newValue: number) => {
    try {
      await api.scores.adminUpdate(scoreId, { value: newValue });
      const updated = await api.scores.adminGet(selectedItem.id) as any[];
      setUserScores(updated);
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateCharity = async () => {
    try {
      if (selectedItem) {
        await api.charities.update(selectedItem.id, charityForm);
      } else {
        await api.charities.create(charityForm);
      }
      setModalType(null);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleSimulateDraw = async (id: string) => {
    try {
      await api.draws.simulate(id);
      alert('Draw simulated!');
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handlePublishDraw = async (id: string) => {
    if (!confirm('Publish results? This cannot be undone.')) return;
    try {
      await api.draws.publish(id);
      alert('Draw published!');
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleVerifyWinner = async (id: string, status: string) => {
    try {
      await api.winners.verify(id, status);
      alert(`Winner ${status.toLowerCase()}!`);
      setModalType(null);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.winners.markPaid(id);
      alert('Payout completed!');
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  if (authLoading || loading) return <div className="container mt-3xl text-center"><div className="spinner mx-auto" /></div>;

  return (
    <div className={styles.adminPage}>
      <div className="container">
        
        <header className={styles.header}>
          <div>
            <span className="badge badge-active mb-sm">Premium Admin Interface</span>
            <h1 className="font-display text-4xl font-bold">Platform Control</h1>
          </div>
          <p className="text-secondary text-sm">Welcome back, {user?.name}</p>
        </header>

        {/* Tabs Navigation */}
        <nav className={styles.tabsNav}>
          <button onClick={() => setActiveTab('overview')} className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}>Dashboard Overview</button>
          <button onClick={() => setActiveTab('users')} className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}>User Management</button>
          <button onClick={() => setActiveTab('charities')} className={`${styles.tabBtn} ${activeTab === 'charities' ? styles.tabActive : ''}`}>Charity Directory</button>
          <button onClick={() => setActiveTab('winners')} className={`${styles.tabBtn} ${activeTab === 'winners' ? styles.tabActive : ''}`}>Verification Queue</button>
        </nav>

        {/* ── Content Sections ───────────────────────────────── */}
        
        {activeTab === 'overview' && overviewData && (
          <div className="animate-fade-up">
            <div className={styles.kpiGrid}>
              <div className="card card-glow-gold">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Monthly Prize Pool</p>
                <p className="font-display text-3xl font-bold mt-sm gradient-text-gold">₹{overviewData.prizes.monthlyPool}</p>
                <p className="text-xs text-secondary mt-xs">50% of subscriptions</p>
              </div>
              <div className="card">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Active Subscribers</p>
                <p className="font-display text-3xl font-bold mt-sm">{overviewData.users.activeSubscribers}</p>
                <p className="text-xs text-secondary mt-xs">{overviewData.users.total} total members</p>
              </div>
              <div className="card card-glow-green">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Charity Impact</p>
                <p className="font-display text-3xl font-bold mt-sm text-success">₹{overviewData.charity.totalContributions}</p>
                <p className="text-xs text-secondary mt-xs">Total fundraising</p>
              </div>
              <div className="card">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Conversion</p>
                <p className="font-display text-3xl font-bold mt-sm">{overviewData.users.conversionRate}%</p>
                <p className="text-xs text-secondary mt-xs">Free to Paid ratio</p>
              </div>
            </div>

            <section className="card">
              <h2 className="font-display text-2xl font-bold mb-lg">Draw Management Engine</h2>
              <div className={styles.drawsList}>
                {overviewData.draws.recentStats.map((d: any) => (
                  <div key={d.id} className={styles.drawRow}>
                    <div>
                      <h3 className="font-bold underline decoration-accent decoration-2 underline-offset-4">
                        {new Date(d.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex gap-sm mt-sm">
                         <span className={`badge ${d.status === 'PUBLISHED' ? 'badge-published' : d.status === 'SIMULATED' ? 'badge-active' : 'badge-pending'}`}>
                           {d.status}
                         </span>
                         <span className="text-xs text-muted mt-0.5">Entries: {d._count.entries}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-muted uppercase font-semibold">Prize / Jackpot</p>
                       <p className="font-display font-bold gradient-text-gold">₹{d.prizePool} / ₹{d.jackpotPool}</p>
                    </div>
                    <div className={styles.drawActions}>
                       {d.status === 'PENDING' && <button onClick={() => handleSimulateDraw(d.id)} className="btn btn-secondary btn-sm">Simulate</button>}
                       {d.status === 'SIMULATED' && <button onClick={() => handlePublishDraw(d.id)} className="btn btn-primary btn-sm">Publish Results</button>}
                       {d.status === 'PUBLISHED' && <span className="text-xs font-bold text-muted uppercase">Results Live</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-up">
            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Subscription</th>
                    <th>Charity Support</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className={styles.userCell}>
                          <span className="font-bold">{u.name}</span>
                          <span className="email">{u.email}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-inactive">{u.role}</span></td>
                      <td>
                        {u.subscription ? (
                          <div className={styles.userCell}>
                             <span className="font-semibold text-green">{u.subscription.plan}</span>
                             <span className="email">Expires: {new Date(u.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                          </div>
                        ) : <span className="text-muted italic">None</span>}
                      </td>
                      <td>
                        {u.charity ? (
                          <div className={styles.userCell}>
                             <span>{u.charity.name}</span>
                             <span className="email">Share: {u.charityPercent}%</span>
                          </div>
                        ) : 'Not set'}
                      </td>
                      <td className={styles.actionsCell}>
                        <button onClick={() => openUserEdit(u)} className="btn btn-ghost btn-sm">Edit Profile</button>
                        <button onClick={() => openManageScores(u)} className="btn btn-secondary btn-sm">Manage Scores</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'charities' && (
          <div className="animate-fade-up">
            <div className="flex justify-between items-center mb-md">
              <h2 className="font-display text-xl font-bold">Supported Organizations</h2>
              <button onClick={() => { setModalType('charity'); setSelectedItem(null); setCharityForm({ name: '', description: '', imageUrl: '', category: '' }); }} className="btn btn-primary btn-sm">+ Add New Charity</button>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Name / Image</th>
                    <th>Subscribers Supporting</th>
                    <th>Total Raised (EST)</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charities.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-sm">
                           <img src={c.imageUrl || 'https://via.placeholder.com/40'} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                           <span className="font-bold">{c.name}</span>
                        </div>
                      </td>
                      <td>{c._count?.users || 0} Members</td>
                      <td className="text-success font-bold font-display">₹{c.totalRaised || 0}</td>
                      <td className={styles.actionsCell}>
                        <button onClick={() => { setModalType('charity'); setSelectedItem(c); setCharityForm({ name: c.name, description: c.description, imageUrl: c.imageUrl || '', category: c.category || '' }); }} className="btn btn-ghost btn-sm">Edit</button>
                        <button onClick={() => { if(confirm('Delete charity?')) api.charities.delete(c.id).then(loadData); }} className="btn btn-danger btn-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'winners' && (
          <div className="animate-fade-up">
            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Winner</th>
                    <th>Draw Month</th>
                    <th>Prize Category</th>
                    <th>Amount</th>
                    <th>Verification</th>
                    <th className="text-right">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map(w => (
                    <tr key={w.id}>
                      <td className="font-bold">{w.user.name}</td>
                      <td>{new Date(w.draw.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                      <td><span className="badge badge-active">{w.tier}</span></td>
                      <td className="font-bold gradient-text-gold">₹{w.amount}</td>
                      <td>
                        {w.verifyStatus === 'PENDING' ? (
                          <button onClick={() => { setModalType('verify'); setSelectedItem(w); }} className="btn btn-secondary btn-sm">Review Proof</button>
                        ) : (
                          <span className={`badge ${w.verifyStatus === 'APPROVED' ? 'badge-published' : 'badge-inactive'}`}>{w.verifyStatus}</span>
                        )}
                      </td>
                      <td className="text-right">
                        {w.payStatus === 'PENDING' ? (
                          <button 
                            disabled={w.verifyStatus !== 'APPROVED'} 
                            onClick={() => handleMarkPaid(w.id)} 
                            className="btn btn-primary btn-sm"
                          >
                            Mark Paid
                          </button>
                        ) : <span className="text-success font-bold">PAID</span>}
                      </td>
                    </tr>
                  ))}
                  {winners.length === 0 && <tr><td colSpan={6} className="text-center py-xl text-muted italic">No winners recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      
      {modalType === 'user' && selectedItem && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <h3 className="font-bold">Edit User: {selectedItem.email}</h3>
               <button onClick={() => setModalType(null)} className="btn btn-ghost">✕</button>
             </div>
             <div className={styles.modalBody}>
                <div className="form-group mb-md">
                  <label>Full Name</label>
                  <input type="text" className="form-input" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                </div>
                <div className="form-group mb-md">
                  <label>Charity Contribution (%)</label>
                  <input type="number" className="form-input" value={userForm.charityPercent} onChange={e => setUserForm({...userForm, charityPercent: Number(e.target.value)})} min={10} max={100} />
                </div>
                <div className="form-group">
                  <label>Selected Charity</label>
                  <select className="form-input" value={userForm.charityId} onChange={e => setUserForm({...userForm, charityId: e.target.value})}>
                     <option value="">None / Decide Later</option>
                     {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
             </div>
             <div className={styles.modalFooter}>
                <button onClick={() => setModalType(null)} className="btn btn-ghost">Cancel</button>
                <button onClick={handleUpdateUser} className="btn btn-primary">Save Changes</button>
             </div>
           </div>
        </div>
      )}

      {modalType === 'scores' && selectedItem && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <h3 className="font-bold">Latest Scores: {selectedItem.name}</h3>
               <button onClick={() => setModalType(null)} className="btn btn-ghost">✕</button>
             </div>
             <div className={styles.modalBody}>
                <p className="text-sm text-muted mb-lg">Maintain data integrity by correcting score entries if required.</p>
                <div className="flex flex-col gap-sm">
                   {userScores.map((s: any) => (
                      <div key={s.id} className="flex justify-between items-center bg-surface-2 p-sm rounded-lg border border-subtle">
                         <span>{new Date(s.date).toLocaleDateString()}</span>
                         <div className="flex gap-sm">
                            <input 
                              type="number" 
                              className="form-input text-center" 
                              style={{ width: 60, padding: '0.2rem' }}
                              defaultValue={s.value}
                              onBlur={(e) => handleUpdateScore(s.id, Number(e.target.value))}
                            />
                            <button onClick={() => api.scores.delete(s.id).then(() => openManageScores(selectedItem))} className="btn btn-ghost btn-sm text-error">✕</button>
                         </div>
                      </div>
                   ))}
                   {userScores.length === 0 && <p className="text-center py-md italic text-muted">No scores recorded for this user.</p>}
                </div>
             </div>
             <div className={styles.modalFooter}>
                <button onClick={() => setModalType(null)} className="btn btn-primary">Done</button>
             </div>
           </div>
        </div>
      )}

      {modalType === 'charity' && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <h3 className="font-bold">{selectedItem ? 'Edit Charity' : 'Add New Charity'}</h3>
               <button onClick={() => setModalType(null)} className="btn btn-ghost">✕</button>
             </div>
             <div className={styles.modalBody}>
                <div className="form-group mb-md">
                  <label>Charity Name</label>
                  <input type="text" className="form-input" value={charityForm.name} onChange={e => setCharityForm({...charityForm, name: e.target.value})} />
                </div>
                <div className="form-group mb-md">
                  <label>Logo URL</label>
                  <input type="text" className="form-input" value={charityForm.imageUrl} onChange={e => setCharityForm({...charityForm, imageUrl: e.target.value})} />
                </div>
                <div className="form-group mb-md">
                   <label>Category</label>
                   <input type="text" placeholder="e.g. Health, Education" className="form-input" value={charityForm.category} onChange={e => setCharityForm({...charityForm, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows={4} value={charityForm.description} onChange={e => setCharityForm({...charityForm, description: e.target.value})} />
                </div>
             </div>
             <div className={styles.modalFooter}>
                <button onClick={() => setModalType(null)} className="btn btn-ghost">Cancel</button>
                <button onClick={handleCreateCharity} className="btn btn-primary">{selectedItem ? 'Update' : 'Create'}</button>
             </div>
           </div>
        </div>
      )}

      {modalType === 'verify' && selectedItem && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <h3 className="font-bold">Verify Winner: {selectedItem.user.name}</h3>
               <button onClick={() => setModalType(null)} className="btn btn-ghost">✕</button>
             </div>
             <div className={styles.modalBody}>
                <p className="text-sm text-muted mb-md">Check the golfer's score card screenshot before approving the payout.</p>
                {selectedItem.proofUrl ? (
                   <img src={selectedItem.proofUrl} alt="Winner Proof" className="w-full rounded-lg border border-default" style={{ maxHeight: 300, objectFit: 'contain' }} />
                ) : <div className="p-xl bg-surface-3 rounded-lg text-center text-muted italic">No proof uploaded yet.</div>}
             </div>
             <div className={styles.modalFooter}>
                <button onClick={() => handleVerifyWinner(selectedItem.id, 'REJECTED')} className="btn btn-danger">Reject</button>
                <button onClick={() => handleVerifyWinner(selectedItem.id, 'APPROVED')} className="btn btn-primary" disabled={!selectedItem.proofUrl}>Approve Verification</button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
