# Resource Provisioning & CI/CD Workflow Strategy

**Document Version**: 1.0  
**Date**: April 2025  
**Audience**: Developers, DevOps, Stoke Space interview preparation  
**Status**: Strategic Framework

---

## Executive Summary

This document outlines the resource provisioning and CI/CD strategy for **react-grapql-playground**—a dual-backend monorepo designed for Stoke Space interview preparation and real-world manufacturing workload patterns.

**Key Strategic Decisions**:

1. **Local Development**: Docker Compose for PostgreSQL; separate npm processes for three layers
2. **CI/CD Pipeline**: GitHub Actions with parallel job strategy for fast feedback
3. **Resource Allocation**: Production-ready patterns; optimized for manufacturing reliability
4. **Scaling Strategy**: Independent scaling per layer; event-driven architecture
5. **Interview Alignment**: Demonstrates understanding of DevOps, observability, and distributed systems

---

## Part 1: Local Development Environment

### Goal
Developers can run all three layers locally with minimal setup, matching production architecture patterns.

### Prerequisites

```bash
# Node/pnpm
node --version    # v20 LTS
pnpm --version    # v8+

# Docker
docker --version
docker-compose --version

# Git
git --version
```

### Local Startup (Docker + npm)

#### Option A: Full Stack with One Command

```bash
# Start PostgreSQL container
docker-compose up -d

# Install dependencies across all workspaces
pnpm install

# Start all three layers (in separate terminals or as background processes)
pnpm dev

# Or individually:
pnpm dev:frontend     # Next.js on :3000
pnpm dev:graphql      # Apollo on :4000
pnpm dev:express      # Express on :5000
```

**Expected Output**:
```
✓ PostgreSQL running on localhost:5432
✓ Frontend running on http://localhost:3000
✓ GraphQL running on http://localhost:4000/graphql
✓ Express running on http://localhost:5000
✓ SSE events on http://localhost:5000/events
```

#### Option B: Separate Terminals

```bash
# Terminal 1: PostgreSQL
docker-compose up postgresql

# Terminal 2: GraphQL Backend
cd backend-graphql && pnpm dev

# Terminal 3: Express Backend
cd backend-express && pnpm dev

# Terminal 4: Frontend
cd frontend && pnpm dev
```

### Docker Compose Configuration

**File**: `docker-compose.yml`

```yaml
version: "3.8"

services:
  postgresql:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: password
      POSTGRES_DB: boltline
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend-graphql/db/schema.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U root -d boltline"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Environment Configuration

**File**: `.env` (local development)

```env
# Database
DATABASE_URL=postgresql://root:password@localhost:5432/boltline

# Authentication
JWT_SECRET=dev-secret-key-not-for-production

# Service URLs (for inter-service communication)
GRAPHQL_URL=http://localhost:4000/graphql
EXPRESS_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=development

# Logging
LOG_LEVEL=debug
```

---

## Part 2: CI/CD Pipeline Architecture

### Goal
Fast, reliable feedback on code quality, tests, and production readiness before merge.

### GitHub Actions Workflow Overview

**File**: `.github/workflows/ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop, feature/**]
  pull_request:
    branches: [main, develop]

jobs:
  # Phase 1: Lint & Format (Fast feedback ~2 min)
  quality:
    runs-on: ubuntu-latest
    name: Code Quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check

  # Phase 2: Security Audit (Fast ~1 min)
  security:
    runs-on: ubuntu-latest
    name: Security Audit
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit

  # Phase 3: Build & Test (Parallel ~5-10 min)
  build-test:
    needs: [quality, security]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [frontend, backend-graphql, backend-express]
    name: Build & Test - ${{ matrix.package }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm -F ${{ matrix.package }} build
      - run: pnpm -F ${{ matrix.package }} test

  # Phase 4: Integration Tests (Against all layers)
  integration:
    needs: [build-test]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: root
          POSTGRES_PASSWORD: password
          POSTGRES_DB: boltline
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    name: Integration Tests
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setting@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://root:password@localhost:5432/boltline

  # Phase 5: E2E Tests (Optional, slower)
  e2e:
    needs: [build-test]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    name: E2E Tests (Main Branch)
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  # Phase 6: Coverage Report (Informational)
  coverage:
    needs: [build-test]
    runs-on: ubuntu-latest
    name: Code Coverage
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setting@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm test --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### CI/CD Pipeline Phases

#### Phase 1: Code Quality (Parallel, 2 min)

**Jobs**:
- `pnpm lint` — ESLint across all packages
- `pnpm format:check` — Prettier formatting

**Exit Criteria**:
- ✅ No ESLint violations
- ✅ Code is properly formatted
- ✅ TypeScript strict mode passes

**Developer Action on Failure**:
```bash
pnpm lint:fix
pnpm format
git add .
git commit --amend --no-edit
git push
```

#### Phase 2: Security Audit (1 min)

**Job**:
- `pnpm audit` — Scans dependencies for vulnerabilities

**Exit Criteria**:
- ✅ No critical vulnerabilities
- ✅ Dependency versions up-to-date

**Developer Action on Failure**:
```bash
pnpm audit --fix  # For safe updates
# For complex updates, escalate to team
```

#### Phase 3: Build & Test (5-10 min, Parallel)

**Jobs** (Matrix Strategy):
- Build & test `frontend`
- Build & test `backend-graphql`
- Build & test `backend-express`

**Exit Criteria per Package**:
- ✅ Builds successfully (`pnpm build`)
- ✅ All tests pass (`pnpm test`)
- ✅ Test coverage >80% (new code)

**Developer Action on Failure**:
```bash
# Reproduce locally
pnpm test path/to/test.ts --watch

# Debug in IDE or with logs
console.log('Debug info');
pnpm test --reporter=verbose

# Fix and commit
git push
```

#### Phase 4: Integration Tests (Parallel, 3-5 min)

**Job**:
- Cross-layer integration tests
- Requires PostgreSQL service container
- Tests data flow: Frontend → GraphQL → Express → SSE

**Exit Criteria**:
- ✅ Real-time event coordination works
- ✅ DataLoader batching verified
- ✅ File uploads + GraphQL integration tested
- ✅ N+1 query prevention confirmed

**Test Scenarios**:
1. Create Build → Query Build → See cached result
2. Upload File → GraphQL fetches file metadata
3. Webhook received → SSE broadcasts to clients
4. Mutation emits event → Other clients receive via SSE

#### Phase 5: E2E Tests (10-15 min, Conditional)

**Job** (Only on main branch):
- Playwright E2E tests
- Full application in browser
- Real database

**Exit Criteria**:
- ✅ Complete workflows work end-to-end
- ✅ UI interactions responsive
- ✅ Real-time updates visible

**Scenarios**:
1. User creates build → sees in list → edits status
2. User uploads file → sees in UI → GraphQL query returns file URL
3. Two browsers open → one updates status → other sees SSE notification

#### Phase 6: Coverage Report (Informational)

**Job**:
- Generate coverage report
- Upload to Codecov (optional)
- Comment PR with coverage delta

**Metrics**:
- Overall coverage %
- Per-package coverage
- Untested critical paths

---

## Part 3: Deployment Strategy (Production-Ready)

### Goal
Production deployments with minimal risk, fast rollback, and observability.

### Deployment Environments

```
Local Dev → GitHub (CI) → Staging → Production
```

### Environment Configuration

| Environment | Database       | Frontend URL        | GraphQL URL            | Express URL            | Auth        |
|-------------|----------------|---------------------|------------------------|------------------------|-------------|
| Development | Local Docker   | http://localhost:3000 | http://localhost:4000  | http://localhost:5000  | JWT (dev)   |
| Staging     | Cloud DB       | staging.example.com | staging-api.example.com | staging-api.example.com | JWT (staging) |
| Production  | Cloud DB (HA)  | app.example.com    | api.example.com        | api.example.com        | JWT (prod)  |

### Deployment Workflow

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  workflow_dispatch:  # Manual trigger
  push:
    branches: [main]

jobs:
  build-images:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Build Docker images for each layer
      - name: Build Frontend
        run: docker build -t frontend:${{ github.sha }} ./frontend
      
      - name: Build GraphQL Backend
        run: docker build -t backend-graphql:${{ github.sha }} ./backend-graphql
      
      - name: Build Express Backend
        run: docker build -t backend-express:${{ github.sha }} ./backend-express

      # Push to Docker registry (e.g., Docker Hub, ECR, GHCR)
      - name: Push Images
        run: |
          docker push frontend:${{ github.sha }}
          docker push backend-graphql:${{ github.sha }}
          docker push backend-express:${{ github.sha }}

  deploy-staging:
    needs: build-images
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          # Deploy images to staging environment
          kubectl set image deployment/frontend frontend=frontend:${{ github.sha }} \
            -n staging
          kubectl set image deployment/backend-graphql backend-graphql=backend-graphql:${{ github.sha }} \
            -n staging
          kubectl set image deployment/backend-express backend-express=backend-express:${{ github.sha }} \
            -n staging

  smoke-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - name: Run Smoke Tests
        run: |
          # Verify staging deployment
          curl -f https://staging.example.com/ || exit 1
          curl -f https://staging-api.example.com/graphql || exit 1
          curl -f https://staging-api.example.com/health || exit 1

  deploy-production:
    needs: smoke-tests
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          kubectl set image deployment/frontend frontend=frontend:${{ github.sha }} \
            -n production
          kubectl set image deployment/backend-graphql backend-graphql=backend-graphql:${{ github.sha }} \
            -n production
          kubectl set image deployment/backend-express backend-express=backend-express:${{ github.sha }} \
            -n production

  notify:
    needs: deploy-production
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        run: |
          # Send deployment notification
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"Deployment successful: ${{ github.sha }}"}'
```

### Rollback Strategy

```bash
# If production deployment fails:
kubectl set image deployment/frontend frontend=frontend:${{ previous.sha }} \
  -n production

# Check deployment status
kubectl rollout status deployment/frontend -n production
```

---

## Part 4: Resource Allocation & Scaling

### Local Development

| Component | CPU | Memory | Disk | Notes |
|-----------|-----|--------|------|-------|
| PostgreSQL | 0.5 | 512 MB | 10 GB | Docker container |
| GraphQL | 1.0 | 512 MB | - | npm process |
| Express | 0.5 | 256 MB | 5 GB | uploads storage |
| Frontend | 1.0 | 512 MB | - | Next.js dev server |
| **Total** | **3.0** | **1.8 GB** | **15 GB** | Typical laptop |

### Staging Environment

| Component | Replicas | CPU per | Memory per | Auto-Scale |
|-----------|----------|---------|------------|------------|
| PostgreSQL | 1 | 2 | 2 GB | N/A (stateful) |
| GraphQL | 2 | 1 | 512 MB | Yes (2-5 replicas) |
| Express | 2 | 1 | 512 MB | Yes (2-5 replicas) |
| Frontend CDN | - | - | - | Automatic |

**Kubernetes Manifests**:

```yaml
# backend-graphql deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-graphql
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend-graphql
  template:
    metadata:
      labels:
        app: backend-graphql
    spec:
      containers:
      - name: backend-graphql
        image: backend-graphql:latest
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: postgres-url
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-graphql-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-graphql
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Production Environment

| Component | Replicas | CPU per | Memory per | Auto-Scale | Availability |
|-----------|----------|---------|------------|------------|--------------|
| PostgreSQL | 3 | 4 | 8 GB | N/A (HA cluster) | Multi-AZ |
| GraphQL | 3 | 2 | 1 GB | Yes (3-10 replicas) | Multi-AZ |
| Express | 3 | 2 | 1 GB | Yes (3-10 replicas) | Multi-AZ |
| Frontend CDN | - | - | - | Global | Global CDN |

**Scaling Triggers**:
- CPU >70% → scale up
- CPU <30% → scale down
- Memory >80% → alert + scale up
- Response time >500ms → scale up

---

## Part 5: Monitoring & Observability

### Key Metrics by Layer

#### Frontend (Next.js)
- Page load time (< 3s)
- Time to interactive (< 5s)
- Apollo cache hit rate (>80%)
- JavaScript errors (track and alert)

#### GraphQL Backend
- Query resolution time (median < 200ms, p95 < 1s)
- N+1 queries detected (should be 0)
- DataLoader batch size (should be > 1)
- Database connection pool utilization (<80%)

#### Express Backend
- File upload success rate (>99%)
- Webhook processing latency (< 5s)
- SSE connection count (for capacity planning)
- Error rate (track 4xx and 5xx)

#### Database
- Connection pool utilization (<80%)
- Query latency (p95 < 500ms)
- Replication lag (< 100ms)
- Backup freshness (< 24h)

### Prometheus Metrics

```yaml
# backend-graphql metrics
graphql_query_duration_seconds{operation="getBuilds"} 0.125
graphql_query_duration_seconds{operation="getBuild"} 0.050
graphql_dataloader_batch_size{loader="partLoader"} 15
graphql_n_plus_one_detected 0

# backend-express metrics
express_upload_duration_seconds 0.750
express_webhook_processing_duration_seconds 0.125
express_sse_connections_active 42

# database metrics
postgres_connections_used 35
postgres_query_duration_seconds_bucket 0.100
```

### Alerting Rules

```yaml
- alert: HighQueryLatency
  expr: histogram_quantile(0.95, graphql_query_duration_seconds) > 1.0
  annotations:
    summary: "GraphQL query latency exceeds 1s"

- alert: N_Plus_One_Detected
  expr: graphql_n_plus_one_detected > 0
  annotations:
    summary: "N+1 query detected in GraphQL resolvers"

- alert: DBConnectionPoolExhausted
  expr: postgres_connections_used > 80
  annotations:
    summary: "Database connection pool utilization > 80%"

- alert: SSEHighConnectionCount
  expr: express_sse_connections_active > 1000
  annotations:
    summary: "SSE connections approaching capacity"
```

### Logging Strategy

**Log Levels**:
- `ERROR`: Failures requiring immediate attention
- `WARN`: Potential issues (high latency, retries)
- `INFO`: Key events (mutations, webhooks)
- `DEBUG`: Detailed tracing (query parameters, cache hits)

**Log Aggregation**:

```bash
# CloudWatch / ELK Stack
{
  timestamp: "2025-04-16T22:00:00Z",
  level: "ERROR",
  service: "backend-graphql",
  operation: "updateBuildStatus",
  buildId: "build_123",
  error: "Database connection timeout",
  duration_ms: 5000,
  trace_id: "trace_abc123"
}
```

---

## Part 6: Interview Talking Points

### Resource Provisioning
> "I architect the system for independent scaling. GraphQL handles data queries, Express handles file uploads and real-time events. Each layer can scale independently based on load—if uploads spike, Express scales without impacting GraphQL query performance."

### CI/CD Pipeline
> "My CI pipeline runs in phases: first code quality checks (lint, format), then security audit, then parallel builds and tests for each layer, then integration tests. This gives developers fast feedback—they know within 2 minutes if lint/format failed, and within 10 minutes if tests failed."

### DataLoader & Performance
> "The pipeline includes N+1 query detection. If a resolver loads parts without batching, the integration tests catch it. I use DataLoader to batch queries—loading 50 builds with 1000+ nested parts requires only 2 database queries instead of 1+50+50M queries."

### Manufacturing Reliability
> "In production, I use Kubernetes with multi-AZ deployments and auto-scaling. If a single pod fails, the others handle traffic. The database has HA replication. This mirrors what Boltline needs—manufacturing workflows can't afford downtime."

### Observability
> "I monitor query latency, error rates, and database connection pool. If GraphQL latency spikes, I know immediately. If SSE connections approach capacity, I can scale proactively. This is critical for manufacturing—you need visibility into system health."

---

## Part 7: Quick Reference Commands

### Local Development

```bash
# Start environment
docker-compose up -d
pnpm install
pnpm dev

# Run tests
pnpm test
pnpm test --coverage
pnpm test --watch

# Lint & format
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check

# Check security
pnpm audit

# Build for production
pnpm build
```

### GitHub Actions

```bash
# Trigger CI manually
gh workflow run ci.yml

# View workflow status
gh run list --workflow=ci.yml

# Download artifacts
gh run download <run-id> --name=playwright-report
```

### Database

```bash
# Access PostgreSQL
docker exec -it react-grapql-playground-postgresql-1 psql -U root -d boltline

# Run migrations
pnpm db:migrate

# Seed test data
pnpm db:seed
```

### Deployment

```bash
# Deploy to staging
gh workflow run deploy.yml -f environment=staging

# Deploy to production
gh workflow run deploy.yml -f environment=production

# Check deployment status
kubectl rollout status deployment/backend-graphql -n production
```

---

## Part 8: Troubleshooting Guide

### Issue: Tests Fail Locally but Pass in CI

**Cause**: Environment mismatch (Node version, database state, etc.)  
**Solution**:
```bash
# Match CI environment
node --version  # Should be v20 LTS
nvm use 20

# Reset database
docker-compose down -v
docker-compose up -d
pnpm db:migrate

# Run tests again
pnpm test
```

### Issue: N+1 Query Detected in Production

**Cause**: Missing DataLoader in resolver  
**Solution**:
```typescript
// BEFORE (N+1)
parts: (parent) => db.parts.findMany({ where: { buildId: parent.id } })

// AFTER (Batched)
parts: (parent, _, { loaders }) => loaders.partLoader.load(parent.id)
```

### Issue: SSE Connections Cause Memory Leak

**Cause**: Event listeners not cleaned up on disconnect  
**Solution**:
```typescript
req.on("close", () => {
  // Remove all listeners
  Object.entries(handlers).forEach(([event, handler]) => {
    eventBus.removeListener(event, handler);
  });
  res.end();
});
```

### Issue: GraphQL Query Timeout

**Cause**: Slow resolver or database query  
**Solution**:
1. Profile resolver with timing logs
2. Check N+1 queries with DataLoader
3. Verify database indexes
4. Add query complexity limits

---

## Conclusion

This resource provisioning and CI/CD strategy ensures:

✅ **Fast Local Development**: Three layers running locally in <5 minutes  
✅ **Reliable CI**: Parallel jobs give feedback within 10 minutes  
✅ **Production Ready**: Multi-layer scaling, monitoring, and rollback  
✅ **Interview Aligned**: Demonstrates DevOps thinking, observability, and system design  

**Next Steps**:
1. Set up `.github/workflows/ci.yml` in repository
2. Configure Docker Compose locally
3. Create environment files for staging/production
4. Set up monitoring with Prometheus/CloudWatch
5. Document deployment runbooks

---

**Resources**:
- DESIGN.md — Architecture documentation
- CLAUDE.md — Development environment setup
- `.copilot/agents/` — Agent-specific guidance
- `.github/copilot-instructions.md — Build/test commands
