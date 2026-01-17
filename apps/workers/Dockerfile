# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
COPY apps/workers/package.json ./apps/workers/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/

# Install dependencies (production only)
# Skip prepare script (husky) in Docker builds
RUN npm ci --omit=dev --ignore-scripts --workspace=apps/workers

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/workers/package.json ./apps/workers/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY apps/workers ./apps/workers
COPY packages ./packages
COPY turbo.json ./

# Generate Prisma Client
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build the application
RUN npm run build --workspace=apps/workers

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling and git for cloning repos
RUN apk add --no-cache dumb-init git curl

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

# Create workspace directory for temporary file operations (as root)
RUN mkdir -p /tmp/grading-workspace && \
    chown -R worker:nodejs /tmp/grading-workspace

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/workers/package.json ./apps/workers/

# Copy built application
COPY --from=builder /app/apps/workers/dist ./apps/workers/dist
COPY --from=builder /app/apps/workers/node_modules ./apps/workers/node_modules

# Copy Prisma files
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Set ownership to non-root user
RUN chown -R worker:nodejs /app

# Switch to non-root user
USER worker

# Environment variables
ENV NODE_ENV=production

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the workers
CMD ["node", "apps/workers/dist/main.js"]
