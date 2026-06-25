FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json    ./apps/backend/

# Install all workspace deps (skip husky/prepare hooks)
RUN npm install --ignore-scripts

# Copy source
COPY packages/shared ./packages/shared
COPY apps/backend    ./apps/backend

# Build shared types then backend
RUN cd packages/shared && npx tsc
RUN cd apps/backend && npx nest build

# ── Runtime ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs && \
    adduser  --system --uid 1001 nestjs

COPY --from=builder /app/node_modules        ./node_modules
COPY --from=builder /app/apps/backend/dist   ./dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

RUN chown -R nestjs:nestjs /app
USER nestjs

EXPOSE 4000

CMD ["node", "dist/main"]
