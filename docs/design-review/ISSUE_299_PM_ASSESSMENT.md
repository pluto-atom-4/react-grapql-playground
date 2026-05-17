# PM Design Review: Issue #299 - W3C Distributed Tracing
**Date:** 2026-05-17  
**Status:** Ready for Planning Phase  
**Priority:** High  
**Complexity Rating:** 4/5 (Advanced)  

---

## Executive Summary

Issue #299 proposes implementing **end-to-end W3C distributed tracing** across our full-stack architecture to enable unified observability of request lifecycles. This feature has **high strategic value** for production deployability, debugging, and performance analysis—critical capabilities for a senior-level interview portfolio and production Boltline deployment. However, it introduces moderate complexity and requires **staged rollout** to avoid blockers on other work.

**Decision:** ✅ **GO** — Proceed with implementation in Phase 2 (post-MVP core features). Recommend splitting into 3 independent PRs to enable parallel work and reduce merge conflicts.

---

## Scope Analysis

### What's Included ✅

| Layer | Scope | Complexity | Effort |
|-------|-------|-----------|--------|
| **Frontend (React)** | OpenTelemetry Web SDK, inject traceparent headers on fetch/GraphQL, SSE trace extraction | Medium | 3-4 days |
| **Express Backend** | Extract/inject W3C headers, span creation for SSE connections, event emission with trace context | Medium | 2-3 days |
| **Apollo GraphQL** | Plugin-based trace context injection, resolver span wrapping, field-level tracing | Medium-High | 3-4 days |
| **Prisma ORM** | Enable OpenTelemetry tracing flag, link DB spans to resolver spans | Low | 1-2 days |

### What's Excluded ❌

- **APM Backend Integration**: Document as separate (Issue TBD) — assume mock/local trace collection for MVP
- **Trace Sampling/Filtering**: Implement basic 100% sampling; advanced filtering deferred to Phase 3
- **Custom Instrumentation beyond Core Stack**: Multer, Bcrypt, Redis (if added) — out of scope for v1
- **WebSocket Support**: SSE only; WebSocket tracing deferred to Phase 3
- **Performance Optimization**: No span batching, compression, or agent tuning in v1

### Complexity Assessment

**High Complexity Drivers:**
1. **Asynchronous SSE Span Propagation**: Maintaining trace context across EventEmitter, async event streams requires careful context management
2. **Apollo Plugin Ecosystem**: Multiple integration points (didResolveOperation, didEncounterErrors, willSendResponse)
3. **Prisma ORM Flag**: Requires version compatibility check and testing
4. **Browser Context Storage**: Managing trace context in localStorage/sessionStorage without polluting user data
5. **Type Safety**: End-to-end TypeScript from SDK to DB—generate types from OpenTelemetry schema

**Mitigation Strategies:**
- Use context-propagation library (`@opentelemetry/api/context`) to avoid manual context passing
- Use Apollo Server plugins (standard pattern, well-documented)
- Write integration tests for SSE trace propagation (most complex part)
- Defer advanced sampling logic to Phase 2.5 post-review

---

## Dependency Check

### Blocking Dependencies

**None identified.** Issue #299 is **independent and can start immediately** after Planning Phase.

### Related (Non-Blocking) Dependencies

| Issue | Relationship | Impact |
|-------|--------------|--------|
| #295 (Tab Integration) | Completed (merged) | Provides SSE foundation for trace extraction |
| #38 (SSE Edge Cases) | In scope of #299 | Tracing will improve SSE debugging |
| #37 (Integration Tests) | Complementary | Can write tracing tests with new test infrastructure |
| #266-264 (UX/Mobile) | Orthogonal | No technical dependency; tracing benefits all layers |

### Parallelization Potential

**High.** Work can be split into 3 parallel PRs (see Implementation Roadmap):
1. **PR-1: Frontend Tracing** (independent, no backend required)
2. **PR-2: Express/SSE Tracing** (independent, can merge first)
3. **PR-3: Apollo/Prisma Tracing** (depends on PR-1 headers, but can dev in parallel)

Teams could work in parallel with staggered merge sequencing.

---

## Technical Feasibility

### Current State (Baseline)

| Component | Status | Readiness |
|-----------|--------|-----------|
| **Frontend** | No OpenTelemetry SDK | 🟡 Requires 3 new npm packages |
| **Express** | No tracing middleware | 🟡 Requires 2 new npm packages |
| **Apollo** | No instrumentation | 🟡 Requires 1-2 new npm packages + custom plugin |
| **Prisma** | ORM in use | 🟢 Flag enablement only (no new deps) |
| **Testing** | Vitest + Apollo MockedProvider ready | 🟢 Foundation exists |

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Trace Context Loss in SSE Async Handlers** | High | Write integration tests early; use context API from day 1 |
| **Type Safety Across SDK Versions** | Medium | Pin versions in root package.json; test type generation |
| **Apollo Plugin Ordering** | Medium | Document plugin order; test plugin interactions |
| **Prisma Flag Compatibility** | Low | Check Prisma v6 docs; enable flag in .env |
| **Browser Storage Contamination** | Low | Use sessionStorage, not localStorage; clear on logout |

### Technology Dependencies

**Required npm packages (production):**
```json
{
  "@opentelemetry/api": "^1.8.0",
  "@opentelemetry/sdk-node": "^0.48.0",
  "@opentelemetry/sdk-trace-node": "^0.48.0",
  "@opentelemetry/instrumentation-express": "^0.36.0",
  "@opentelemetry/instrumentation-graphql": "^0.7.0",
  "@opentelemetry/instrumentation-prisma": "^0.2.0",
  "@opentelemetry/sdk-trace-web": "^1.20.0",
  "@opentelemetry/instrumentation-fetch": "^0.48.0"
}
```

**Version Compatibility Check Required:**
- Prisma v6.0.0 (current) — ORM tracing flag added in v4.8+, stable in v6 ✅
- Apollo Server 4.1.7 (current) — Plugin API stable ✅
- Next.js 16.0.0 (current) — Fetch instrumentation compatible ✅

**Complexity Score: 4/5**
- 4 technical domains (frontend, Express, Apollo, Prisma)
- SSE async propagation (most complex)
- Type safety across layers
- End-to-end integration testing

---

## Alignment with Project Goals

### Strategic Fit

**Strong alignment with interview portfolio:**
1. **Demonstrates Observability Expertise**: Shows mastery of OpenTelemetry, distributed tracing, and APM best practices
2. **Production-Ready Architecture**: Unified observability is a hallmark of senior-level systems
3. **Full-Stack Integration**: Traces *entire* user request from React to PostgreSQL—proves end-to-end thinking
4. **Debugging & Troubleshooting**: In interviews, this answers "How would you debug a slow request across your stack?"

### Contribution to Project Maturity

**Current State:** MVP with core CRUD features (Builds, Parts, TestRuns) + real-time SSE.  
**Gap:** No observability layer; debugging is manual console logs.  
**Enhancement:** Issue #299 adds professional observability tier.

**Maturity Timeline:**
- **Phase 1 (Done):** Core features (CRUD, SSE, real-time events)
- **Phase 2 (Now):** Observability (distributed tracing) + performance monitoring
- **Phase 3:** Advanced features (sampling, custom instrumentation, trace storage)

### Why This Matters for Interviews

**Example Talking Point:**
> "When we implemented W3C distributed tracing, I traced the entire request lifecycle from a React button click through the Express SSE layer, Apollo GraphQL mutations, and Prisma database queries. This unified trace showed us exactly where latency bottlenecks were—70% in database I/O, 20% in GraphQL resolver logic, 10% in frontend network. This level of observability is critical in production systems like Boltline where technicians need real-time visibility into manufacturing workflows."

---

## Recommendations

### Go/No-Go Decision: ✅ **GO**

**Rationale:**
- Strategic value high (observability = production-ready)
- No blocking dependencies
- Complexity manageable with proper planning
- Interview portfolio impact significant
- Independent from other tracks (can parallelize)

### Priority: **HIGH** (Phase 2)

**Rationale:**
- After MVP core features complete
- Before scaling/performance optimization (Phase 3)
- Provides visibility into performance bottlenecks

### Suggested Phase: **Phase 2A** (Post-MVP, Pre-Advanced Features)

**Timing:**
- Start: After Issue #295 (tab integration) merged
- Duration: 2-3 weeks (3 developers × parallel PRs)
- Target: Week of May 26, 2026

---

## Implementation Roadmap

### PR Decomposition (3-Part Rollout)

#### **PR-1: Frontend Tracing & W3C Header Injection** (3-4 days)
**Goal:** Browser-side tracing foundation; inject traceparent headers on all outbound requests.

**Scope:**
- Install `@opentelemetry/sdk-trace-web`, `@opentelemetry/instrumentation-fetch`
- Create `frontend/lib/tracing.ts` module with tracer initialization
- Add `use-tracing.tsx` hook to inject headers on Apollo client + fetch calls
- Write tests for header injection with Vitest + fetch mocks
- Document: `docs/TRACING_FRONTEND.md`

**Output:**
- All fetch/GraphQL requests include `traceparent: 00-<traceId>-<spanId>-01` header
- Trace ID persists across SSE streams
- No backend changes required to test

**Type of PR:** `feat/tracing-frontend-otel`

---

#### **PR-2: Express Backend & SSE Trace Propagation** (2-3 days)
**Goal:** Extract incoming trace headers, maintain context across SSE async.

**Scope:**
- Install `@opentelemetry/instrumentation-express`
- Create `backend-express/src/middleware/tracing.ts` middleware
- Extract `traceparent`, `tracestate` from request headers
- Create AsyncLocalStorage context for SSE event emitters
- Add trace ID to SSE event payloads (optional but useful)
- Write integration tests: trace propagation through EventEmitter
- Document: `docs/TRACING_EXPRESS_SSE.md`

**Output:**
- All Express requests have active trace context
- SSE events inherit parent trace context
- Trace ID visible in EventSource data

**Type of PR:** `feat/tracing-express-sse`

---

#### **PR-3: Apollo GraphQL & Prisma ORM Tracing** (3-4 days)
**Goal:** Instrument GraphQL resolvers and database queries with trace spans.

**Scope:**
- Install `@opentelemetry/instrumentation-graphql`, `@opentelemetry/instrumentation-prisma`
- Create Apollo plugin (`backend-graphql/src/plugins/tracing.ts`)
  - Hook: `didResolveOperation` — start resolver span
  - Hook: `willSendResponse` — end resolver span, record errors
  - Hook: `didEncounterErrors` — capture error details in span
- Enable Prisma ORM tracing flag in `.env`
- Link Prisma spans to parent resolver spans via context
- Write integration tests: trace chain (query → resolver → DB)
- Document: `docs/TRACING_APOLLO_PRISMA.md`

**Output:**
- GraphQL operation spans named by operation type (query, mutation)
- SQL query spans nested under resolver spans
- Errors and latency recorded in spans
- Full trace visible in APM tool

**Type of PR:** `feat/tracing-apollo-prisma-otel`

---

### Testing Strategy

**Unit Tests (Per PR):**
- Header extraction/injection (frontend, Express)
- Span creation/context propagation (Apollo)
- Prisma flag enablement

**Integration Tests (Combined PRs):**
- End-to-end trace: React button → Express SSE → Apollo query → Prisma DB
- Verify trace ID consistency across all layers
- Test trace loss scenarios (context cleanup)

**Manual Verification:**
- Use local OTEL collector or Jaeger Docker image
- Trace single GraphQL query end-to-end
- Verify latency breakdown by layer

---

### PR Sequencing & Merge Order

**Option A: Sequential (Conservative)**
1. Merge PR-1 (Frontend) → Verify header injection works
2. Merge PR-2 (Express) → Verify context propagation
3. Merge PR-3 (Apollo/Prisma) → Full integration

**Option B: Parallel Dev with Staggered Merge (Recommended)**
1. All 3 PRs developed in parallel (developers working on separate branches)
2. PR-2 merges first (no frontend dependency, provides backend foundation)
3. PR-1 merges second (frontend headers, independent)
4. PR-3 merges last (integrates both upstream PRs)

**Recommended:** Option B for efficiency.

---

### Success Criteria

**PR-1 Success:**
- ✅ All fetch/GraphQL requests include valid traceparent header
- ✅ Header tests pass (unit + integration)
- ✅ No console errors or type mismatches

**PR-2 Success:**
- ✅ Express middleware extracts trace context from incoming headers
- ✅ SSE events inherit parent trace context
- ✅ Integration tests show trace consistency across async boundaries

**PR-3 Success:**
- ✅ Apollo plugin records resolver operation spans
- ✅ Prisma ORM records SQL query spans
- ✅ End-to-end trace shows all 4 layers (Frontend → Express → Apollo → Prisma)
- ✅ Trace appears in local APM tool (Jaeger/Zipkin)

**Overall Success:**
- ✅ User action generates single unified trace ID visible across all layers
- ✅ No performance regression (tracing overhead < 2%)
- ✅ Documentation complete (3 docs files)
- ✅ Team can read/debug traces in APM tool
- ✅ Code follows OpenTelemetry best practices

---

## Risks & Mitigation

### Risk 1: SSE Trace Context Loss in Async Handlers
**Severity:** High  
**Scenario:** Event emitted from GraphQL resolver loses trace context when streamed to client.  
**Mitigation:** Use `AsyncLocalStorage` from Node.js or `@opentelemetry/api/context` to maintain context across async boundaries. Write integration test specifically for this scenario before coding.

### Risk 2: Type Safety Violations
**Severity:** Medium  
**Scenario:** OpenTelemetry SDK types conflict with project TypeScript strict mode.  
**Mitigation:** Test package.json versions early; pin versions; use `skipLibCheck: false` if needed (rarely).

### Risk 3: Performance Overhead
**Severity:** Medium  
**Scenario:** Tracing adds 10%+ latency (unacceptable).  
**Mitigation:** Benchmark before merge (measure query latency with/without tracing). Most OTel overhead is < 2% for simple apps.

### Risk 4: Merge Conflicts Across PRs
**Severity:** Low  
**Scenario:** Three PRs modifying package.json, tsconfig.json, middleware files.  
**Mitigation:** Establish merge order (PR-2 → PR-1 → PR-3); rebase PRs after each upstream merge.

---

## Budget & Resource Estimation

| Phase | Task | Effort (Days) | Resources |
|-------|------|--------------|-----------|
| **Planning** | Design tracing architecture, write spike PR | 1 | 1 PM/Lead |
| **PR-1 (Frontend)** | Implement + test + document | 3 | 1 FE Dev |
| **PR-2 (Express)** | Implement + test + document | 2 | 1 Backend Dev |
| **PR-3 (Apollo/Prisma)** | Implement + test + document | 4 | 1 Backend Dev (experienced) |
| **Integration Testing** | E2E trace verification, APM setup | 1.5 | 1 QA/Lead |
| **Review & Docs** | PR reviews, architecture docs, talking points | 1 | 1 PM/Lead |
| **Buffer (10%)** | Unexpected issues, rework | 1.3 | – |
| **Total** | – | **13.8 days** | 2-3 developers |

**Timeline:** 2-3 weeks (overlapping work with parallel PRs)

---

## Deferred Features (Phase 2.5+)

These are **out of scope** for Issue #299 v1, but document for future work:

1. **Trace Sampling**: Implement probabilistic sampling to reduce trace volume (e.g., 10% sampling in prod)
2. **Trace Storage**: Connect to external APM backend (Datadog, New Relic, Jaeger)
3. **Span Filtering**: Filter sensitive data (passwords, API keys) from traces
4. **WebSocket Support**: Extend tracing to WebSocket connections (if SSE upgraded)
5. **Custom Instrumentation**: Add tracing to Multer (file uploads), Bcrypt (auth), Redis (caching)
6. **Trace Replay**: Build UI to visualize traces directly in dashboard (alternative to external APM)

---

## Interview Talking Points

When presenting Issue #299 work in interviews:

### Talking Point 1: End-to-End Observability
> "I implemented W3C distributed tracing across our full stack using OpenTelemetry. Every user action generates a trace ID that flows from the React frontend, through Express Server-Sent Events, into Apollo GraphQL resolvers, and down to Prisma database queries. This creates a unified trace path visible in our APM tool."

### Talking Point 2: Asynchronous Context Propagation (Hardest Part)
> "The trickiest part was maintaining trace context across asynchronous SSE event handlers. I used Node.js AsyncLocalStorage and OpenTelemetry's context propagation API to ensure that when an event was emitted from a GraphQL resolver, the trace context wasn't lost in the event stream. I wrote integration tests to verify this behavior."

### Talking Point 3: Production Debugging
> "With distributed tracing, we can now debug slow requests in production. A technician might report a slow dashboard load—we can pull the trace, see exactly which layer caused the latency (e.g., 70% in database, 20% in resolver logic), and fix the root cause. This is critical for the Boltline manufacturing platform where uptime and performance directly impact revenue."

### Talking Point 4: Type Safety
> "Everything is type-safe end-to-end. I used OpenTelemetry's TypeScript definitions to ensure trace context flowed correctly across layers. This caught bugs early and made refactoring safe."

---

## References & Dependencies

### OpenTelemetry Documentation
- [OpenTelemetry.io](https://opentelemetry.io/)
- [W3C Trace Context Standard](https://www.w3.org/TR/trace-context/)
- [@opentelemetry/api](https://github.com/open-telemetry/opentelemetry-js/tree/main/api)
- [@opentelemetry/sdk-trace-node](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-node)

### Apollo & Prisma
- [Apollo Server Plugins](https://www.apollographql.com/docs/apollo-server/integrations/plugins/)
- [Prisma ORM Tracing](https://www.prisma.io/docs/orm/tools-and-ui/prisma-studio/tracing)

### Example Implementations
- OpenTelemetry Node.js Examples: https://github.com/open-telemetry/opentelemetry-js/tree/main/examples
- Apollo Tracing: https://www.apollographql.com/docs/apollo-server/schema/directives/

---

## Approval & Sign-Off

**Product Manager Decision:**  
✅ **Approved for Planning Phase** — Ready for delegation to development teams

**Recommended Next Step:**  
1. Create GitHub Epic #300 to track 3 related PRs
2. Assign PR-1 to Frontend Developer
3. Assign PR-2 and PR-3 to Backend Developers
4. Schedule 1-hour kickoff meeting to review this design document
5. Begin Sprint/Phase 2 with Week of May 26, 2026

---

**Document Version:** 1.0  
**Last Updated:** May 17, 2026  
**Author:** PM Agent (Copilot)  
**Status:** Ready for Stakeholder Review
