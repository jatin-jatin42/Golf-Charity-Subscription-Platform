# Golf Charity Subscription Platform ⛳ 

> A premium, subscription-based web application connecting the joy of golf with the power of charitable giving. Built with a modern Next.js + NestJS monorepo architecture.

---

## 📖 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Core Features](#core-features)
4. [Local Development & Setup](#local-development--setup)
5. [Database Scaffolding](#database-scaffolding)
6. [Deployment Guide](#deployment-guide)

---

## 🌟 Project Overview
This platform re-imagines golf tracking by integrating it deeply with charitable donations. 
Instead of traditional, cliché golf aesthetics, the application adopts a premium, dark-mode, motion-driven design that emphasizes **impact**.

Users subscribe to the platform, log their Stableford golf scores, and automatically contribute to a charity of their choice. Their scores generate tickets to monthly algorithmically-calculated prize draws with jackpots that roll over if unclaimed.

---

## 🛠 Tech Stack & Architecture

This repository uses **Turborepo** for monorepo management, splitting the application into a frontend client and a backend API server.

### Backend (`apps/api`)
- **Framework:** NestJS (Node.js/TypeScript)
- **Database ORM:** Prisma
- **Database Provider:** PostgreSQL (via Supabase pooling)
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)
- **Payments Engine:** Razorpay API for subscriptions
- **Email Service:** Nodemailer over SMTP 

### Frontend (`apps/web`)
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules with dynamic dark-mode tokens
- **State Management:** Custom React Context API

---

## ✨ Core Features

### 1. Subscription & Payment System
- Secure integration with **Razorpay** for handling monthly and yearly (discounted) subscriptions.
- Active subscriptions are verified through a global guard on authenticated requests.
- A portion of all subscription revenue goes dynamically to the global Prize Pool.

### 2. Score Management Engine
- Simple dashboard interface for logging Stableford scores (1-45 valid range).
- Retains only the 5 most recent scores automatically (FIFO methodology).
- Secure tracking for use in the algorithmic draw.

### 3. Algorithmic Monthly Draws & Rewards
- Monthly draws configured by administrators with standard 5-number, 4-number, and 3-number match logic.
- Admin dashboard allows **simulations** of the draw before officially committing/publishing to the blockchain-esque ledger.
- The 5-number match acts as a Jackpot, taking 40% of the pool. If there are no winners, it safely rolls over to the next month's pool.

### 4. Charity Support & Allocation
- Users select an organization during onboarding or dynamically from their dashboard.
- Features a "Charities Directory" for users to search/filter active charity organizations, read their descriptions, and track events.

### 5. Secure File Verification
- If users win a draw tier, their payout is pending until they upload a screenshot proof of their golf score.
- Uploads directly to **Supabase Storage**.
- Admin dashboard allows verification matching and marking payouts as `PAID`.

---

## 🚀 Local Development & Setup

This repository has been streamlined into a seamless setup process requiring only a single `.env` file at the root.

### Prerequisites
1. **Node.js**: v18 or newer
2. **Package Manager**: NPM
3. **Database**: Supabase Project URL (with connection pooling) or Docker.
4. **Keys:** Razorpay API keys, Supabase Service keys, SMTP Email keys.

### 1. Clone & Configure
```bash
git clone <repository_url>
cd golf-charity-platform

# Copy the example environment template
cp .env.example .env
```
👉 *Open `.env` and fill in your keys. All backend and frontend variables are centrally managed here!*

### 2. The Auto-Setup Command
We have provided an automated setup script that installs dependencies, pushes the database schema, and seeds default user data.
```bash
npm run setup
```
*(If you are wanting to use a local Docker PostgreSQL container instead of remote Supabase, simply run `npm run docker:up` before the setup command).*

### 3. Start Development Mode
```bash
npm run dev
```

Your terminals will launch:
- **Client Application:** `http://localhost:3000`
- **API Server:** `http://localhost:3001/api`

---

## 🔐 Test Credentials (Deliverables)

As per the assignment deliverables, the database seed file (`apps/api/prisma/seed.ts`) automatically generates default user profiles with data necessary to test the platform functionally. 

> **Important Deployment Note:** Hardcoded passwords have been intentionally excluded from this public `README.md` for security compliance. 
> 
> The exact login credentials for the functional `User` and `Admin` testing panels have been **provided privately within the assignment submission email/portal.** Please refer to your secure transfer file for the test emails and passwords.

---

## 🌐 Deployment Guide

This repository is optimized for modern cloud deployments.
1. **Database:** Create a new project on [Supabase](https://supabase.com). Enable Connection Pooling and copy the IPv4 URL. Create a Storage bucket called `proofs`.
2. **Backend API:** Connect the `apps/api` sub-directory to [Railway](https://railway.app) or Render. It will automatically build utilizing the included `Dockerfile`. Provide all root environment variables to this container.
3. **Frontend Web:** Connect the `apps/web` sub-directory to [Vercel](https://vercel.com). Ensure you pass the `NEXT_PUBLIC_` environment variables in the Vercel dashboard.

