# ─── Build Stage ──────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
# Force install devDependencies (NestJS CLI) because Railway auto-injects NODE_ENV=production
RUN npm install --include=dev && npm cache clean --force

COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────
FROM node:20-slim AS production
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*


ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Generate prisma client in production
RUN npx prisma generate

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
