# CodeVault git-service — multi-stage build.
# Targets:
#   development → hot-reload via nodemon (used by docker-compose.override.yml)
#   production  → compiled dist on a slim non-root runtime (default)

# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=development
# libssl/openssl are required by Prisma's query engine on Alpine.
RUN apk add --no-cache openssl

# ---------- deps (all deps, for building + dev) ----------
FROM base AS deps
COPY package*.json ./
RUN npm install

# ---------- development ----------
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---------- builder (compile TS, generate Prisma client) ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build && npm prune --omit=dev

# ---------- production ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl && addgroup -S app && adduser -S app -G app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
USER app
EXPOSE 5000
CMD ["node", "dist/index.js"]
