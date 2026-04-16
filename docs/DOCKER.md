# Docker & Local Development Setup

This guide covers setting up and running the local development environment with Docker Compose.

## Prerequisites

- Docker Desktop (Mac/Windows) or Docker + Docker Compose (Linux)
- Node.js 20+
- pnpm 8+

## Quick Start (One Command)

```bash
# Start PostgreSQL container
docker-compose up -d

# Install all dependencies
pnpm install

# Start all three layers in parallel
pnpm dev
```

Then access:
- **Frontend**: http://localhost:3000
- **GraphQL**: http://localhost:4000/graphql
- **Express**: http://localhost:5000/health

## Docker Compose Services

### PostgreSQL

The database service runs PostgreSQL 16 Alpine with:
- **Database**: `boltline`
- **User**: `root`
- **Password**: `password` (local dev only)
- **Port**: `5432`
- **Volume**: `postgres_data/` (persisted, gitignored)
- **Health Check**: `pg_isready` every 10 seconds

## Common Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgresql

# View logs
docker-compose logs -f postgresql

# View logs from all services
docker-compose logs -f
```

### Database Access

```bash
# Connect to PostgreSQL via psql
docker-compose exec postgresql psql -U root -d boltline

# Example: List tables
docker-compose exec postgresql psql -U root -d boltline -c "\dt"

# Backup database
docker-compose exec postgresql pg_dump -U root boltline > backup.sql

# Restore database
docker-compose exec postgresql psql -U root boltline < backup.sql
```

### Stop & Clean Up

```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart postgresql
```

### Health & Status

```bash
# Check service health
docker-compose ps

# Check logs for errors
docker-compose logs postgresql | tail -50

# Force health check
docker-compose exec postgresql pg_isready -U root
```

## Workflow: Local Development

### 1. Initial Setup

```bash
# Clone and enter repo
cd react-grapql-playground

# Start Docker services
docker-compose up -d

# Install dependencies
pnpm install

# Run migrations (when Prisma schema is ready)
pnpm -F backend-graphql db:migrate
```

### 2. Run All Three Layers

**Terminal 1** - Frontend:
```bash
pnpm dev:frontend
# Next.js on :3000
```

**Terminal 2** - GraphQL:
```bash
pnpm dev:graphql
# Apollo on :4000
```

**Terminal 3** - Express:
```bash
pnpm dev:express
# Express on :5000
```

Or run all in one terminal (with background processes):
```bash
pnpm dev
```

### 3. Testing

```bash
# Unit/integration tests
pnpm test

# Watch mode
pnpm test:watch

# E2E tests (requires all services running)
pnpm test:e2e
```

## Docker Compose Configuration

### Environment Variables

The `docker-compose.yml` reads from `.env`:

```env
POSTGRES_DB=boltline
POSTGRES_USER=root
POSTGRES_PASSWORD=password
POSTGRES_PORT=5432
```

Override via command-line:
```bash
POSTGRES_PASSWORD=mysecret docker-compose up -d
```

### Volumes

- **postgres_data/**: PostgreSQL data directory (persisted between restarts)
  - Gitignored (in .gitignore)
  - Created automatically on first run
  - Survives `docker-compose down` (but not `docker-compose down -v`)

### Networks

All services run on `boltline_network`:
- PostgreSQL accessible at `postgresql:5432` from containers
- Useful for integration tests or when adding services

### Health Checks

PostgreSQL has a health check that runs every 10 seconds:
```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U root']
  interval: 10s
  timeout: 5s
  retries: 5
```

This ensures the database is ready before starting dependent services.

## Troubleshooting

### Port Already in Use

If `5432` is already in use by another service:

```bash
# Change port in docker-compose.yml
# ports:
#   - '5433:5432'

# Or modify .env
POSTGRES_PORT=5433

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://root:password@localhost:5433/boltline
```

### Container Crashes on Startup

```bash
# Check logs
docker-compose logs postgresql

# Common fixes
docker-compose down -v  # Remove volume
docker-compose up -d    # Restart fresh
```

### "Cannot connect to database" Error

```bash
# Verify PostgreSQL is running and healthy
docker-compose ps

# Check health status
docker-compose ps postgresql

# Wait for health check to pass
docker-compose logs postgresql | grep "pg_isready"

# Manually test connection
docker-compose exec postgresql pg_isready -U root
```

### Memory Issues on Docker Desktop

If Docker Desktop is consuming too much memory:
1. In Docker Desktop Preferences → Resources, reduce memory limit
2. Stop unused containers: `docker-compose down`
3. Prune unused images: `docker system prune`

## Optional Services

### Redis (for Future Caching)

To enable Redis, uncomment in `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'
  volumes:
    - redis_data:/data
```

Then:
```bash
docker-compose up -d redis
```

Connect from Node:
```typescript
import redis from 'redis';

const client = redis.createClient({ host: 'redis', port: 6379 });
```

## Production Considerations

For production deployments, see `docs/resource-provisioning-cicd-strategy.md`:
- Use managed PostgreSQL (AWS RDS, GCP Cloud SQL, Heroku Postgres)
- Use Kubernetes for orchestration
- Use environment-specific configurations
- Implement automated backups
- Enable monitoring and alerting

## Next Steps

After docker-compose is running:
1. **Issue #3**: Frontend boilerplate (Apollo Client integration)
2. **Issue #4**: GraphQL backend boilerplate (Prisma schema, resolvers)
3. **Issue #5**: Express backend boilerplate (upload routes, SSE)

## References

- Docker Compose Documentation: https://docs.docker.com/compose/
- PostgreSQL Docker Image: https://hub.docker.com/_/postgres
- Project Documentation: See `DESIGN.md` and `CLAUDE.md`
