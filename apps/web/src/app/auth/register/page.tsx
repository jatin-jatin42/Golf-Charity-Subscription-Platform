'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    charityId: '',
    charityPercent: 10,
  });
  const [charities, setCharities] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    // Load charities for the dropdown
    api.charities.all().then(setCharities).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'charityPercent' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.charityPercent < 10 || formData.charityPercent > 100) {
      setError('Charity contribution must be between 10% and 100%.');
      return;
    }

    setLoading(true);

    try {
      await register({
        ...formData,
        charityId: formData.charityId || undefined,
      });
      // After successful registration, the AuthContext redirects to /dashboard.
      // In a real app, if planParam exists, we might redirect straight to checkout.
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={`card ${styles.authCard}`}>
        <div className={styles.authHeader}>
          <div className="nav-logo" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)', justifyContent: 'center' }}>
            <span style={{ WebkitTextFillColor: 'initial' }}>⛳</span> GolfCharity
          </div>
          <h1 className="font-display text-2xl font-bold">Create Account</h1>
          <p className="text-muted text-sm mt-xs">
            {planParam ? `Register to start your ${planParam.toLowerCase()} plan` : 'Join the platform that gives back'}
          </p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Min 8 characters"
              minLength={8}
            />
          </div>

          <div className="divider" style={{ margin: 'var(--space-md) 0' }} />

          <div className="form-group">
            <label className="form-label">Select Charity to Support (Optional)</label>
            <select
              name="charityId"
              className="form-input form-select"
              value={formData.charityId}
              onChange={handleChange}
            >
              <option value="">I'll decide later</option>
              {charities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {formData.charityId && (
             <div className="form-group mt-sm">
             <label className="form-label">Contribution % (Min 10%)</label>
               <input
                 type="number"
                 name="charityPercent"
                 className="form-input"
                 value={formData.charityPercent}
                 onChange={handleChange}
                 min={10}
                 max={100}
                 required
               />
               <p className="text-xs text-muted mt-xs">
                 This percentage of your subscription fee goes directly to the charity.
               </p>
             </div>
          )}

          <button type="submit" className="btn btn-primary w-full mt-lg" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Account'}
          </button>
        </form>

        <p className={styles.authFooter}>
          Already have an account?{' '}
          <Link href="/auth/login" className="gradient-text-gold font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
