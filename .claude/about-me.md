# About This Project

## Interview Context

This is a **practice playground** for a **Senior Full Stack Software Developer** interview at **Stoke Space** for their Boltline platform.

**Position Details:**

- Role: Senior Full Stack Software Developer
- Company: Stoke Space
- Platform: Boltline (cloud-based Iterative Hardware Engineering platform)
- Interview Target: April 22-23, 2026
- Practice Duration: 7-day intensive (April 16-22, 2026)

## What is Boltline?

Boltline is a commercial SaaS product designed to help hardware teams (aerospace, biotech, energy) manage complex manufacturing workflows with reliability. It acts as a "digital backbone" that integrates:

- **Parts Library & Inventory**: Full traceability using QR codes and augmented Bills of Materials (aBOMs)
- **Work Plans**: Digital instructions for technicians that capture real-time shop floor data
- **Automated Workflows**: No-code automation for supply chain and engineering processes
- **Real-time Updates**: Critical for technicians working on multi-day manufacturing processes

## Core Tech Stack

| Component              | Technology                       |
| ---------------------- | -------------------------------- |
| Frontend               | React 19, TypeScript, Next.js 16 |
| GraphQL Client         | Apollo Client 4                  |
| Backend/GraphQL        | Apollo Server 4                  |
| Backend/Auxiliary      | Express.js (file uploads, webhooks, real-time) |
| Database               | PostgreSQL                       |
| CI/CD                  | GitHub Actions                   |
| Infrastructure         | Docker, Docker Compose           |

## Key Interview Themes

- **Traceability**: How hardware teams track "as-built" reality across complex manufacturing
- **Data Integrity**: Ensuring multi-day workflows don't lose state mid-execution
- **Real-time Collaboration**: Technicians need live updates on the shop floor
- **Scalability**: Handling high-volume sensor data and manufacturing events
- **Type Safety**: End-to-end TypeScript for reliability
- **User Experience**: Optimistic updates for spotty shop floor WiFi connectivity
- **Separation of Concerns**: Dual backends (GraphQL for data, Express for auxiliary)

## Domain Model (Boltline Simplified)

For this practice exercise, the focus is on three core entities:

**Build**: A top-level manufacturing work item
- Status: PENDING → RUNNING → COMPLETE or FAILED
- Parts: List of components used in this build
- TestRuns: Quality assurance test executions
- Metadata: Started timestamp, technician assignment, notes

**Part**: Individual components in a Build
- Name, SKU, quantity required
- Inventory tracking, traceability
- Part history and revisions

**TestRun**: Test execution results for a Build
- Status: PENDING → RUNNING → PASSED or FAILED
- Duration, metrics captured
- File uploads and test report links
- Technician notes and metadata

This mirrors real hardware manufacturing: assemble parts, run tests, iterate, track everything.

## Your Preparation Goals

This playground lets you practice:

1. **Building mini full-stack systems** (React + GraphQL + Express) in 60-120 minutes
2. **Real-time UI patterns** (optimistic updates, Server-Sent Events, loading states)
3. **GraphQL schema design** (SDL, resolvers, DataLoader for N+1 prevention)
4. **Auxiliary backend patterns** (file uploads, webhook handling, event streaming)
5. **Testing production-grade code** (Vitest, Apollo MockedProvider, integration tests)
6. **Thinking about industrial reliability** (data persistence, error recovery, observability)

## Dual-Backend Architecture

Unlike traditional monolithic backends, this practice uses **separation of concerns**:

- **Apollo GraphQL Server** (port 4000): Handles structured data operations
  - Build/Part/TestRun CRUD via GraphQL
  - Type-safe queries and mutations
  - DataLoader for efficient batch loading
  
- **Express.js Server** (port 5000): Handles auxiliary operations
  - File upload endpoint (test reports, CAD files)
  - Webhook handlers (CI/CD results, sensor data)
  - Server-Sent Events for real-time notifications

This mirrors Boltline's actual architecture where concerns scale independently.

## Interview Format & Likely Challenge

Based on reported Stoke Space interviews:

- **Format**: 1-hour CoderPad or Figma live challenge (likely full-stack)
- **Scope**: Mini system (e.g., "Build a dashboard to create and monitor manufacturing builds with real-time updates")
- **Assessment Focus**: 
  - Code clarity and TypeScript fluency
  - GraphQL schema thinking (not just client-side React)
  - Real-time UX patterns (Apollo optimistic updates, event streaming)
  - Testing mindset and error handling
  - Architecture decisions and separation of concerns

## Success Metrics for This Practice

By the time you interview, you should be able to:

✅ Design a GraphQL schema for a business domain in 10 minutes  
✅ Implement resolvers with DataLoader to prevent N+1 queries  
✅ Build a React component that fetches and mutates GraphQL data  
✅ Create file upload and webhook endpoints in Express  
✅ Wire real-time events from Express to frontend via SSE or WebSocket  
✅ Add error handling, loading states, and optimistic updates  
✅ Write tests for resolvers, components, and routes  
✅ Explain architecture decisions (why dual backends, why DataLoader, why optimistic updates)  
✅ Debug using GraphiQL, Apollo DevTools, Express logs, and browser DevTools  

---

**See also:**
- `CLAUDE.md` — Development setup and common commands
- `DESIGN.md` — Detailed architecture patterns and code examples
- `docs/start-from-here.md` — 7-day daily practice plan with exercises
