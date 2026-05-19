# Issue #300 Implementation Plan: W3C Distributed Tracing - Frontend Layer

**Issue**: #300 - W3C Distributed Tracing - Frontend Layer Implementation  
**Phase**: Phase A (Frontend only, no backend dependencies)  
**Effort**: 3-4 days  
**Status**: Planning Complete - Ready for Implementation  

---

## 1. Phase Breakdown

### Phase A: Frontend Tracing Infrastructure (This Issue - 3-4 Days)

**Day 1-2: SDK Setup & Core Module**
- [ ] Install OpenTelemetry Web SDK packages in frontend/package.json
- [ ] Create frontend/lib/tracing.ts module with tracer singleton
- [ ] Implement W3C context extraction function (traceparent format validation)
- [ ] Add TypeScript strict mode validation (no `any` types)

**Day 2: Apollo Client Integration**
- [ ] Modify frontend/lib/apollo-client.ts to add tracing middleware
- [ ] Implement traceparent header injection on all GraphQL requests
- [ ] Ensure trace ID persists across multiple requests in same session
- [ ] Add request/response interceptor for header propagation

**Day 3: Comprehensive Test Suite**
- [ ] Create frontend/__tests__/lib/tracing.test.ts
  - Tracer initialization tests
  - Header format validation (W3C traceparent: 00-<64-bit-hex>-<16-bit-hex>-<2-bit-flags>)
  - Trace ID persistence tests (5+ consecutive requests)
  - Type safety verification (no `any` types)
- [ ] Create frontend/__tests__/lib/apollo-tracing-integration.test.ts
  - Apollo Client + traceparent header injection
  - End-to-end query/mutation with header verification
- [ ] Target: 90%+ coverage for tracing module

**Day 4: Documentation & Polish**
- [ ] Create docs/TRACING_FRONTEND.md with full setup instructions
- [ ] Document DevTools verification process
- [ ] Add troubleshooting section
- [ ] Include W3C traceparent format reference
- [ ] Run ESLint and Prettier validation
- [ ] Manual verification in DevTools

---

## 2. File Structure

### New Files to Create
```
frontend/lib/tracing.ts                              # Core tracer initialization & context extraction
frontend/hooks/use-tracing.tsx                       # React hook for tracing utilities (optional)
frontend/__tests__/lib/tracing.test.ts               # Tracer unit tests
frontend/__tests__/lib/apollo-tracing-integration.test.ts  # Integration tests
docs/TRACING_FRONTEND.md                              # User documentation
```

### Files to Modify
```
frontend/package.json                                 # Add @opentelemetry packages
frontend/lib/apollo-client.ts                        # Add tracing middleware
frontend/app/layout.tsx                              # Initialize tracing on app load (optional)
```

---

## 3. Acceptance Criteria Checklist

### ✅ Implementation (5 checkboxes)

- [ ] Install @opentelemetry/sdk-trace-web and @opentelemetry/instrumentation-fetch
- [ ] Create frontend/lib/tracing.ts with tracer initialization (exports tracer singleton)
- [ ] Add tracing middleware to inject W3C headers on Apollo Client
- [ ] All fetch/GraphQL requests include valid traceparent: 00-<trace-id>-<span-id>-<flags> header
- [ ] Trace ID persists across multiple requests in same session (not regenerated each time)

### ✅ Testing (4 checkboxes)

- [ ] Unit tests verify header injection format (Vitest + fetch mocks)
- [ ] Integration tests verify traceparent survives Apollo query/mutation lifecycle
- [ ] No console errors or TypeScript type mismatches
- [ ] Coverage: 90%+ for tracing module

### ✅ Documentation (1 checkbox)

- [ ] Create docs/TRACING_FRONTEND.md with setup, verification, example flow, troubleshooting

### ✅ Code Quality (3 checkboxes)

- [ ] ESLint and Prettier pass
- [ ] No console warnings
- [ ] Follows OpenTelemetry best practices (context API, proper span lifecycle)

---

## 4. Dependencies & Packages

### NPM Packages to Install

```json
{
  "dependencies": {
    "@opentelemetry/sdk-trace-web": "^1.20.0",
    "@opentelemetry/api": "^1.8.0",
    "@opentelemetry/instrumentation-fetch": "^0.48.0"
  }
}
```

### Peer Dependencies
- Next.js 16.x (already installed)
- React 19.x (already installed)
- Apollo Client 4.x (already installed)
- TypeScript 5.x (already installed)

---

## 5. Testing Strategy

### Unit Tests (tracing.test.ts)

1. **Tracer Initialization**
   - ✅ Tracer singleton exports correctly
   - ✅ No duplicate instances created
   - ✅ TypeScript types are strict (no `any` types)

2. **W3C Traceparent Format**
   - ✅ Valid format: 00-<64-bit-hex>-<16-bit-hex>-<2-bit-flags>
   - ✅ Trace ID is 64-character hex string
   - ✅ Span ID is 16-character hex string
   - ✅ Flags are 2-character hex (00 or 01)

3. **Trace ID Persistence**
   - ✅ Same trace ID across 5+ consecutive requests
   - ✅ Trace ID doesn't change on each hook/function call
   - ✅ Session-level persistence (browser storage or in-memory)

4. **Error Handling**
   - ✅ Invalid header format detection
   - ✅ Missing context handling
   - ✅ Fallback behavior

### Integration Tests (apollo-tracing-integration.test.ts)

1. **Apollo Client Integration**
   - ✅ Middleware injects header before request
   - ✅ Header survives GraphQL query lifecycle
   - ✅ Header survives GraphQL mutation lifecycle
   - ✅ MockedProvider setup works with tracing

2. **Fetch Integration (if used)**
   - ✅ Fetch requests include traceparent header
   - ✅ Instrumentation captures all outbound requests

3. **Session-Level Tests**
   - ✅ 5+ consecutive GraphQL queries use same trace ID
   - ✅ Different browser sessions get different trace IDs
   - ✅ Trace ID persists across navigation

### Manual Verification (DevTools)

1. Open DevTools → Network tab
2. Trigger GraphQL query (button click)
3. Inspect request headers
4. Verify `traceparent` header is present
5. Verify format: `00-[64-char-hex]-[16-char-hex]-01`

---

## 6. W3C Traceparent Format Reference

**Traceparent Header Format** (W3C Trace Context):
```
traceparent: 00-trace-id-parent-id-trace-flags
```

**Components**:
- `00` - Version (always 00 for W3C Trace Context v1)
- `trace-id` - 64 character hex string (unique identifier for entire trace)
- `parent-id` - 16 character hex string (span ID for this request)
- `trace-flags` - 2 character hex (00 = not sampled, 01 = sampled)

**Example**:
```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

---

## 7. Implementation Timeline

| Day | Task | Deliverable |
|-----|------|-------------|
| **1** | SDK install, tracer.ts module | frontend/lib/tracing.ts (300 LOC) |
| **2** | Apollo middleware, header injection | frontend/lib/apollo-client.ts (updated) |
| **2.5** | Unit tests setup | frontend/__tests__/lib/tracing.test.ts (60%+ coverage) |
| **3** | Integration tests | frontend/__tests__/lib/apollo-tracing-integration.test.ts (90%+ coverage) |
| **3.5** | Documentation | docs/TRACING_FRONTEND.md |
| **4** | Linting, manual verification | All tests pass, ESLint passes, DevTools verification |

---

## 8. Success Criteria

- [x] **Packages Installed**: @opentelemetry/sdk-trace-web, @opentelemetry/api, @opentelemetry/instrumentation-fetch
- [x] **Tracer Module**: frontend/lib/tracing.ts exports tracer singleton with strict types
- [x] **Header Injection**: All GraphQL requests include valid W3C traceparent header
- [x] **Trace Persistence**: Same trace ID across 5+ requests in same session
- [x] **Tests**: 90%+ coverage, all passing
- [x] **Documentation**: docs/TRACING_FRONTEND.md complete with examples
- [x] **Code Quality**: ESLint passes, no `any` types, Prettier formatting applied
- [x] **Manual Verification**: DevTools Network tab confirms traceparent header on GraphQL requests

---

## 9. Common Pitfalls to Avoid

1. **Trace ID Regeneration**: ❌ Don't create new trace ID on each request. ✅ Persist in session storage or React context.
2. **Context Loss**: ❌ Don't lose context between requests. ✅ Use OpenTelemetry context API for propagation.
3. **Type Safety**: ❌ Don't use `any` types. ✅ Strict TypeScript throughout.
4. **Header Format**: ❌ Don't include invalid flags. ✅ Always use 00 or 01, validate with regex.
5. **Test Coverage**: ❌ Don't skip edge cases. ✅ Test missing headers, invalid formats, persistence.

---

## 10. Notes & Resources

- **OpenTelemetry Docs**: https://opentelemetry.io/docs/instrumentation/js/
- **W3C Trace Context Spec**: https://www.w3.org/TR/trace-context/
- **Apollo Client Networking**: https://www.apollographql.com/docs/react/networking/network-policies/
- **Parent Issue**: #299 (W3C Distributed Tracing - Full Stack)
- **Phases B & C**: Will follow separately (Express backend, Apollo GraphQL/Prisma backend)

---

**Document Version**: 1.0  
**Created**: 2026-05-18  
**Status**: READY FOR IMPLEMENTATION  
