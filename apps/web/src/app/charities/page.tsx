'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './charities.module.css';

export default function CharitiesPage() {
  const [charities, setCharities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Fetch categories first
    api.charities.categories().then((cats: any) => setCategories(cats)).catch(() => {});
  }, []);

  useEffect(() => {
    // Fetch charities with filters
    setLoading(true);
    api.charities.all(search, category)
      .then((data: any) => setCharities(data))
      .catch(() => setCharities([]))
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div className={styles.charitiesPage}>
      <div className="container">
        
        {/* Header section with search/filter */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className="section-label mb-sm">Our Partners</div>
            <h1 className="font-display text-4xl font-bold">Supported Charities</h1>
            <p className="text-secondary mt-sm max-w-2xl">
              Meet the incredible organizations making a real difference. Minimum 10% of every subscription 
              is automatically routed to the charity of your choice.
            </p>
          </div>

          <div className={styles.filters}>
            <div className="form-group" style={{ flex: 2 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search charities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <select
                className="form-input form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Charities Grid */}
        {loading ? (
          <div className="text-center py-3xl">
            <div className="spinner mx-auto" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p className="text-muted mt-md tracking-wide uppercase text-sm font-semibold">Loading partners...</p>
          </div>
        ) : charities.length === 0 ? (
          <div className="text-center py-3xl card card-glass">
            <h3 className="font-display text-xl font-bold">No charities found</h3>
            <p className="text-muted mt-sm">Try adjusting your search criteria.</p>
            <button className="btn btn-secondary mt-md" onClick={() => { setSearch(''); setCategory(''); }}>Clear Filters</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {charities.map((charity) => (
              <div key={charity.id} className={`card ${styles.charityCard} ${charity.featured ? styles.featured : ''}`}>
                {charity.featured && <div className={styles.featuredBadge}>⭐ Featured Partner</div>}
                
                {charity.imageUrl ? (
                  <div className={styles.cardImage}>
                    <img src={charity.imageUrl} alt={charity.name} />
                  </div>
                ) : (
                  <div className={styles.cardImagePlaceholder}>
                    <span className="text-2xl opacity-50">❤️</span>
                  </div>
                )}
                
                <div className={styles.cardContent}>
                  <div className="flex justify-between items-start mb-sm">
                    <h2 className="font-bold text-lg">{charity.name}</h2>
                    {charity.category && (
                      <span className="badge badge-active text-xs">{charity.category}</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-secondary line-clamp-3 mb-md" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {charity.description}
                  </p>

                  <div className={styles.cardStats}>
                    <div className="text-center">
                      <p className="font-bold gradient-text-gold">{charity._count?.users || 0}</p>
                      <p className="text-xs text-muted uppercase tracking-wide">Supporters</p>
                    </div>
                  </div>

                  <Link href={`/auth/register?charityId=${charity.id}`} className="btn btn-primary w-full mt-md btn-sm">
                    Support This Charity
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
