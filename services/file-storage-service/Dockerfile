# Build stage
FROM node:24-slim AS builder

RUN apt-get update -y && apt-get install -y openssl libssl-dev

WORKDIR /app

# Copy workspace manifests (include lockfile for reproducible builds)
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./
COPY tsconfig.base.json ./
# Copy all services (pnpm workspace needs all package.json files)
COPY services/ ./services/
COPY packages/ ./packages/

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

RUN pnpm install --frozen-lockfile

RUN pnpm -F @micro/common run build

RUN pnpm run build:file-storage

FROM node:24-slim

RUN apt-get update -y && apt-get install -y openssl libssl-dev

WORKDIR /app

COPY --from=builder /app/services/file-storage-service/dist ./services/file-storage-service/dist
COPY --from=builder /app/services/file-storage-service/node_modules ./services/file-storage-service/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

WORKDIR /app/services/file-storage-service

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]

