# Known Issues & Future Work

**Last Updated**: January 17, 2026  
**Project**: AutoGrader Platform

## 🔴 Critical Issues

### 1. Next.js Web Service Containerization Blocked

**Status**: ⛔ Blocked  
**Discovered**: Sprint 0 Day 5  
**Priority**: Medium  
**Assignee**: Future Sprint 2

**Description**:
Next.js 16 with Turbopack cannot resolve the workspace root when building inside Docker containers. The build fails during the Next.js compilation phase with:

```
Error: Next.js inferred your workspace root, but it may not be correct.
We couldn't find the Next.js package (next/package.json) from: /app/apps/web/src/app
To fix this, set turbopack.root in your Next.js config
```

**Technical Details**:

- Turbopack tries to auto-detect monorepo structure
- Docker build context at workspace root `/app`
- Next.js app located at `/app/apps/web`
- Turbopack searches from `src/app` but can't traverse up correctly
- Setting `turbopack.root: '/app'` in config returns "invalid experimental key" error

**Impact**:

- ❌ Cannot deploy web frontend as Docker container
- ✅ Local development fully functional
- ✅ API and Workers containerization working
- ✅ Can deploy to Vercel/Netlify as alternative

**Attempted Solutions**:

1. ❌ Added `experimental.turbopack.root: '/app'` - Invalid config key
2. ❌ Restructured WORKDIR in Dockerfile - No effect
3. ❌ Modified COPY order to include all workspace files - Still fails

**Recommended Solutions** (Pick one for Sprint 2):

**Option A: Disable Turbopack for Docker** (Recommended)

```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Remove turbopack config
  },
};
```

Then build with webpack instead of Turbopack in Docker.

**Option B: Use Webpack for Production**
Update `package.json` to use webpack for production builds:

```json
"build": "NEXT_TURBOPACK=false next build"
```

**Option C: Vercel Deployment**
Deploy web frontend to Vercel (native Next.js support) and containerize only backend services.

**Option D: Restructure Monorepo**
Move Next.js app to workspace root, but this breaks monorepo architecture.

**References**:

- [Next.js Issue #12345](https://github.com/vercel/next.js/issues/placeholder)
- [Turbopack Docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
- [Sprint 0 Day 5 Report](./sprint-documents/sprint-0-day-5-completion-report.md)

---

## ⚠️ Medium Priority Issues

### 2. Redis Authentication Not Configured

**Status**: 🟡 Open  
**Discovered**: Sprint 0 Day 5  
**Priority**: Low-Medium  
**Assignee**: Sprint 1

**Description**:
Workers service shows Redis authentication error at startup, though workers still function correctly:

```
ReplyError: NOAUTH Authentication required.
```

**Root Cause**:

- Docker Redis container has no password configured
- Bull MQ attempts authentication by default
- Workers continue to work despite error

**Impact**:

- ⚠️ Logs show error messages (cosmetic)
- ✅ Workers function correctly
- ⚠️ Redis is unprotected (development only)
- ❌ Not production-ready

**Solution**:

1. Add Redis password to `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --requirepass ${REDIS_PASSWORD}
  environment:
    - REDIS_PASSWORD=dev_password_change_in_prod
```

2. Update `.env` files:

```env
REDIS_PASSWORD=dev_password_change_in_prod
REDIS_URL=redis://:dev_password_change_in_prod@localhost:6379
```

3. Update Bull MQ configuration in workers to use password.

**References**:

- [Redis Security](https://redis.io/docs/management/security/)
- [Bull MQ Configuration](https://docs.bullmq.io/)

---

### 3. mime Package CommonJS Compatibility

**Status**: ✅ Fixed (Documented for awareness)  
**Discovered**: Sprint 0 Day 5  
**Priority**: Low (monitoring)  
**Fixed By**: Downgrade to v3.0.0

**Description**:
The `mime` package v4.x is ES Module only, causing build failures in NestJS (CommonJS):

```
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```

**Solution Applied**:
Downgraded to `mime@3.0.0` in `apps/api/package.json`.

**Monitoring Required**:

- ⚠️ Check if future NestJS versions support ES Modules
- ⚠️ Consider migrating to ES Modules in Sprint 5+
- ⚠️ Keep mime v3.x until full ESM migration

**References**:

- [mime v4 Release Notes](https://github.com/broofa/mime/releases)
- [NestJS ESM Support](https://docs.nestjs.com/)

---

## 🟢 Low Priority Issues

### 4. Next.js Config Warning: Invalid Turbopack Key

**Status**: 🟡 Open  
**Discovered**: Sprint 0 Day 5  
**Priority**: Low (cosmetic)  
**Assignee**: Sprint 1

**Description**:
Next.js shows configuration warning on every startup:

```
⚠ Invalid next.config.ts options detected:
⚠     Unrecognized key(s) in object: 'turbopack' at "experimental"
```

**Root Cause**:
The `turbopack` configuration key was added experimentally but is not officially supported in `experimental` config section.

**Impact**:

- ⚠️ Warning message on every dev server start
- ✅ Does not affect functionality
- ✅ Build works correctly

**Solution**:
Remove turbopack configuration from `apps/web/next.config.ts`:

```typescript
// Before
experimental: {
  optimizePackageImports: ['lucide-react'],
  turbopack: {
    root: '/app',
  },
}

// After
experimental: {
  optimizePackageImports: ['lucide-react'],
}
```

Note: This was added to fix containerization but didn't work, so safe to remove.

---

### 5. Docker Image Size Optimization

**Status**: 📋 Enhancement  
**Discovered**: Sprint 0 Day 5  
**Priority**: Low  
**Assignee**: Sprint 3+

**Description**:
Current Docker images are larger than optimal:

- API: 697MB
- Workers: 442MB

**Impact**:

- ⚠️ Slower deployment times
- ⚠️ Higher bandwidth usage
- ⚠️ More disk space in registry
- ✅ Acceptable for development

**Optimization Opportunities**:

1. Use alpine node base more efficiently
2. Remove unnecessary dependencies in production build
3. Use distroless images for final stage
4. Implement multi-stage build improvements

**Target Sizes**:

- API: <400MB
- Workers: <300MB

**Priority Justification**:
Not urgent as development/testing performance is acceptable. Optimize before production deployment.

---

### 6. Missing Health Check Timeouts

**Status**: 📋 Enhancement  
**Discovered**: Sprint 0 Day 5  
**Priority**: Low  
**Assignee**: Sprint 2

**Description**:
Docker Compose health checks don't have timeouts configured, using defaults.

**Recommended Changes**:

```yaml
healthcheck:
  test: ['CMD', 'pg_isready', '-U', 'postgres']
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

Apply to all services with health checks.

---

## 📋 Future Enhancements

### 7. Automated Testing in Docker

**Status**: 📋 Planned  
**Target**: Sprint 2  
**Priority**: Medium

**Description**:
Add automated tests that run in Docker containers to ensure deployment configuration is correct.

**Requirements**:

- Unit tests run in container environment
- Integration tests for inter-service communication
- Database migration tests
- API endpoint smoke tests

---

### 8. Container Monitoring & Logging

**Status**: 📋 Planned  
**Target**: Sprint 3  
**Priority**: Medium

**Description**:
Implement proper logging and monitoring for containerized services.

**Requirements**:

- Centralized logging (ELK stack or similar)
- Container metrics (Prometheus)
- Health dashboards
- Alert system

---

### 9. Multi-Environment Configuration

**Status**: 📋 Planned  
**Target**: Sprint 4  
**Priority**: Medium

**Description**:
Support multiple environments (dev, staging, production) with different Docker configurations.

**Requirements**:

- Environment-specific docker-compose files
- Secret management
- CI/CD pipeline integration
- Environment variable validation

---

## 🔄 Issue Tracking Process

1. **Discovery**: Document issue immediately when found
2. **Classification**: Assign priority (Critical/Medium/Low)
3. **Sprint Assignment**: Add to sprint backlog
4. **Resolution**: Fix and document solution
5. **Verification**: Test fix in all environments
6. **Documentation**: Update this file and related docs

## 📞 Issue Escalation

- **Critical Issues**: Immediate attention, blocks development
- **Medium Issues**: Schedule for next 1-2 sprints
- **Low Issues**: Backlog, address when convenient
- **Enhancements**: Long-term roadmap items

---

**Document Maintained By**: Development Team  
**Review Frequency**: Updated during each sprint  
**Last Review**: Sprint 0 Day 5 (January 17, 2026)
