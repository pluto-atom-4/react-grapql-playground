# Issue #7 Event Bus - Deployment Guide

Production deployment steps, monitoring, and troubleshooting for the 3-layer event bus.

## 1. Pre-Deployment Checklist

- [ ] All 606 tests passing locally: `pnpm test`
- [ ] Code review approved (PR #185)
- [ ] TypeScript: 0 errors: `pnpm tsc --noEmit`
- [ ] ESLint: 0 errors: `pnpm lint`
- [ ] Performance benchmarks reviewed (PERFORMANCE_BENCHMARKS.md)
- [ ] Database migrations applied: `pnpm migrate`
- [ ] Environment variables configured (.env.production)
- [ ] TLS certificates ready (production)
- [ ] Monitoring/alerting configured
- [ ] Runbooks created (team aware)

## 2. Environment Configuration

### Backend GraphQL Environment Variables

Set in `backend-graphql/.env.production`:

```env
# Express event bus configuration
NEXT_PUBLIC_EXPRESS_EVENT_URL=https://events.prod/events/emit
EXPRESS_EVENT_EMIT_TIMEOUT=5000
EXPRESS_EVENT_MAX_RETRIES=10
EXPRESS_EVENT_BASE_DELAY=1000
EXPRESS_EVENT_MAX_DELAY=30000

# Database
DATABASE_URL=postgresql://user:password@db.prod:5432/boltline

# Server
APOLLO_PORT=4000
GRAPHQL_ENV=production
NODE_ENV=production
```

### Backend Express Environment Variables

Set in `backend-express/.env.production`:

```env
# Express server
EXPRESS_PORT=5000
NODE_ENV=production

# Event bus deduplication
EVENT_DEDUP_WINDOW_SIZE=1000
EVENT_DEDUP_TTL=300000

# SSE heartbeat
EVENT_BUS_HEARTBEAT_INTERVAL=30000
EVENT_BUS_TIMEOUT=60000

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables

Set in `frontend/.env.production`:

```env
# Backend services
NEXT_PUBLIC_GRAPHQL_URL=https://graphql.prod/graphql
NEXT_PUBLIC_EXPRESS_URL=https://events.prod

# SSE reconnection
NEXT_PUBLIC_SSE_RECONNECT_ATTEMPTS=10
NEXT_PUBLIC_SSE_BASE_DELAY=1000
NEXT_PUBLIC_SSE_MAX_DELAY=30000

# SSE deduplication
NEXT_PUBLIC_SSE_DEDUP_WINDOW=1000
NEXT_PUBLIC_SSE_DEDUP_TTL=300000

# Debug
NEXT_PUBLIC_SSE_DEBUG=false

# Runtime
NODE_ENV=production
```

## 3. Deployment Steps

### Step 1: Prepare Environment

```bash
# SSH into production server
ssh admin@prod-server

# Create deployment directory
mkdir -p /opt/boltline/event-bus
cd /opt/boltline/event-bus

# Clone repository
git clone <repo> .
git checkout main
```

### Step 2: Install & Build

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build all packages
pnpm build

# Verify build
ls -la dist/
```

### Step 3: Database Migration

```bash
# Run migrations
pnpm migrate

# Verify schema
psql $DATABASE_URL -c "\dt"
```

### Step 4: Start Services

**Option A: Systemd**

```bash
# Start services
systemctl start boltline-graphql
systemctl start boltline-express
systemctl start boltline-frontend

# Wait for startup
sleep 10
```

**Option B: Docker Compose**

```bash
docker-compose up -d

# Wait for startup
sleep 10
```

### Step 5: Health Checks

```bash
# GraphQL health
curl -s http://localhost:4000/graphql | head -20

# Express health
curl -s http://localhost:5000/events/health | jq .

# Frontend health
curl -s http://localhost:3000 | head -20

# Expected: All three responding ✓
echo "All services healthy!"
```

### Step 6: Monitor Logs (First 10 Minutes)

```bash
# Follow logs from all services
tail -f backend-express/logs/app.log &
tail -f backend-graphql/logs/app.log &
tail -f frontend/logs/app.log &

# Wait and watch for errors
sleep 600

# Kill background jobs
killall tail
```

## 4. Monitoring & Alerting

### Key Metrics to Monitor

```
EventBus Metrics (from /events/metrics):
  • totalEmitted per minute (target: 100-1000)
  • averageLatencyMs (target: <50ms, critical: <100ms)
  • connectedClients (track growth)
  • totalDuplicates (target: close to 0)

Performance:
  • P95 latency (target: <100ms)
  • P99 latency (target: <200ms)
  • Error rate (target: <0.1%)
  • Reconnection attempts (should be ~0)

Infrastructure:
  • Express memory (alert if >1 GB)
  • GraphQL memory (alert if >500 MB)
  • CPU usage (alert if >80%)
  • Disk space (alert if <20%)
```

### Alert Thresholds

| Alert | Condition | Action |
|-------|-----------|--------|
| High Latency | P95 > 200ms for 5 min | Page on-call, investigate |
| Memory Spike | +100MB in 1 min | Check for leak, restart if needed |
| High Error Rate | >1% errors for 5 min | Check logs, rollback if critical |
| Event Backlog | totalEmitted stalls for 2 min | Check Express, restart |
| SSE Disconnects | >10 per minute | Check network, firewall |

### Monitoring Queries

```bash
# Check real-time metrics
curl http://localhost:5000/events/metrics | jq '.'

# Watch metrics updates every 5 seconds
watch -n 5 "curl -s http://localhost:5000/events/metrics | jq '.'"

# Check health status
curl http://localhost:5000/events/health | jq '.'

# Monitor Express logs
tail -f backend-express/logs/app.log | grep -i "error\|warn"
```

## 5. Troubleshooting

### Symptom: Events Not Reaching Frontend

**Debug Steps:**
1. Check Express is running: `curl http://localhost:5000/events/health`
2. Check GraphQL can reach Express: Check logs for connection errors
3. Enable debug mode: `window.__SSE_DEBUG = true` in browser console
4. Check browser console for SSE errors

**Common Causes:**
- Express port not exposed/firewalled
- CORS misconfigured
- Network timeout (increase timeout in config)

**Fix:**
```bash
# Restart Express
systemctl restart boltline-express

# Check firewall
sudo ufw allow 5000

# Verify DNS
nslookup events.prod
```

### Symptom: Memory Growing Over Time

**Debug Steps:**
1. Get Express memory: `curl http://localhost:5000/events/metrics | jq .memory`
2. Check dedup window: `curl http://localhost:5000/events/metrics | jq .deduplicator`
3. Look for memory spike in logs

**Common Causes:**
- Dedup not cleaning up (TTL not working)
- SSE clients not disconnecting
- Event payload size too large

**Fix:**
```bash
# Force garbage collection (development only)
kill -USR2 <express-pid>

# In production: Restart Express service
systemctl restart boltline-express

# Verify memory after restart
curl http://localhost:5000/events/metrics | jq .memory
```

### Symptom: Reconnection Loop Visible

**Debug Steps:**
1. Enable frontend debug: `window.__SSE_DEBUG = true`
2. Check `reconnectAttempts` counter
3. Check browser network tab for 401/403 errors

**Common Causes:**
- Network unstable
- Express restarting
- Auth token expired

**Fix:**
```bash
# Check Express logs for auth errors
tail -100 backend-express/logs/app.log | grep -i auth

# Verify tokens
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/events

# Fix token if needed
# Force frontend re-authentication
```

### Symptom: High Latency (>100ms)

**Debug Steps:**
1. Check metrics: `curl http://localhost:5000/events/metrics | jq .averageLatencyMs`
2. Check CPU usage: `top` or `ps aux | grep node`
3. Check network: `iftop` or network monitoring

**Common Causes:**
- Express CPU at capacity
- Network bandwidth exhausted
- Database slow queries

**Fix:**
```bash
# Check CPU usage
top -p <express-pid>

# Scale up if needed
# Restart to force garbage collection
systemctl restart boltline-express

# Check database performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM builds;"
```

## 6. Rollback Procedure

### If Critical Issue Found

```bash
# Stop new deployment
systemctl stop boltline-express
systemctl stop boltline-graphql
systemctl stop boltline-frontend

# Revert to previous commit
cd /opt/boltline/event-bus
git checkout main~1

# Rebuild
pnpm install --frozen-lockfile
pnpm build

# Restart services
systemctl start boltline-graphql
systemctl start boltline-express
systemctl start boltline-frontend

# Verify
curl http://localhost:5000/events/health
```

**Wait time:** ~5 minutes for full service startup

**Verification:**
- All services responding
- No errors in logs
- Events flowing

## 7. Post-Deployment Verification

After deployment, verify all systems operational:

```bash
# 1. Run integration tests
pnpm test:integration

# Expected: All tests passing ✓

# 2. Verify events flowing
curl -N http://localhost:5000/events | head -5

# Expected: Seeing events stream ✓

# 3. Check metrics
curl http://localhost:5000/events/metrics | jq '.totalEmitted'

# Expected: Positive number ✓

# 4. Test frontend real-time
# Open dashboard in browser
# Create a build
# Verify instant update appears

# Expected: <500ms latency ✓

# 5. Multi-client sync
# Open dashboard in 2 browsers
# Create build in one
# Verify appears in other without refresh

# Expected: Both see update ✓
```

**Deployment successful if all 5 checks pass!** ✅

## 8. Maintenance Tasks

### Daily
- [ ] Check monitoring dashboard for alerts
- [ ] Review error logs for patterns
- [ ] Monitor latency (should stay <50ms avg)

### Weekly
- [ ] Check memory usage trends
- [ ] Review reconnection attempts
- [ ] Test failover procedures

### Monthly
- [ ] Review performance metrics
- [ ] Update documentation
- [ ] Plan scaling if needed
- [ ] Security audit

---

**Deployment Guide Complete** — Ready for production deployment and operations handoff.
