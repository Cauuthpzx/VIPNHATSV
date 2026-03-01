# Frontend Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the FRONTEND monorepo: move non-code files to `docs/misc/`, move tool configs to `config/`, relocate docs site to `docs/site/`, create new `app/` workspace with Vite proxy to backend, and optimize dev/build configuration.

**Architecture:** pnpm workspace monorepo with 4 workspace packages: `app/` (MAXHUB web app), `packages/*` (component library), `docs/site/` (documentation), `play/` (playground). Root keeps eslint and vitest configs. Commitlint/commitizen configs move to `config/`.

**Tech Stack:** Vue 3.3.13, Vite 5, pnpm 8, TypeScript, Vue Router, Pinia, Axios, Layui-Vue components

---

### Task 1: Move docs site into docs/site/

**Files:**
- Move: `docs/*` → `docs/site/` (all current docs content except `docs/plans/`)

**Step 1: Create docs/site/ directory and move docs content**

```bash
cd /c/Users/Admin/Desktop/MAXHUB/FRONTEND

# Create site directory
mkdir -p docs/site

# Move all docs content EXCEPT plans/ into site/
# Files to move:
mv docs/.env.demand docs/site/
mv docs/.gitignore docs/site/
mv docs/_redirects docs/site/
mv docs/index.html docs/site/
mv docs/package.json docs/site/
mv docs/prerender.js docs/site/
mv docs/shims-vue.d.ts docs/site/
mv docs/tsconfig.json docs/site/
mv docs/vite.config.ts docs/site/
mv docs/src docs/site/
```

**Step 2: Update docs/site/vite.config.ts alias paths**

The aliases reference `../packages/` which after moving will need `../../packages/`. Update the file:

```typescript
import path from "path";
import { defineConfig } from "vite";
import plugins from "./src/plugin/all-plugins";

export default defineConfig({
  resolve: {
    alias: {
      "/@src": path.resolve(__dirname, "./src"),
      "layui-component": path.resolve(__dirname, "../../packages/component"),
      "layui-vue": path.resolve(__dirname, "../../packages/layui"),
      "layui-layer": path.resolve(__dirname, "../../packages/layer"),
      "json-schema-form": path.resolve(__dirname, "../../packages/json-schema-form"),
    },
  },
  plugins,
  server: {
    host: true,
  },
});
```

**Step 3: Verify docs/site/ structure is correct**

```bash
ls -la docs/site/
# Expected: .env.demand, .gitignore, _redirects, index.html, package.json,
#           prerender.js, shims-vue.d.ts, tsconfig.json, vite.config.ts, src/
```

---

### Task 2: Move non-code files to docs/misc/

**Files:**
- Move: `README.md`, `README.zh.md`, `CONTRIBUTING.md`, `LICENSE`, `_redirects`, `vercel.json` → `docs/misc/`
- Move: `.gitee/` → `docs/misc/.gitee/`

**Step 1: Create docs/misc/ and move files**

```bash
cd /c/Users/Admin/Desktop/MAXHUB/FRONTEND

mkdir -p docs/misc

mv README.md docs/misc/
mv README.zh.md docs/misc/
mv CONTRIBUTING.md docs/misc/
mv LICENSE docs/misc/
mv _redirects docs/misc/
mv vercel.json docs/misc/
mv .gitee docs/misc/
```

**Step 2: Verify docs/misc/ structure**

```bash
ls -la docs/misc/
# Expected: README.md, README.zh.md, CONTRIBUTING.md, LICENSE,
#           _redirects, vercel.json, .gitee/
```

---

### Task 3: Move tool configs to config/

**Files:**
- Move: `commitlint.config.js` → `config/commitlint.config.js`
- Move: `.cz-config.js` → `config/.cz-config.js`

**Step 1: Create config/ and move files**

```bash
cd /c/Users/Admin/Desktop/MAXHUB/FRONTEND

mkdir -p config
mv commitlint.config.js config/
mv .cz-config.js config/
```

**Step 2: Update .husky/commit-msg to use new commitlint path**

Update file `.husky/commit-msg`:

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run commit:eslint
npx --no -- commitlint --config config/commitlint.config.js --edit $1
```

**Step 3: Update package.json commitizen config path**

In `package.json`, update the `config.commitizen` section to point to new `.cz-config.js` location:

```json
{
  "config": {
    "commitizen": {
      "path": "node_modules/cz-customizable"
    },
    "cz-customizable": {
      "config": "config/.cz-config.js"
    }
  }
}
```

**Step 4: Verify config/ structure**

```bash
ls -la config/
# Expected: commitlint.config.js, .cz-config.js
```

---

### Task 4: Update pnpm-workspace.yaml

**Files:**
- Modify: `pnpm-workspace.yaml`

**Step 1: Update workspace paths**

Replace contents of `pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
  - app
  - docs/site
  - play
```

---

### Task 5: Update root package.json scripts and metadata

**Files:**
- Modify: `package.json`

**Step 1: Update all scripts to reflect new paths**

Update `package.json` scripts section:

```json
{
  "packageManager": "pnpm@8.14.0",
  "description": "MAXHUB - Full-stack application with Vue 3 component library",
  "license": "MIT",
  "private": true,
  "workspaces": [
    "packages/*",
    "app",
    "docs/site"
  ],
  "scripts": {
    "dev": "pnpm -C app dev",
    "dev:play": "pnpm -C play dev",
    "dev:docs": "pnpm -C docs/site dev",
    "test": "vitest run",
    "build": "pnpm --workspace-concurrency=1 run \"/^build:.*/\"",
    "build:app": "pnpm -C app build",
    "build:icons": "pnpm -C packages/icons build",
    "build:layer": "pnpm -C packages/layer build",
    "build:component": "pnpm -C packages/layui build",
    "build:form": "pnpm -C packages/json-schema-form build",
    "build:docs": "pnpm -C docs/site build",
    "publish:component": "pnpm -C packages/layui publish",
    "generate:icons": "pnpm -C packages/icons generate",
    "lint": "eslint --fix",
    "commit:eslint": "node ./build/commit-eslint.js",
    "postinstall": "pnpm run build",
    "prepare": "husky install"
  }
}
```

Key changes:
- `"private": true` added (this is a monorepo root, should not be published)
- `dev` now starts the app, `dev:play` starts playground
- `dev:docs` path updated to `docs/site`
- `build:app` added
- `build:docs` path updated
- `lint:eslint` renamed to `lint`
- Removed `commit` script (dangerous: `git add . && git-cz && git push`)

---

### Task 6: Create root tsconfig.json

**Files:**
- Create: `tsconfig.json`

**Step 1: Create base TypeScript config**

Create `tsconfig.json` at FRONTEND root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "exclude": ["node_modules", "dist", "**/dist"]
}
```

---

### Task 7: Create .env.example

**Files:**
- Create: `.env.example`

**Step 1: Create environment template**

Create `.env.example` at FRONTEND root:

```env
# =================================
# MAXHUB Frontend Environment
# =================================

# API Backend URL
VITE_API_BASE_URL=http://localhost:3000

# WebSocket URL
VITE_WS_URL=ws://localhost:3000

# App Settings
VITE_APP_TITLE=MAXHUB
```

---

### Task 8: Create app/ workspace - package.json and configs

**Files:**
- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/env.d.ts`
- Create: `app/index.html`

**Step 1: Create app directory structure**

```bash
cd /c/Users/Admin/Desktop/MAXHUB/FRONTEND

mkdir -p app/src/{api,assets,components,composables,layouts,pages,router,stores,types,utils}
mkdir -p app/public
```

**Step 2: Create app/package.json**

```json
{
  "name": "@maxhub/app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@layui/layui-vue": "workspace:*",
    "@vueuse/core": "^10.7.0",
    "axios": "^1.6.0",
    "pinia": "^2.1.7",
    "vue": "3.3.13",
    "vue-router": "^4.2.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.6.2",
    "@vitejs/plugin-vue-jsx": "^3.1.0",
    "typescript": "^4.9.5",
    "vite": "5.0.11",
    "vue-tsc": "1.5.3"
  }
}
```

**Step 3: Create app/tsconfig.json**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue", "env.d.ts"]
}
```

**Step 4: Create app/env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Step 5: Create app/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MAXHUB</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

### Task 9: Create app/vite.config.ts with proxy

**Files:**
- Create: `app/vite.config.ts`

**Step 1: Create Vite config with backend proxy**

```typescript
import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ["vue", "vue-router", "pinia"],
          layui: ["@layui/layui-vue"],
        },
      },
    },
  },
});
```

---

### Task 10: Create app source files (main.ts, App.vue, router, stores)

**Files:**
- Create: `app/src/main.ts`
- Create: `app/src/App.vue`
- Create: `app/src/router/index.ts`
- Create: `app/src/stores/index.ts`
- Create: `app/src/pages/Home.vue`
- Create: `app/src/layouts/DefaultLayout.vue`
- Create: `app/src/api/client.ts`

**Step 1: Create app/src/main.ts**

```typescript
import Layui from "@layui/layui-vue";
import "@layui/layui-vue/lib/index.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Layui);

app.mount("#app");
```

**Step 2: Create app/src/App.vue**

```vue
<template>
  <router-view />
</template>
```

**Step 3: Create app/src/router/index.ts**

```typescript
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/layouts/DefaultLayout.vue"),
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/pages/Home.vue"),
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

**Step 4: Create app/src/stores/index.ts**

```typescript
export { createPinia } from "pinia";
```

**Step 5: Create app/src/pages/Home.vue**

```vue
<template>
  <div class="home-page">
    <h1>MAXHUB</h1>
    <p>Application is running.</p>
  </div>
</template>
```

**Step 6: Create app/src/layouts/DefaultLayout.vue**

```vue
<template>
  <lay-layout>
    <lay-body>
      <router-view />
    </lay-body>
  </lay-layout>
</template>
```

**Step 7: Create app/src/api/client.ts**

```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  response => response,
  (error) => {
    return Promise.reject(error);
  },
);
```

---

### Task 11: Update .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Update .gitignore with modern entries**

```
.DS_Store
node_modules/
package-lock.json
dist/
package/document/dist/

# Editor directories and files
.idea
*.suo
*.ntvs*
*.njsproj
*.sln

# yarn
yarn-lock
yarn-error.log

# Environment files
.env
.env.local
.env.*.local

# Build outputs
*.tsbuildinfo

# Logs
*.log
```

---

### Task 12: Install dependencies and verify

**Step 1: Install pnpm dependencies**

```bash
cd /c/Users/Admin/Desktop/MAXHUB/FRONTEND
pnpm install
```

Expected: Dependencies install successfully for all workspaces including new `app/` package.

**Step 2: Verify workspace structure**

```bash
pnpm ls --depth 0
```

Expected: Shows all workspace packages including `@maxhub/app`.

**Step 3: Test that app dev server starts**

```bash
pnpm dev
```

Expected: Vite dev server starts at http://localhost:5173, MAXHUB page loads.

**Step 4: Test that docs still works**

```bash
pnpm dev:docs
```

Expected: Documentation site starts without errors.

**Step 5: Test that playground still works**

```bash
pnpm dev:play
```

Expected: Playground starts without errors.

---

### Task 13: Final verification and commit

**Step 1: Verify final directory structure**

```bash
cd /c/Users/Admin/Desktop/MAXHUB/FRONTEND
ls -la
# Expected at root: .env.example, .gitignore, .husky/, .npmrc, .vscode/,
#                    .workflow/, app/, build/, config/, docs/, eslint.config.mjs,
#                    node_modules/, package.json, packages/, play/,
#                    pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.json,
#                    vitest.config.ts

ls -la docs/
# Expected: misc/, plans/, site/

ls -la config/
# Expected: .cz-config.js, commitlint.config.js

ls -la app/src/
# Expected: api/, App.vue, assets/, components/, composables/, layouts/,
#            main.ts, pages/, router/, stores/, types/, utils/
```

**Step 2: Run lint to verify no config issues**

```bash
pnpm lint
```

Expected: ESLint runs without config errors.

**Step 3: Commit all changes**

```bash
git add -A
git commit -m "refactor: restructure frontend monorepo

- Move docs site to docs/site/
- Move non-code files (README, LICENSE, etc.) to docs/misc/
- Move commitlint and commitizen configs to config/
- Create app/ workspace for MAXHUB web application
- Add Vite proxy to backend Fastify server
- Add root tsconfig.json and .env.example
- Update pnpm-workspace.yaml and package.json scripts
- Optimize build configuration"
```
