# ── Stage 1: install dependencies ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
RUN npm install --production=false

# ── Stage 2: build ────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Remove dev dependencies, keep only production
RUN npm prune --omit=dev

# ── Stage 3: production image ─────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

ENV NODE_ENV=production

USER appuser

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
