# Golf Charity Subscription Platform

A subscription-based web application combining **golf performance tracking**, **monthly prize draws**, and **charitable giving**.

> Built with ❤️ by Digital Heroes · digitalheroes.co.in

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Backend | NestJS, Prisma ORM |
| Database | PostgreSQL (Supabase / Local Docker) |
| Auth | JWT |
| Payments | Razorpay (Migrated from Stripe) |
| Storage | Supabase Storage (Screenshot verification) |
| Email | Nodemailer (Gmail/SendGrid/SMTP compatible) |
| Monorepo | Turborepo |

## Platform Features

1. **Subscription & Payment**: Monthly/Yearly premium subscription options natively integrated via **Razorpay**.
2. **Score Management**: Tracker for rolling 5 Stableford scores.
3. **Charity Support**: Portion of the subscription is directly allocated to users' chosen charities. Includes a directory of supported orgs.
4. **Draw System**: Monthly automated draws based on score frequencies with jackpots and rollovers. 
5. **Dashboard**: View subscription active status, earnings, charity choices, and upload Proof of Winnings to be verified by an admin.
6. **Admin Panel**: Manage users, execute draw simulations, and payout winning requests.

## Local Development (Quick Start)

The environment files have been strictly simplified into a **single root `.env`** configuration file for ease of use across the full stack.

### Prerequisites
- Node.js >= 18
- Docker (if using local database)
- Supabase Project (for storage/remote DB)
- Razorpay Account (for testing payments API)

### 1. Set Up Environment
```bash
# Clone the repository
git clone <repo-url>
cd golf-charity-platform

# Create the environment file from exactly one template at the root
cp .env.example .env
```
👉 **Open `.env` and fill in your Supabase connection string, Razorpay API keys, and SMTP credentials.**

### 2. Auto-magical Setup
We have created a helper script that installs everything, pushes the database schema, and seeds default test data in one command!
```bash
npm run setup
```
*(If you are running PostgreSQL locally via Docker instead of Supabase, run `npm run docker:up` before setup).*

### 3. Start Development Servers
```bash
npm run dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

## Test Credentials (Seeded)

The `npm run setup` automation will insert a test administrator and a test subscriber.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@golfcharity.com | Admin@1234 |
| User | user@golfcharity.com | User@1234 |

## Deployment

- **Frontend** → [Vercel](https://vercel.com) (connect `apps/web` inside Turborepo settings, copy root env vars to Vercel)
- **Backend** → [Railway / Render](https://railway.app) (connect `apps/api`, uses the included `Dockerfile`)
- **Database / Storage** → [Supabase](https://supabase.com) (ensure pooler connection is used for production)

## Project Structure

```
├── apps/
│   ├── api/          # NestJS REST API Server
│   └── web/          # Next.js 14 Frontend Web Client
├── docker-compose.yml
├── .env.example      # A single master template for all services!
├── turbo.json
└── package.json
```
