'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './page.module.css';

// ── Hero Stats ──────────────────────────────────────────────
const STATS = [
  { value: '£250K+', label: 'Donated to Charity' },
  { value: '4,800+', label: 'Active Members' },
  { value: '36', label: 'Draws Completed' },
  { value: '120+', label: 'Winners Paid Out' },
];

// ── How It Works Steps ──────────────────────────────────────
const STEPS = [
  {
    number: '01',
    icon: '🎯',
    title: 'Subscribe',
    description: 'Choose a monthly or yearly plan. A portion of every subscription directly funds prize pools and charity.',
  },
  {
    number: '02',
    icon: '⛳',
    title: 'Enter Your Scores',
    description: 'Add your last 5 Stableford scores (1–45). The system keeps a rolling record — newest in, oldest out.',
  },
  {
    number: '03',
    icon: '🎲',
    title: 'Monthly Draw',
    description: 'Each month, 5 numbers are drawn. Match 3, 4, or all 5 of your scores to win a share of the prize pool.',
  },
  {
    number: '04',
    icon: '❤️',
    title: 'Give Back',
    description: 'Min 10% of your subscription goes to your chosen charity. Increase your contribution anytime.',
  },
];

// ── Prize Tiers ─────────────────────────────────────────────
const TIERS = [
  {
    match: '5 Numbers',
    label: 'Jackpot',
    share: '40%',
    note: 'Rolls over if unclaimed',
    highlight: true,
    icon: '👑',
  },
  {
    match: '4 Numbers',
    label: 'Major Prize',
    share: '35%',
    note: 'Split equally among winners',
    highlight: false,
    icon: '🥈',
  },
  {
    match: '3 Numbers',
    label: 'Prize',
    share: '25%',
    note: 'Split equally among winners',
    highlight: false,
    icon: '🥉',
  },
];

// ── Pricing Plans ───────────────────────────────────────────
const PLANS = [
  {
    id: 'MONTHLY',
    name: 'Monthly',
    price: '£20',
    period: '/month',
    features: [
      'Full draw participation',
      'Score entry & tracking',
      'Charity contribution (10%+)',
      'Winner dashboard',
      'Monthly draw alerts',
    ],
    cta: 'Start Monthly',
    highlight: false,
  },
  {
    id: 'YEARLY',
    name: 'Yearly',
    price: '£180',
    period: '/year',
    badge: 'Best Value — 25% Off',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Priority draw entry',
      'Exclusive charity events',
      'Annual impact report',
    ],
    cta: 'Start Yearly',
    highlight: true,
  },
];

export default function HomePage() {
  const [featuredCharity, setFeaturedCharity] = useState<any>(null);

  useEffect(() => {
    api.charities.featured().then((data) => setFeaturedCharity(data)).catch(() => {});
  }, []);

  return (
    <div className={styles.page}>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBgOrb1} />
          <div className={styles.heroBgOrb2} />
          <div className={styles.heroBgGrid} />
        </div>

        <div className="container">
          <div className={styles.heroInner}>
            <div className={`${styles.heroContent} animate-fade-up`}>
              <div className="section-label mb-lg">
                Charity-First Golf Platform
              </div>

              <h1 className={`${styles.heroTitle} font-display`}>
                Play Golf.
                <br />
                <span className="gradient-text-gold">Win Prizes.</span>
                <br />
                Change Lives.
              </h1>

              <p className={styles.heroDesc}>
                The only golf subscription that turns your Stableford scores into monthly prize draws
                — while automatically donating to charities that matter.
              </p>

              <div className={styles.heroActions}>
                <Link href="/auth/register" className="btn btn-primary btn-lg">
                  Start Giving Back
                  <span>→</span>
                </Link>
                <Link href="#how-it-works" className="btn btn-secondary btn-lg">
                  How It Works
                </Link>
              </div>

              {/* Trust line */}
              <p className={styles.heroTrust}>
                <span className="glow-dot" style={{ display: 'inline-block' }}></span>
                &nbsp; Trusted by 4,800+ golfers · £250K+ donated to charity
              </p>
            </div>

            {/* Live Draw Card */}
            <div className={`${styles.heroCard} animate-fade-up delay-200`}>
              <div className={styles.drawCard}>
                <div className={styles.drawCardHeader}>
                  <span className="badge badge-active">Live Draw</span>
                  <span className="text-muted text-sm">April 2026</span>
                </div>
                <div className={styles.drawNumbers}>
                  {[12, 24, 31, 38, 42].map((n) => (
                    <div key={n} className={`score-ball matched animate-float`} style={{ animationDelay: `${n * 50}ms` }}>
                      {n}
                    </div>
                  ))}
                </div>
                <div className={styles.drawCardPrize}>
                  <span className="text-muted text-sm">Current Jackpot</span>
                  <span className="gradient-text-gold font-display" style={{ fontSize: '2rem', fontWeight: 900 }}>
                    £12,400
                  </span>
                </div>
                <Link href="/auth/register" className="btn btn-primary w-full mt-md">
                  Join This Draw
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className={`${styles.statsRow} animate-fade-up delay-300`}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.statItem}>
                <span className={`font-display ${styles.statValue} gradient-text-gold`}>{s.value}</span>
                <span className="text-muted text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" className={`section ${styles.howSection}`}>
        <div className="container">
          <div className={styles.centerHeader}>
            <div className="section-label">Simple by design</div>
            <h2 className="section-title mt-md">
              Four steps to <span className="gradient-text-green">impact</span>
            </h2>
            <p className="section-subtitle mt-md">
              We built the simplest possible way to connect your golf game with charitable giving — and reward you while you're at it.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className={`card ${styles.stepCard} animate-fade-up`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE TIERS ──────────────────────────────────── */}
      <section className={`section ${styles.tiersSection}`}>
        <div className="container">
          <div className={styles.centerHeader}>
            <div className="section-label">Prize Structure</div>
            <h2 className="section-title mt-md">
              Three ways to <span className="gradient-text-gold">win</span>
            </h2>
            <p className="section-subtitle mt-md">
              Match 3, 4, or all 5 of your Stableford scores with the monthly draw numbers. Prizes split equally among all winners in each tier.
            </p>
          </div>

          <div className={styles.tiersGrid}>
            {TIERS.map((tier) => (
              <div
                key={tier.match}
                className={`${styles.tierCard} ${tier.highlight ? styles.tierHighlight : ''}`}
              >
                {tier.highlight && <div className={styles.tierBadge}>🏆 Top Prize</div>}
                <div className={styles.tierIcon}>{tier.icon}</div>
                <div className={styles.tierMatch}>{tier.match}</div>
                <div className={styles.tierLabel}>{tier.label}</div>
                <div className={styles.tierShare}>
                  <span className="gradient-text-gold font-display" style={{ fontSize: '3rem', fontWeight: 900 }}>
                    {tier.share}
                  </span>
                  <span className="text-muted text-sm">of prize pool</span>
                </div>
                <p className={styles.tierNote}>{tier.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED CHARITY ─────────────────────────────── */}
      {featuredCharity && (
        <section className={`section ${styles.charitySection}`}>
          <div className="container">
            <div className={styles.charitySpotlight}>
              <div className={styles.charityContent}>
                <div className="section-label">Charity Spotlight</div>
                <h2 className={`section-title mt-md`}>
                  This Month We're Supporting
                </h2>
                <h3 className={`${styles.charityName} gradient-text-gold`}>
                  {featuredCharity.name}
                </h3>
                <p className={`section-subtitle mt-md`}>
                  {featuredCharity.description}
                </p>
                {featuredCharity.events?.length > 0 && (
                  <div className={styles.charityEvents}>
                    <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-sm)' }}>
                      Upcoming Events
                    </p>
                    {featuredCharity.events.slice(0, 2).map((ev: any) => (
                      <div key={ev.id} className={styles.eventItem}>
                        <span className={styles.eventDot}></span>
                        <div>
                          <p className="text-sm font-medium">{ev.title}</p>
                          <p className="text-xs text-muted">
                            {new Date(ev.date).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                            {ev.location ? ` · ${ev.location}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/charities" className="btn btn-green mt-xl">
                  Explore All Charities
                </Link>
              </div>
              {featuredCharity.imageUrl && (
                <div className={styles.charityImage}>
                  <img src={featuredCharity.imageUrl} alt={featuredCharity.name} />
                  <div className={styles.charityImageOverlay}>
                    <p className="text-sm font-semibold">Your contribution</p>
                    <p className="gradient-text-gold font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      10%+ per month
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className={`section ${styles.pricingSection}`}>
        <div className="container">
          <div className={styles.centerHeader}>
            <div className="section-label">Transparent Pricing</div>
            <h2 className="section-title mt-md">
              Simple plans, <span className="gradient-text-gold">big impact</span>
            </h2>
            <p className="section-subtitle mt-md">
              Every penny counts — a guaranteed portion of your subscription funds prizes and charity, automatically.
            </p>
          </div>

          <div className={styles.plansGrid}>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`${styles.planCard} ${plan.highlight ? styles.planHighlight : ''}`}
              >
                {plan.badge && <div className={styles.planBadge}>{plan.badge}</div>}
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className="gradient-text-gold font-display" style={{ fontSize: '2.8rem', fontWeight: 900 }}>
                    {plan.price}
                  </span>
                  <span className="text-muted">{plan.period}</span>
                </div>
                <ul className={styles.planFeatures}>
                  {plan.features.map((f) => (
                    <li key={f} className={styles.planFeature}>
                      <span className={styles.checkIcon}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/auth/register?plan=${plan.id}`}
                  className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'} w-full`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className={styles.pricingNote}>
            💚 Min 10% to charity · 50% to prize pool · Cancel anytime · Powered by Stripe
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section className={`section ${styles.ctaSection}`}>
        <div className="container">
          <div className={styles.ctaBox}>
            <div className={styles.ctaOrb} />
            <h2 className={`section-title ${styles.ctaTitle}`}>
              Ready to make your game <span className="gradient-text-gold">matter?</span>
            </h2>
            <p className={`section-subtitle mt-md`} style={{ margin: '0 auto' }}>
              Join thousands of golfers turning their scores into prizes and charity contributions every single month.
            </p>
            <Link href="/auth/register" className="btn btn-primary btn-lg mt-2xl">
              Get Started Today — It's Free to Try
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div>
              <div className="nav-logo" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>⛳ GolfCharity</div>
              <p className="text-muted text-sm">Play golf. Win prizes. Change lives.</p>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/charities" className="text-muted text-sm">Charities</Link>
              <Link href="/#how-it-works" className="text-muted text-sm">How It Works</Link>
              <Link href="/#pricing" className="text-muted text-sm">Pricing</Link>
              <Link href="/auth/login" className="text-muted text-sm">Sign In</Link>
            </div>
          </div>
          <div className="divider" />
          <p className="text-muted text-sm text-center">
            © 2026 Golf Charity Platform · Built by Digital Heroes · digitalheroes.co.in
          </p>
        </div>
      </footer>
    </div>
  );
}
