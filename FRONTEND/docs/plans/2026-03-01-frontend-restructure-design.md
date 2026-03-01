# Frontend Restructure Design

**Date:** 2026-03-01
**Status:** Approved

## Goal

Restructure the FRONTEND monorepo to:
1. Separate non-code files (README, LICENSE, etc.) into `docs/misc/`
2. Move config tools into `config/` directory
3. Add a new `app/` workspace for the MAXHUB web application
4. Optimize dev/build configuration with Vite + pnpm workspaces
5. Set up proxy to backend Fastify server

## Current Structure

```
FRONTEND/
├── packages/          # Component library (layui, icons, layer, form, component)
├── docs/              # Documentation site
├── play/              # Playground
├── build/             # Build scripts
├── README.md, README.zh.md, CONTRIBUTING.md, LICENSE
├── _redirects, vercel.json
├── .cz-config.js, commitlint.config.js
├── vitest.config.ts, eslint.config.mjs
└── package.json, pnpm-workspace.yaml
```

## New Structure

```
FRONTEND/
├── app/                    # NEW - MAXHUB web application
│   ├── src/
│   │   ├── api/            # HTTP client + API endpoints
│   │   ├── assets/         # Static assets
│   │   ├── components/     # App-specific components
│   │   ├── composables/    # Vue composables
│   │   ├── layouts/        # Layout components
│   │   ├── pages/          # Route pages
│   │   ├── router/         # Vue Router config
│   │   ├── stores/         # Pinia stores
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utilities
│   │   ├── App.vue
│   │   └── main.ts
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts      # Dev proxy → backend:3000
│   ├── tsconfig.json
│   ├── env.d.ts
│   └── package.json         # @maxhub/app
│
├── packages/               # KEEP - Component library
│   ├── layui/
│   ├── icons/
│   ├── layer/
│   ├── json-schema-form/
│   └── component/
│
├── docs/                   # RESTRUCTURE
│   ├── site/               # Current docs content moved here
│   │   ├── src/
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── misc/               # Non-code files
│       ├── README.md
│       ├── README.zh.md
│       ├── CONTRIBUTING.md
│       ├── LICENSE
│       ├── _redirects
│       └── vercel.json
│
├── play/                   # KEEP - Playground
├── build/                  # KEEP - Build scripts
│
├── config/                 # NEW - Tool configs (commitlint, commitizen)
│   ├── commitlint.config.js
│   └── .cz-config.js
│
├── package.json            # Root workspace (updated scripts)
├── pnpm-workspace.yaml     # Updated workspace paths
├── vitest.config.ts        # KEEP AT ROOT (required by vitest)
├── eslint.config.mjs       # KEEP AT ROOT (required by eslint)
├── tsconfig.json           # NEW - Base tsconfig
├── .env.example            # NEW - Environment template
└── .gitignore
```

## Key Decisions

1. **eslint.config.mjs and vitest.config.ts stay at root** - These tools expect config at project root by default
2. **commitlint and commitizen configs move to config/** - Less frequently used directly, can use `--config` flag
3. **docs/ becomes docs/site/** - The doc site package moves into a subdirectory to make room for misc files
4. **app/ uses Vite proxy** - Dev server proxies /api/* to backend at localhost:3000

## App Configuration

### vite.config.ts (app)
- Vue + Vue JSX plugins
- Path alias: `@` → `src/`
- Dev proxy: `/api` → `http://localhost:3000`, `/ws` → `ws://localhost:3000`

### Dependencies (app)
- vue, vue-router, pinia, @vueuse/core
- axios for HTTP
- @layui/layui-vue as workspace dependency

## Updated Scripts

- `dev` → runs app dev server
- `dev:docs` → runs docs/site dev
- `dev:play` → runs playground
- `build:app` → builds app for production
- All existing build scripts updated for new paths
