# Docker Quick Reference

## 🚀 Common Commands

### Starting Services

```bash
# Start databases only (recommended for development)
docker-compose up -d postgres redis

# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d api
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop api
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs api
docker-compose logs -f workers

# View last 50 lines
docker-compose logs --tail=50 api
```

### Service Status

```bash
# Check running containers
docker-compose ps

# Check detailed status
docker ps -a

# Check resource usage
docker stats
```

### Rebuilding Images

```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build api

# Force rebuild without cache
docker-compose build --no-cache api

# Rebuild and restart
docker-compose up -d --build api
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d autograder_db

# Run SQL file
docker-compose exec -T postgres psql -U postgres -d autograder_db < backup.sql

# Create database backup
docker-compose exec postgres pg_dump -U postgres autograder_db > backup.sql

# View database logs
docker-compose logs postgres
```

### Redis Management

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis commands
docker-compose exec redis redis-cli MONITOR

# View Redis info
docker-compose exec redis redis-cli INFO

# Clear all Redis data (⚠️ destructive)
docker-compose exec redis redis-cli FLUSHALL
```

### Container Shell Access

```bash
# Access API container shell
docker-compose exec api sh

# Access Postgres container shell
docker-compose exec postgres sh

# Access Redis container shell
docker-compose exec redis sh
```

### Cleaning Up

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove all unused Docker resources (⚠️ aggressive)
docker system prune -a

# Remove specific image
docker rmi node-projects-github-actions-api
```

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
netstat -ano | Select-String ":3001"

# Kill process (replace PID)
Stop-Process -Id <PID> -Force

# Or stop local dev servers
pkill -f "nest start"
pkill -f "next dev"
```

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs api

# Check container status
docker-compose ps

# Restart service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build api
```

### Database Connection Issues

```bash
# Check if Postgres is healthy
docker-compose ps postgres

# Test connection from host
docker-compose exec postgres pg_isready -U postgres

# Check connection from API container
docker-compose exec api npm run prisma:studio
```

### Redis Connection Issues

```bash
# Check if Redis is healthy
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli PING
# Should return: PONG

# Check Redis logs
docker-compose logs redis
```

### Permission Issues

```bash
# Fix volume permissions (if needed)
docker-compose exec postgres chown -R postgres:postgres /var/lib/postgresql/data
```

## 📊 Service Health Checks

### API Health

```bash
# Using curl
curl http://localhost:3001/api/health

# Using PowerShell
Invoke-WebRequest http://localhost:3001/api/health

# Inside container
docker-compose exec api curl localhost:3001/api/health
```

### Database Health

```bash
# Check Postgres status
docker-compose exec postgres pg_isready -U postgres

# Check database exists
docker-compose exec postgres psql -U postgres -c "\l"

# Count users (verify seed data)
docker-compose exec postgres psql -U postgres -d autograder_db -c "SELECT COUNT(*) FROM \"User\";"
```

### Redis Health

```bash
# Check Redis is responding
docker-compose exec redis redis-cli PING

# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Check connected clients
docker-compose exec redis redis-cli CLIENT LIST
```

## 🔄 Development Workflow

### Recommended Setup

```bash
# 1. Start databases
docker-compose up -d postgres redis

# 2. Wait for health checks
docker-compose ps

# 3. Start dev servers (in separate terminal)
npm run dev

# 4. Access services
# - Frontend: http://localhost:3000
# - API: http://localhost:3001/api
# - Postgres: localhost:5432
# - Redis: localhost:6379
```

### Full Docker Workflow (API & Workers only)

```bash
# 1. Build all images
docker-compose build

# 2. Start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. Stop when done
docker-compose down
```

## 🐛 Debug Mode

### View Detailed Build Output

```bash
docker-compose build --progress=plain api
```

### Run Container Interactively

```bash
docker-compose run --rm api sh
```

### Check Environment Variables

```bash
docker-compose exec api env
```

### Network Inspection

```bash
# List Docker networks
docker network ls

# Inspect autograder network
docker network inspect node-projects-github-actions_autograder-network

# Test connectivity between containers
docker-compose exec api ping postgres
docker-compose exec workers ping redis
```

## 📦 Data Management

### Backup Everything

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres autograder_db > backup_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v node-projects-github-actions_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_backup.tar.gz /data
```

### Restore Database

```bash
# From SQL file
docker-compose exec -T postgres psql -U postgres -d autograder_db < backup.sql

# Or recreate from Prisma
docker-compose exec api npx prisma migrate reset --force
docker-compose exec api npx prisma db seed
```

## 🔐 Security Notes

### ⚠️ Development Only

Current Docker setup is for **development only**:

- ❌ No Redis password configured
- ❌ Default Postgres password
- ❌ Ports exposed to host
- ❌ No SSL/TLS

### Production Checklist

Before deploying to production:

- [ ] Set strong passwords for all services
- [ ] Use secrets management (Docker secrets, AWS Secrets Manager)
- [ ] Enable SSL/TLS
- [ ] Close unnecessary ports
- [ ] Use private networks
- [ ] Implement proper logging and monitoring
- [ ] Regular security updates

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Known Issues](./KNOWN_ISSUES.md)
- [Sprint 0 Day 5 Report](./sprint-documents/sprint-0-day-5-completion-report.md)

---

**Quick Help**: Run `docker-compose --help` for full command reference
