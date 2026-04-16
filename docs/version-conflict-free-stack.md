# Version-Conflict-Free Stack (2025/2026)

To build a trouble-free stack with the most recent 2025/2026 versions, the key is handling the shift from legacy Apollo Client patterns to the Next.js App Router model.

## 1) Core Stack (Latest Stable Versions)

| Technology | Recommended Version | Compatibility Note |
|---|---|---|
| Next.js | `16.x` (LTS) | Released Oct 2025; standardizes Rust-based Turbopack |
| React | `19.x` | Required for Next.js 16; supported by Apollo Client `3.11+` |
| Apollo Client | `4.x` | Released Sept 2025; leaner build without legacy baggage |
| Apollo Server | `4.x` | Use `@as-integrations/next` for seamless API route handling |
| TypeScript | `5.x` | Standard baseline for modern type-safe boilerplates |

## 2) Conflict-Free Configuration Guide

To avoid the dependency issues you mentioned, follow these architectural rules:

- **GraphQL Codegen + TypeScript:**  
  Avoid the `client preset` with Apollo Client. Current guidance favors using `typescript` and `typescript-operations` plugins directly to reduce runtime code, bundle growth, and React 19 version friction.

- **Next.js App Router integration:**  
  In Server Components, standard Apollo hooks such as `useQuery` do not work as in client-only flows. Use the Next.js Apollo integration package (`@apollo/client-integration-nextjs`) instead of older experimental packages.

- **Vitest + `tsconfig.json`:**  
  Set `moduleResolution: "bundler"` in `tsconfig.json` to align with Next.js 16 expectations. For Vitest, use `@vitejs/plugin-react` so React 19 JSX is parsed correctly.

- **Express + Apollo Server:**  
  If using a separate Express server, use `@as-integrations/express4` or `@as-integrations/express5`. To reduce cookie-related security risk, keep Express at `4.21.1+`.

## 3) Recommended Boilerplate Sources

- **Apollo Client Next.js examples:**  
  Most official reference implementations for Next.js + Apollo + TypeScript.

- **Full-stack Next.js 15+ patterns:**  
  A 2025-focused guide for wiring these layers with fewer integration issues.

- **Next.js 15+ production setup guides:**  
  Strong references for configuring Vitest and Playwright with modern ESLint/TypeScript rules.