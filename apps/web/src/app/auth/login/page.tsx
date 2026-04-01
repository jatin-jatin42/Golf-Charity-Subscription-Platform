'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
          <h1 className="font-display text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted text-sm mt-xs">Sign in to manage your scores and draws</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-md" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Sign In'}
          </button>
        </form>

        <p className={styles.authFooter}>
          Don't have an account?{' '}
          <Link href="/auth/register" className="gradient-text-gold font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
