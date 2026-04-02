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
  const [modalType, setModalType] = useState<'charity' | 'user' | 'verify' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
      const [overview, charData, winnersData, usersData] = await Promise.all([
        api.reports.overview(),
        api.charities.all(),
        api.winners.all(),
        api.users.all(),
      ]);
      setOverviewData(overview);
      setCharities(charData as any[]);
      setWinners(winnersData as any[]);
      setUsers(usersData as any[]);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────
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

  const handleDeleteCharity = async (id: string) => {
    if (!confirm('Delete this charity?')) return;
    try {
      await api.charities.delete(id);
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
                             <span className="email">Expires: {new Date(u.subscription.endDate).toLocaleDateString()}</span>
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
                        <button className="btn btn-ghost btn-sm">Edit Profile</button>
                        <button className="btn btn-secondary btn-sm">Manage Scores</button>
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
              <button onClick={() => { setModalType('charity'); setSelectedItem(null); }} className="btn btn-primary btn-sm">+ Add New Charity</button>
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
                        <button className="btn btn-ghost btn-sm">Edit</button>
                        <button onClick={() => handleDeleteCharity(c.id)} className="btn btn-danger btn-sm">Delete</button>
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
                      <td><span className="badge badge-active">{w.prizeTier} Match</span></td>
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
                  {winners.length === 0 && <tr><td colSpan={6} className="text-center py-xl text-muted italic">No winners recorded in system memory.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      
      {modalType === 'verify' && selectedItem && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalContent}>
             <div className={styles.modalHeader}>
               <h3 className="font-bold">Verify Winner: {selectedItem.user.name}</h3>
               <button onClick={() => setModalType(null)} className="btn btn-ghost">✕</button>
             </div>
             <div className={styles.modalBody}>
                <p className="text-sm text-muted mb-md">Check the golfer's score card screenshot before approving the payout.</p>
                {selectedItem.proofImageUrl ? (
                   <img src={selectedItem.proofImageUrl} alt="Winner Proof" className="w-full rounded-lg border border-default" style={{ maxHeight: 300, objectFit: 'contain' }} />
                ) : <div className="p-xl bg-surface-3 rounded-lg text-center text-muted italic">No proof uploaded yet.</div>}
             </div>
             <div className={styles.modalFooter}>
                <button onClick={() => handleVerifyWinner(selectedItem.id, 'REJECTED')} className="btn btn-danger">Reject</button>
                <button onClick={() => handleVerifyWinner(selectedItem.id, 'APPROVED')} className="btn btn-primary" disabled={!selectedItem.proofImageUrl}>Approve Verification</button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
