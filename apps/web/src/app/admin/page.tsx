'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    api.reports.overview()
      .then(setData)
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleSimulateDraw = async (drawId: string) => {
    try {
      await api.draws.simulate(drawId);
      alert('Draw simulated successfully!');
      window.location.reload();
    } catch (err: any) {
      alert('Simulation failed: ' + err.message);
    }
  };

  const handlePublishDraw = async (drawId: string) => {
    if (!confirm('Are you sure you want to PUBLISH this draw? This cannot be undone.')) return;
    try {
      await api.draws.publish(drawId);
      alert('Draw published!');
      window.location.reload();
    } catch (err: any) {
      alert('Publish failed: ' + err.message);
    }
  };

  if (loading) return <div className="container mt-3xl text-center"><div className="spinner mx-auto" /></div>;
  if (!data) return null;

  return (
    <div className={styles.adminPage}>
      <div className="container">
        
        <header className={styles.header}>
          <div>
            <span className="badge badge-active mb-sm">Admin Portal</span>
            <h1 className="font-display text-3xl font-bold">Platform Overview</h1>
          </div>
        </header>

        {/* Top KPI Metrics */}
        <div className={styles.kpiGrid}>
          <div className="card">
            <p className="text-sm font-semibold text-muted tracking-wide uppercase">Active Subscribers</p>
            <p className="font-display text-4xl font-bold mt-sm">{data.users.activeSubscribers}</p>
            <p className="text-xs text-secondary mt-xs">Out of {data.users.total} registered ({data.users.conversionRate}%)</p>
          </div>
          <div className="card card-glow-gold">
            <p className="text-sm font-semibold text-muted tracking-wide uppercase border-accent">Monthly Prize Pool</p>
            <p className="font-display text-4xl font-bold mt-sm gradient-text-gold">£{data.prizes.monthlyPool}</p>
            <p className="text-xs text-secondary mt-xs">Funded by 50% of subscriptions</p>
          </div>
          <div className="card card-glow-green">
            <p className="text-sm font-semibold text-muted tracking-wide uppercase">Charity Contributions</p>
            <p className="font-display text-4xl font-bold mt-sm text-success">£{data.charity.totalContributions}</p>
            <p className="text-xs text-secondary mt-xs">Pending transfer to partners</p>
          </div>
          <div className="card">
            <p className="text-sm font-semibold text-muted tracking-wide uppercase">Winners Pending</p>
            <p className="font-display text-4xl font-bold mt-sm">{data.winners.pendingVerification}</p>
            <p className="text-xs text-secondary mt-xs">Awaiting payout processing</p>
          </div>
        </div>

        {/* Draw Management Engine */}
        <section className="card mt-xl">
           <h2 className="font-display text-2xl font-bold mb-md">Draw Engine Status</h2>
           
           <div className={styles.drawsList}>
             {data.draws.recentStats.map((d: any) => (
                <div key={d.id} className={styles.drawRow}>
                  <div>
                    <h3 className="font-bold text-lg">
                      {new Date(d.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-sm mt-xs">
                      <span className={`badge ${d.status === 'PUBLISHED' ? 'badge-published' : d.status === 'SIMULATED' ? 'badge-green' : 'badge-pending'}`}>
                        {d.status}
                      </span>
                      <span className="text-sm text-muted">Entries: {d._count.entries}</span>
                      <span className="text-sm text-muted">Winners: {d._count.winners}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted">Prize Pool / Jackpot</p>
                    <p className="font-bold gradient-text-gold text-xl">£{d.prizePool} / £{d.jackpotPool}</p>
                  </div>

                  <div className={styles.drawActions}>
                     {d.status === 'PENDING' && (
                       <button onClick={() => handleSimulateDraw(d.id)} className="btn btn-secondary btn-sm">Simulate</button>
                     )}
                     {d.status === 'SIMULATED' && (
                       <>
                         <button onClick={() => handleSimulateDraw(d.id)} className="btn btn-ghost btn-sm">Re-Simulate</button>
                         <button onClick={() => handlePublishDraw(d.id)} className="btn btn-primary btn-sm">PUBLISH WINNERS</button>
                       </>
                     )}
                     {d.status === 'PUBLISHED' && (
                       <span className="text-muted text-sm font-semibold">Results Locked</span>
                     )}
                  </div>
                </div>
             ))}
             {data.draws.recentStats.length === 0 && <p className="text-muted py-md text-center">No draws generated yet.</p>}
           </div>
        </section>

      </div>
    </div>
  );
}
