# CI/CD Pipeline Architecture & Explanation

This document provides a comprehensive overview of the Continuous Integration and Continuous Deployment (CI/CD) pipeline built for **Konvene**.

---

## 1. Pipeline Overview

The CI/CD pipeline is implemented using **GitHub Actions** and is located at:
[`.github/workflows/ci.yml`](file:///Users/nbharath/Documents/Konvene-main/.github/workflows/ci.yml)

It automatically triggers on:
- Every **push** to the `main` branch.
- Every **pull request** targeting the `main` branch.

```
       Developer Git Push / PR
                 │
                 ▼
       ┌────────────────────┐
       │   GitHub Actions   │
       │     (ci.yml)       │
       └─────────┬──────────┘
                 │
                 ▼
       ┌────────────────────┐
       │ Checkout & Node 20 │
       │  Setup with Cache  │
       └─────────┬──────────┘
                 │
                 ▼
       ┌────────────────────┐
       │  Install Monorepo  │
       │    Dependencies    │
       │     (npm ci)       │
       └─────────┬──────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
 ┌──────────────┐  ┌──────────────┐
 │  Build API   │  │  Build Web   │
 │ (Express /   │  │  (Next.js 15 │
 │  TypeScript) │  │  Production) │
 └──────────────┘  └──────────────┘
```

---

## 2. Monorepo Structure

Konvene is structured as an npm workspaces monorepo:
- **`apps/api`**: Express + TypeScript backend API using Prisma & Supabase.
- **`apps/web`**: Next.js 15 App Router frontend using React 19, Tailwind CSS, and custom typography.

The CI workflow validates both packages in unison to guarantee no broken contracts or regression errors slip into `main`.

---

## 3. Step-by-Step Workflow Explanation

| Step | Action / Tool | Description |
| :--- | :--- | :--- |
| **1. Checkout Repository** | `actions/checkout@v4` | Fetches the full Git repository context at the trigger commit. |
| **2. Set up Node.js** | `actions/setup-node@v4` | Provisions **Node.js 20 LTS** and activates npm dependency caching via `cache: "npm"`. Subsequent runs avoid re-downloading identical dependencies. |
| **3. Install Dependencies** | `npm ci` | Installs strict, reproducible dependencies from `package-lock.json` across all workspaces. |
| **4. Build API** | `npm run build:api` | Runs TypeScript compilation (`tsc`) for the backend Express application to catch type mismatches and compilation errors. |
| **5. Build Web** | `npm run build:web` | Executes Next.js static generation & production bundling (`next build`). Injects build-time fallback Supabase environment variables so client bundles compile cleanly without leaking secrets. |

---

## 4. Key Configurations & Resiliency Measures

### Build-time Environment Injection
Next.js performs build-time static site evaluation, which requires environment variables for Supabase:
```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co' }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key' }}
```
- **With Secrets Configured:** The build runs against your configured GitHub Actions repository secrets.
- **Without Secrets Configured:** The workflow defaults gracefully to dummy placeholders so pull requests from forks and branches validate without failing on missing secrets.

### Dependency Caching
By supplying `cache: "npm"` to `actions/setup-node@v4`, GitHub Actions stores `~/.npm` in GitHub's cache storage. This cuts workflow execution time significantly on repeated builds.

---

## 5. Next Steps for CD (Continuous Deployment)

When ready to enable automated deployments:
1. **Frontend Deployment**:
   - Integrate **Vercel** or **Cloudflare Pages** GitHub integration or add a deployment step with `vercel deploy --prod`.
2. **Backend Deployment**:
   - Deploy Docker images to **Render**, **Fly.io**, or **AWS ECS/Fargate** triggered on merge to `main`.
3. **Database Migrations**:
   - Add a step to run Prisma migrations (`npx prisma migrate deploy`) with a database connection secret prior to releasing the backend container.
