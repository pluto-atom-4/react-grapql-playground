# 7-Day Intensive Practice Plan

Starting date: **April 16, 2026**  
Target interview window: **April 22-23, 2026**

This compressed plan focuses on high-impact preparation for a likely **practical full-stack coding challenge** (frontend + backend), based on reported Stoke Space interview patterns.

## Why this plan is optimized

- One candidate reported a **1-hour CoderPad live challenge**: mini full-stack system using **Express.js + React**.
- Another reported **classical LeetCode easy/medium** questions.
- Given the role stack, expect **GraphQL/Apollo** to be highly likely.
- You may still be tested on **raw Node/Express basics** (file uploads, webhooks, real-time events).

## Daily structure (2.5-3.5 hours max)

- **45-60 min:** Core coding/building
- **30-45 min:** DSA or targeted skill (GraphQL/Express)
- **30 min:** Explain out loud + tie to your CV (record yourself)
- **End of day:** Quick review of weakest area

## Preparation setup (Day 1, ~1 hour)

- Create a starter repo with **Next.js 15 (App Router) + Apollo Client/Server + Postgres (Docker)**.
- Add a simple **Express + React** fallback folder (for CoderPad-style challenge).
- Pre-install **Vitest + React Testing Library**.
- Prepare a Boltline-themed domain model: **Build, Part, TestRun**.

## Compressed 7-day plan

| Day | Focus (Priority) | Key Exercises | DSA / Targeted Skill | Goal / Output |
| --- | --- | --- | --- | --- |
| **Day 1 (Apr 16)** | React + TypeScript + Apollo Client Fluency | Build responsive manufacturing dashboard: list of Builds with nested TestRuns, filters, pagination, optimistic mutation for status updates. Use `useQuery`, `useMutation`, Apollo cache. | Array/hash map problems (example: group test results by status). | Working dashboard component + 2-3 narrated explanations. |
| **Day 2 (Apr 17)** | GraphQL Schema + Apollo Server + Resolvers | Design SDL for Boltline domain (`Build`, `Part`, `TestRun`, relationships, enums). Implement resolvers with DataLoader (N+1 fix) + basic Postgres integration. | Tree/Graph: Course Schedule or level-order traversal (workflow steps). | Functional GraphQL endpoint + one nested query working. |
| **Day 3 (Apr 18)** | Full-Stack Mini Feature (Apollo Data, Express File Uploads) | Build end-to-end flow: Create Build -> Add Parts -> Submit Test Run -> View real-time updates (Next.js + Apollo + Postgres). Add file upload support (Express + Apollo upload scalar). Add loading states, error handling, basic tests. | Sliding window or merge intervals (test time-series). | Complete mini-feature; Dockerized. |
| **Day 4 (Apr 19)** | DSA Sprint + Express Webhooks/Real-Time | Solve 3-4 LeetCode easy/medium in TypeScript. Then adapt one into a small Express + React task (example: in-memory CRUD for parts, webhook handler, or real-time event endpoint using SSE or WebSocket). | Two Sum variant, Group Anagrams, Number of Islands, Merge Intervals. | 4 solved problems + one Express mini app (webhook or real-time). |
| **Day 5 (Apr 20)** | Integrated Full-Stack + Testing | Refactor Day 3 feature: add unit/integration tests (Vitest + Apollo `MockedProvider`), error boundaries, basic observability stubs. Practice switching to plain Express if needed. | Graph traversal applied to resolver (batch test results). | Tested, production-like feature with README and design decisions. |
| **Day 6 (Apr 21)** | Mock Interviews + System Design Lite | Run 2 full mocks (45-60 min each): 1 live full-stack task + 1 LeetCode medium + GraphQL discussion. Walk through: Design a simple workflow tracker for hardware tests. | One timed LeetCode medium. | Recorded mocks + feedback notes; prep 2-3 CV stories (ownership, on-call, data pipelines). |
| **Day 7 (Apr 22)** | Review, Polish, Light Practice | Revisit weakest areas (one full-stack refactor + one DSA). Simulate 1-hour timed challenge. Review operations questions (CI, on-call from Avanade experience). | Quick review of 2 DSA problems. | Confidence boost: clean repo, strong narratives, ready for surprise Express/React combo. |

## Key adjustments from previous plans

- **Shorter and denser:** Reduced from 10 days to 7 by merging integration work and shrinking buffer time.
- **More timed practice:** Days 6-7 include explicit timed simulation due to reported 1-hour CoderPad challenge.
- **Express safety net:** Added focused Express + React prep, including file uploads, webhooks, and real-time endpoints, despite GraphQL-first role.
- **DSA kept practical:** Only easy/medium problems mapped to manufacturing-like data workflows.
- **Storytelling built in:** Every day ends with a CV linkage (example: Excel ingestion pipeline redesign at Avanade).

## Quick tips for the actual challenge (likely 45-90 min)

- If it is CoderPad-style:
  - Clarify requirements first.
  - Build MVP quickly.
  - Add polish (TypeScript types, error handling, tests).
- If it is GraphQL-heavy:
  - Lead with schema design + DataLoader to demonstrate senior-level thinking.
- If Express is involved:
  - Be ready to implement file uploads, webhook endpoints, or real-time (SSE/WebSocket) handlers.
- Narrate your decisions:
  - Example: using Apollo cache updates for optimistic UI to provide instant manufacturing feedback.
- Ask strong product-minded questions:
  - Example: whether real-time subscriptions are needed for test status updates.

## Final note

You are in a strong position. Your 8+ years of end-to-end ownership and production debugging (Avanade incidents, data pipelines) align well with Boltline's needs. This plan maximizes the next 7 days without burnout.

If the challenge gets scheduled, or if you get exact format/platform details, update this plan immediately and tune practice to match.
