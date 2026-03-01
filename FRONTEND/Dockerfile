# ── Stage 1: install dependencies ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.14.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY app/package.json ./app/
COPY packages/component/package.json ./packages/component/
COPY packages/icons/package.json ./packages/icons/
COPY packages/layer/package.json ./packages/layer/
COPY packages/layui/package.json ./packages/layui/
COPY packages/json-schema-form/package.json ./packages/json-schema-form/

RUN pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.14.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Restore workspace node_modules links
RUN pnpm install --frozen-lockfile --offline

RUN pnpm build:app

# ── Stage 3: serve with nginx ─────────────────────────────────
FROM nginx:alpine AS production

COPY --from=build /app/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
