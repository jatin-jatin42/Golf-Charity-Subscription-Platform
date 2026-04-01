'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.content}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⛳</span>
          <span>GolfCharity</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className={styles.links}>
          <Link
            href="/charities"
            className={`${styles.link} ${pathname.startsWith('/charities') ? styles.active : ''}`}
          >
            Charities
          </Link>
          <Link
            href="/#how-it-works"
            className={styles.link}
          >
            How It Works
          </Link>
          <Link
            href="/#pricing"
            className={styles.link}
          >
            Pricing
          </Link>
        </div>

        {/* Auth Controls */}
        <div className={styles.actions}>
          {loading ? (
            <div className="spinner" />
          ) : user ? (
            <>
              {user.role === 'ADMIN' ? (
                <Link
                  href="/admin"
                  className={`btn btn-ghost btn-sm ${pathname.startsWith('/admin') ? styles.active : ''}`}
                >
                  Admin Panel
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className={`btn btn-ghost btn-sm ${pathname.startsWith('/dashboard') ? styles.active : ''}`}
                >
                  Dashboard
                </Link>
              )}
              <div className={styles.userMenu}>
                <div className={styles.avatar}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={logout} className="btn btn-ghost btn-sm">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
