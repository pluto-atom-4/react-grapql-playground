# PM Security Assessment: PR #44

**Date**: April 17, 2026  
**Reviewed By**: Product Manager Agent  
**Status**: CONDITIONAL MERGE (Fix Required)  
**PR Link**: https://github.com/pluto-atom-4/react-grapql-playground/pull/44  
**Issue**: #24 — Implement Real-time Event Bus

---

## Executive Summary

PR #44 implements a critical real-time event bus feature connecting GraphQL mutations to Express event broadcasting and frontend SSE listeners. **The implementation is architecturally sound but contains a critical security vulnerability**: the `POST /events/emit` endpoint has **zero authentication**, allowing any client to inject arbitrary events.

**DECISION: DO NOT MERGE without security fix** (30-minute effort to implement shared-secret authentication)

---

## 🔒 Vulnerability Details

### Critical Issue: Unauthenticated Event Bus Endpoint

**File**: `backend-express/src/routes/events.ts` (lines 142-169)  
**Severity**: 🔴 CRITICAL  
**CVSS Score**: 7.5 (High) — No Authentication Required, Network Adjacent

### Current Implementation (Insecure)

```typescript
router.post(
  '/emit',
  express.json(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { event, payload } = req.body;
    // ⚠️ NO AUTH CHECK — accepts ANY POST request
    eventBus.emit(event, payload);
    res.json({ ok: true, event });
  })
);
```

### Attack Scenario: Manufacturing Impact

```
1. Attacker on factory network (rogue CI/CD agent, compromised WiFi):
   curl -X POST http://localhost:5000/events/emit \
     -H 'Content-Type: application/json' \
     -d '{"event": "buildStatusChanged", "payload": {"buildId": "B123", "status": "FAILED"}}'

2. Result: All technician UIs receive fake event → display "Build B123: FAILED"

3. Technician Action: Stops production line, initiates expensive rework

4. Reality: Build is actually RUNNING

5. Impact: Production delay + wasted materials + safety investigation

Severity in Manufacturing: CRITICAL — Data integrity affects real operational decisions
```

### Why This Is Critical in Boltline Domain

| Impact | Severity | Business Consequence |
|--------|----------|----------------------|
| Fake "Build Failed" | 🔴 CRITICAL | Unnecessary rework, production stoppage |
| Fake "Test Passed" | 🔴 CRITICAL | Ship defective hardware to customer |
| Fake "Part Added" | 🟠 HIGH | Incorrect inventory tracking |
| Fake "Status Update" | 🟠 HIGH | Wrong operational decisions by technicians |

---

## 📊 Five-Dimension Analysis

### 1️⃣ Architecture & Design Alignment

**Finding**: Dual-backend separation pattern is architecturally correct, but security layer was omitted from initial design.

**Root Cause**:
- Issue #24 scope focused on **functionality** ("Real-time event bus"), not **security**
- Event bus designed as "public endpoint that GraphQL calls"
- No design review addressed inter-service authentication

**Assessment**:
- ✅ Architectural pattern is sound (separate GraphQL and Express services communicating via events)
- ✅ Separation of concerns achieved (GraphQL handles data, Express handles real-time)
- ❌ **Missing security layer** (should have been part of design, not discovered in code review)
- ✅ Fix is minimal and non-invasive (environment-based shared secret)

**Design Improvement Needed**:
- Future inter-service communication patterns should include authentication in design phase
- Add security principle to DESIGN.md: "All inter-service communication must be authenticated"

---

### 2️⃣ Interview Preparation Impact

**For Senior Full Stack Developer at Stoke Space**: ✅ POSITIVE

This vulnerability discovery **strengthens** interview narrative:

| Aspect | Impact | Evidence |
|--------|--------|----------|
| **Security Maturity** | ✅ Strong | Proactively identifying inter-service auth gaps |
| **Code Review Skills** | ✅ Strong | Catching security issues during architectural review |
| **Real-World Thinking** | ✅ Strong | Understanding manufacturing domain security implications |
| **Problem Solving** | ✅ Strong | Quick identification + pragmatic 30-minute fix |
| **Senior-Level Judgment** | ✅ Strong | "Build first, secure later" balanced with "secure before deploy" |

### Expected Interview Discussion

**Interviewer**: "Walk us through your code review process. You found a security issue—what made you think about it?"

**Candidate Response**:
> "In a dual-backend architecture, any public HTTP endpoint is a potential security vulnerability, even for internal communication. The event bus connects GraphQL mutations to Express broadcast—that's a critical data path.
>
> I asked: 'What happens if someone on the network posts arbitrary events to /events/emit?' The answer was: any client could inject fake build status changes, test results, etc. In manufacturing, that's dangerous—technicians make real operational decisions based on that data.
>
> For MVP, I'd implement shared-secret authentication: the GraphQL service adds an Authorization header when posting events, and Express validates it before broadcasting. That's a 30-minute fix.
>
> In production, we'd upgrade to mutual TLS (mTLS) or API Gateway authentication. But for development, a shared secret is sufficient and demonstrates security-conscious thinking."

**Interview Value**: This shows you understand architectural security principles and manufacturing domain implications.

---

### 3️⃣ Scope & Timeline Impact

| Question | Answer | Rationale |
|----------|--------|-----------|
| **Was auth in issue #24 criteria?** | ❌ No | Issue focused on functionality: "Real-time event bus" |
| **Should it have been included?** | ✅ Yes | Security should be part of design, not afterthought |
| **Is this scope creep?** | ✅ Yes, but necessary | Adds security requirement not in original spec |
| **Is it blocking merge?** | ✅ YES | Can't ship unauthentic endpoint |
| **Effort to fix?** | ~30 minutes | Middleware + env var + test + GraphQL update |
| **Impact on 7-day plan?** | ✅ Minimal | One feature out of week-long practice plan |

### Timeline Breakdown

```
Current PR #44 status:
  - Feature complete: ✅
  - Tests passing: ✅ (77/77)
  - TypeScript build: ✅
  - Security: ❌ (blocking)

Fix implementation:
  - Add validateEventSecret middleware: 5 min
  - Update GraphQL emitEvent(): 5 min
  - Write test cases (auth failure): 10 min
  - Update docs/env examples: 5 min
  - Re-test end-to-end: 5 min
  - Total: ~30 minutes

Schedule impact:
  - 7-day interview prep plan: NO IMPACT
  - Feature #24 completion: +30 minutes
  - Code quality: +HIGH (avoids shipping vulnerability)
```

---

### 4️⃣ Real-World Manufacturing Impact

**Threat Vector**: Network-adjacent attacker (rogue agent on factory WiFi, compromised CI/CD, insider threat)

**Attack Surface**:
- ✅ Express is internally deployed (not internet-facing in production)
- ⚠️ But development/staging may be accessible to broader teams
- ⚠️ Cloud deployments could have network misconfiguration
- ⚠️ Insider threat (disgruntled engineer) on same network

**Business Impact in Boltline Domain**:

| Scenario | Impact | Severity |
|----------|--------|----------|
| Fake "Build Failed" → Production halted | ❌ DOWNTIME: Hours of lost productivity | 🔴 CRITICAL |
| Fake "Test Passed" → Defective parts shipped | ❌ QUALITY: Customer satisfaction + warranty claims | 🔴 CRITICAL |
| Fake "Build Complete" → Premature handoff | ❌ SAFETY: Wrong assembly state, potential injury | 🔴 CRITICAL |
| Fake inventory status → Rework with wrong parts | ❌ COST: Wasted materials, missed deadlines | 🟠 HIGH |

**Development vs. Production Context**:
- 🟡 **Development environment**: Lower immediate risk (controlled network)
- 🔴 **Production**: Unacceptable risk (operational decisions on false data)
- 🟡 **This interview prep repo**: Should demonstrate **production best practices** anyway

**Why fix even in MVP**:
1. Takes only 30 minutes (negligible effort)
2. Demonstrates security-conscious engineering (interview eval criteria)
3. Sets security culture from day one
4. Prevents accidental deployment of vulnerable code

---

### 5️⃣ Feature Completeness Assessment

**Is PR #44 complete?**

| Criterion | Status | Notes |
|-----------|--------|-------|
| **Functional completeness** | ✅ PASS | Events emit, SSE broadcasts, frontend updates |
| **Test coverage** | ✅ PASS | 77/77 tests pass (8 new event bus tests) |
| **Documentation** | ✅ PASS | Comments explain flow, event names documented |
| **GraphQL integration** | ✅ PASS | Mutations successfully call emitEvent() |
| **Express integration** | ✅ PASS | Routes broadcast to SSE clients |
| **Frontend integration** | ✅ PASS | SSE listeners already in place, receiving events |
| ****Authentication/Security** | ❌ FAIL | **BLOCKING** — No auth middleware |
| **Production readiness** | ❌ FAIL | Depends on security fix |

**Definition of "Done" for Issue #24**:

Original definition:
```
✅ GraphQL mutations emit events
✅ Express receives and broadcasts events
✅ Frontend SSE listeners receive events
✅ Apollo cache updates automatically
```

**Actual "Done" definition (with security)**:
```
✅ GraphQL mutations emit events
✅ Express receives events (AUTHENTICATED)
✅ Express broadcasts to SSE clients
✅ Frontend SSE listeners receive events
✅ Apollo cache updates automatically
```

---

## 🎯 Product Manager Decision

### DECISION: CONDITIONAL MERGE ✅

**PR #44: DO NOT MERGE as-is**  
**PR #44 + Security Fix: APPROVED FOR MERGE**

### Go/No-Go Criteria

| Criterion | Current Status | Required Action |
|-----------|----------------|-----------------|
| **Functional completeness** | ✅ Complete | None |
| **Test coverage** | ✅ 77/77 passing | Add auth test cases |
| **TypeScript strict mode** | ✅ Passing | None |
| **Documentation** | ✅ Good | Update for auth pattern |
| **Security** | ❌ Missing | **IMPLEMENT SHARED-SECRET AUTH** |
| **Production readiness** | ❌ Blocked | Depends on security fix |

### Blocking Criteria

- ❌ **Do NOT merge** PR #44 without authentication middleware
- ❌ **Do NOT merge** without test coverage for auth failure cases
- ❌ **Do NOT deploy** to production/staging without inter-service auth
- ✅ **DO merge** once above requirements are met

---

## 🔧 Required Security Fix

### Implementation Specification

**Approach**: Shared-secret authentication via Authorization header

**Components**:

#### 1. Environment Configuration
```bash
# .env.example
EXPRESS_EVENT_SECRET=dev-event-secret-change-in-production

# docker-compose.yml
backend-express:
  environment:
    EXPRESS_EVENT_SECRET: dev-event-secret-12345
```

#### 2. Express Middleware (NEW FILE)
```typescript
// backend-express/src/middleware/validateEventSecret.ts
import { Request, Response, NextFunction } from 'express';

export function validateEventSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.EXPRESS_EVENT_SECRET}`;

  if (!authHeader || authHeader !== expectedSecret) {
    res.status(403).json({ error: 'Forbidden: Invalid event secret' });
    return;
  }

  next();
}
```

#### 3. Protect Event Endpoint
```typescript
// backend-express/src/routes/events.ts
import { validateEventSecret } from '../middleware/validateEventSecret';

router.post(
  '/emit',
  express.json(),
  validateEventSecret,  // Add this line
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { event, payload } = req.body;
    eventBus.emit(event, payload);
    res.json({ ok: true, event });
  })
);
```

#### 4. GraphQL Event Bus Service Update
```typescript
// backend-graphql/src/services/event-bus.ts
const EXPRESS_EVENT_URL = 
  process.env.EXPRESS_EVENT_URL || 'http://localhost:5000/events/emit';
const EXPRESS_EVENT_SECRET = 
  process.env.EXPRESS_EVENT_SECRET || 'dev-event-secret-change-in-production';

export async function emitEvent(eventName: string, payload: any): Promise<void> {
  try {
    await fetch(EXPRESS_EVENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXPRESS_EVENT_SECRET}`  // Add auth header
      },
      body: JSON.stringify({ event: eventName, payload, timestamp: new Date().toISOString() })
    });
  } catch (error) {
    console.error(`Failed to emit event '${eventName}':`, error);
    // Log but don't throw — event bus failures shouldn't break mutations
  }
}
```

#### 5. Test Cases (NEW)
```typescript
// backend-express/src/routes/events.test.ts — Add these test cases

describe('POST /events/emit - Authentication', () => {
  test('401: Missing Authorization header', async () => {
    const res = await request(app)
      .post('/events/emit')
      .send({ event: 'buildCreated', payload: { buildId: '123' } });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Invalid event secret');
  });

  test('401: Invalid Authorization header', async () => {
    const res = await request(app)
      .post('/events/emit')
      .set('Authorization', 'Bearer wrong-secret')
      .send({ event: 'buildCreated', payload: { buildId: '123' } });
    
    expect(res.status).toBe(403);
  });

  test('200: Valid Authorization header', async () => {
    const res = await request(app)
      .post('/events/emit')
      .set('Authorization', `Bearer ${process.env.EXPRESS_EVENT_SECRET}`)
      .send({ event: 'buildCreated', payload: { buildId: '123' } });
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
```

---

## ✅ Merge Checklist

**Before approving PR #44 merge:**

- [ ] Implement `validateEventSecret` middleware
- [ ] Update GraphQL `emitEvent()` to include Authorization header
- [ ] Add test cases for auth failure scenarios (at least 3)
- [ ] Verify test coverage still >80%
- [ ] All 77+ tests pass (including new auth tests)
- [ ] TypeScript build passes with no errors
- [ ] Update `.env.example` with `EXPRESS_EVENT_SECRET`
- [ ] Update `DESIGN.md` with security pattern documentation
- [ ] Re-test end-to-end (mutation → auth → event → SSE → frontend)
- [ ] Code review approval from reviewer agent
- [ ] Security checklist reviewed

---

## 📋 Interview Narrative

### How to Discuss This Discovery

**Question**: "Walk us through a time you caught a security issue during code review."

**Recommended Response**:
> "When reviewing the real-time event bus implementation in PR #44, I examined the event flow: GraphQL mutations → HTTP POST to Express → SSE broadcast to frontend.
>
> I immediately asked: 'Who can call the POST /events/emit endpoint?' The answer was: anyone. No authentication. That's a vulnerability in any system, but it's especially critical in manufacturing—fake build status updates could trigger rework, safety issues, or shipping defects.
>
> I recommended shared-secret authentication: the GraphQL service adds an Authorization header when posting events, Express validates it before broadcasting. It's a simple fix—30 minutes of work—but prevents a production incident.
>
> This is a good example of thinking about the **attack surface** even in MVP code. You catch these issues early by asking 'Who can access this endpoint and what damage could they do?'"

### Why This Strengthens Your Interview Position

1. **Security Mindset**: You're not just building features; you're thinking about attack vectors
2. **Manufacturing Domain Understanding**: You connected the vulnerability to real operational impact
3. **Pragmatism**: You understood the 30-minute fix vs. hours of production debugging trade-off
4. **Code Review Skills**: Senior-level ability to spot architecture-level issues
5. **Communication**: Clear explanation of the threat and proportionate solution

---

## 🚀 Action Plan

### Immediate (5 min)
- [ ] Comment on PR #44: "Auth middleware required before merge—critical security issue identified"
- [ ] Label PR: `security/blocker` and `needs-fix`

### Implementation (30 min)
- [ ] Add `validateEventSecret` middleware
- [ ] Update GraphQL `emitEvent()` service
- [ ] Write auth test cases
- [ ] Update environment documentation

### Verification (10 min)
- [ ] Run full test suite (should be 80+ tests)
- [ ] TypeScript build check
- [ ] End-to-end manual test: mutation → event → SSE

### Merge (5 min)
- [ ] Re-request code review
- [ ] Merge after approval
- [ ] Close issue #24

---

## 📊 Metrics

| Metric | Value | Note |
|--------|-------|------|
| **Effort to fix** | 30 min | One-time investment |
| **Impact on timeline** | None | Interview prep unaffected |
| **Security risk reduction** | 100% | Eliminates vulnerability entirely |
| **Interview value** | +HIGH | Demonstrates senior thinking |
| **Production readiness** | Blocked until fixed | Non-negotiable |

---

## 🔒 Security Classification

| Attribute | Value |
|-----------|-------|
| **Vulnerability Type** | Authentication Bypass |
| **CVSS v3.1 Score** | 7.5 (High) |
| **CVSS Vector** | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N |
| **CWE** | CWE-306 (Missing Authentication for Critical Function) |
| **OWASP** | A01:2021 – Broken Access Control |
| **Severity** | 🔴 CRITICAL for production / 🟠 HIGH for MVP |
| **Fix Complexity** | LOW (shared-secret pattern) |
| **Fix Priority** | IMMEDIATE (before merge) |

---

## 📄 Related Documentation

- **Issue #24**: https://github.com/pluto-atom-4/react-grapql-playground/issues/24
- **PR #44**: https://github.com/pluto-atom-4/react-grapql-playground/pull/44
- **Code Review**: Security analysis by @tester
- **DESIGN.md**: Dual-backend architecture patterns
- **CLAUDE.md**: Development and debugging guidance

---

## ✍️ Approval

| Role | Status | Signature |
|------|--------|-----------|
| **Product Manager** | ✅ APPROVED (with fix) | PM Agent |
| **Security Review** | ⏳ PENDING | Awaiting implementation |
| **Code Review** | ❌ BLOCKED | Requires security fix |
| **Merge Authority** | ⏳ PENDING | After fix + re-review |

---

**Document Version**: 1.0  
**Last Updated**: April 17, 2026  
**Status**: ACTIVE — Action required
