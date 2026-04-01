'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [scores, setScores] = useState<any[]>([]);
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreValue, setScoreValue] = useState('');
  const [scoreDate, setScoreDate] = useState('');
  const [scoreError, setScoreError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.scores.mine(),
      api.draws.myParticipation(),
    ])
      .then(([sData, dData]) => {
        setScores(sData as any[]);
        setDraws(dData as any[]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setScoreError('');
    const val = parseInt(scoreValue, 10);
    if (isNaN(val) || val < 1 || val > 45) {
      setScoreError('Score must be between 1 and 45.');
      return;
    }
    if (!scoreDate) {
      setScoreError('Please select a date.');
      return;
    }

    try {
      await api.scores.add(val, scoreDate);
      // Refresh scores data
      const newScores = await api.scores.mine() as any[];
      setScores(newScores);
      setScoreValue('');
      setScoreDate('');
    } catch (err: any) {
      setScoreError(err.message || 'Failed to add score.');
    }
  };

  const handleCheckout = async (plan: string) => {
    try {
      // Step 1: Create order on backend
      const order = await api.subscriptions.createOrder(plan) as any;

      // Step 2: Load Razorpay SDK and open checkout modal
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Golf Charity Platform',
          description: order.description,
          order_id: order.orderId,
          prefill: {
            name: order.userName,
            email: order.userEmail,
          },
          theme: { color: '#40916C' },
          handler: async (response: any) => {
            // Step 3: Verify on backend & activate subscription
            try {
              await api.subscriptions.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
              });
              alert('🎉 Subscription activated successfully! Welcome aboard!');
              window.location.reload();
            } catch {
              alert('Payment received but verification failed. Contact support.');
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
    } catch (err) {
      alert('Could not initiate checkout. Please try again later.');
    }
  };

  if (!user) {
    return (
      <div className="container mt-3xl text-center">
        <h2>Please sign in to view your dashboard.</h2>
        <Link href="/auth/login" className="btn btn-primary mt-md">Sign In</Link>
      </div>
    );
  }

  const isSubscribed = user.subscription?.status === 'ACTIVE';

  return (
    <div className={styles.dashboard}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <h1 className="font-display text-3xl font-bold">Hello, {user.name}</h1>
            <p className="text-secondary mt-xs">Welcome to your Golf Charity Dashboard</p>
          </div>
          <div className={styles.statusBadge}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
            <div className={`badge mt-xs ${isSubscribed ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
              {isSubscribed ? 'Active Subscriber' : 'No Active Subscription'}
            </div>
          </div>
        </header>

        {!isSubscribed && (
          <div className={`card ${styles.subscribePrompt} card-glow-gold mb-xl`}>
            <div>
              <h2 className="text-xl font-bold gradient-text-gold">Activate Your Subscription</h2>
              <p className="text-muted mt-sm" style={{ maxWidth: 500 }}>
                You need an active subscription to participate in prize draws and support your charity.
              </p>
            </div>
            <div className={styles.planButtons}>
               <button onClick={() => handleCheckout('MONTHLY')} className="btn btn-secondary">£20/mo</button>
               <button onClick={() => handleCheckout('YEARLY')} className="btn btn-primary">£180/yr (Save 25%)</button>
            </div>
          </div>
        )}

        <div className={styles.grid}>
          {/* Main Column */}
          <div className={styles.mainCol}>
            
            {/* Scores Section */}
            <section className="card mb-lg">
              <div className="flex justify-between items-center mb-md">
                <h2 className="font-display text-xl font-bold">Your Latest Scores</h2>
                <span className="text-xs text-muted">Rolling 5 (Stableford)</span>
              </div>
              
              <div className={styles.scoresList}>
                {scores.length === 0 ? (
                  <p className="text-muted text-center py-md">No scores entered yet.</p>
                ) : (
                  scores.map((s: any) => (
                    <div key={s.id} className={styles.scoreItem}>
                       <div className="score-ball matched">{s.value}</div>
                       <span className="text-secondary text-sm">
                         {new Date(s.date).toLocaleDateString()}
                       </span>
                    </div>
                  ))
                )}
              </div>

              <div className="divider" style={{ margin: 'var(--space-lg) 0' }} />

              <form onSubmit={handleAddScore} className={styles.addScoreForm}>
                 <h3 className="text-sm font-semibold mb-sm">Add New Score</h3>
                 {scoreError && <p className="text-error text-xs mb-xs">{scoreError}</p>}
                 
                 <div className="flex gap-sm">
                   <div style={{ flex: 1 }}>
                     <input
                       type="number"
                       className="form-input"
                       placeholder="Score (1-45)"
                       value={scoreValue}
                       onChange={(e) => setScoreValue(e.target.value)}
                       min={1} max={45} required
                     />
                   </div>
                   <div style={{ flex: 1 }}>
                     <input
                       type="date"
                       className="form-input"
                       value={scoreDate}
                       onChange={(e) => setScoreDate(e.target.value)}
                       required
                     />
                   </div>
                   <button type="submit" className="btn btn-green">Add</button>
                 </div>
                 <p className="text-xs text-muted mt-xs">Adding a 6th score automatically removes your oldest.</p>
              </form>
            </section>

            {/* Draw History Section */}
            <section className="card">
              <h2 className="font-display text-xl font-bold mb-md">Draw Participation</h2>
              {draws.length === 0 ? (
                 <p className="text-muted text-center py-md">You haven't participated in any draws yet.</p>
              ) : (
                <div className="flex flex-col gap-sm">
                  {draws.map((d: any) => (
                    <div key={d.id} className={styles.drawHistoryItem}>
                      <div>
                        <div className="font-semibold">
                          {new Date(d.draw.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-muted mt-xs">
                          {d.draw.status === 'PUBLISHED' ? `Matched: ${d.matchCount}` : 'Pending Draw'}
                        </div>
                      </div>
                      <div className="flex items-center gap-xs">
                         {d.draw.status === 'PUBLISHED' && d.matchCount >= 3 ? (
                           <span className="badge badge-gold">Winner!</span>
                         ) : (
                           <span className={`badge ${d.draw.status === 'PUBLISHED' ? 'badge-inactive' : 'badge-pending'}`}>
                             {d.draw.status}
                           </span>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Column */}
          <div className={styles.sideCol}>
             {/* Charity Spot */}
             <div className="card card-glass">
                <h3 className="text-sm font-bold text-muted uppercase tracking-wide mb-md">My Charity</h3>
                {user.charity ? (
                  <div className="text-center">
                    {user.charity.imageUrl && (
                       <img 
                         src={user.charity.imageUrl} 
                         alt={user.charity.name} 
                         className={styles.charityImage} 
                       />
                    )}
                    <h4 className="font-bold text-lg mt-sm">{user.charity.name}</h4>
                    <p className="gradient-text-gold font-display text-2xl font-bold mt-sm">
                      {user.charityPercent}%
                    </p>
                    <p className="text-xs text-muted">of subscription</p>
                  </div>
                ) : (
                  <div className="text-center py-md">
                    <p className="text-muted text-sm mb-md">You haven't selected a charity yet.</p>
                    <Link href="/charities" className="btn btn-ghost btn-sm">Browse Charities</Link>
                  </div>
                )}
             </div>

             {/* Dev Note: Missing Profile link for brevity */}
          </div>
        </div>

      </div>
    </div>
  );
}
