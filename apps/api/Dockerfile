# ---- Base ----
FROM oven/bun:1 AS base
WORKDIR /app

# ---- Install dependencies ----
FROM base AS deps

# Copy root workspace config
COPY package.json bun.lock ./

# Copy workspace package.json files (needed for bun install resolution)
COPY apps/api/package.json apps/api/package.json
COPY packages/algorithms/package.json packages/algorithms/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/validation/package.json packages/validation/package.json

# Install production dependencies
RUN bun install --frozen-lockfile --production

# ---- Build ----
FROM base AS build

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY packages/algorithms/package.json packages/algorithms/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/validation/package.json packages/validation/package.json

RUN bun install --frozen-lockfile

# Copy source code
COPY apps/api/ apps/api/
COPY packages/algorithms/ packages/algorithms/
COPY packages/auth/ packages/auth/
COPY packages/core/ packages/core/
COPY packages/validation/ packages/validation/

# Build all packages
RUN cd packages/algorithms && bun run build || true
RUN cd packages/auth && bun run build || true
RUN cd packages/core && bun run build || true
RUN cd packages/validation && bun run build || true
RUN cd apps/api && bun run build || true

# ---- Production ----
FROM base AS production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./

WORKDIR /app/apps/api

EXPOSE 3000

# Run migrations then start the server
CMD ["bun", "run", "start:prod"]
