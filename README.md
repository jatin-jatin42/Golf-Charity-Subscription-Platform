# Golf Charity Subscription Platform

A subscription-based web application combining **golf performance tracking**, **monthly prize draws**, and **charitable giving**.

> Built with ❤️ by Digital Heroes · digitalheroes.co.in

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Backend | NestJS, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Auth | JWT |
| Payments | Stripe |
| Storage | Supabase Storage |
| Email | Nodemailer / SendGrid |
| Monorepo | Turborepo |

## Local Development

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose

### Quick Start

```bash
# 1. Clone & install dependencies
git clone <repo-url>
cd golf-charity-platform
npm install

# 2. Set up environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit both .env files with your credentials

# 3. Start PostgreSQL via Docker
npm run docker:up

# 4. Push DB schema
npm run db:push

# 5. Start development servers
npm run dev
```

- API: http://localhost:3001
- Web: http://localhost:3000
- API Docs: http://localhost:3001/api/docs

## Deployment

- **Frontend** → [Vercel](https://vercel.com) (connect `apps/web`, set env vars)
- **Backend** → [Railway](https://railway.app) (connect `apps/api`, uses `Dockerfile`)
- **Database** → [Supabase](https://supabase.com) (new project, copy `DATABASE_URL`)

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@golfcharity.com | Admin@1234 |
| User | user@golfcharity.com | User@1234 |

## Project Structure

```
├── apps/
│   ├── api/          # NestJS REST API
│   └── web/          # Next.js 14 Frontend
├── docker-compose.yml
├── turbo.json
└── package.json
```
