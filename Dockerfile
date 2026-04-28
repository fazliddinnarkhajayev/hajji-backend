# ============================================================
# Stage 1 — Builder: compile TypeScript
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# Stage 2 — Production: lean runtime image
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install ALL deps (ts-node needed to run TS migrations at startup)
COPY package*.json ./
RUN npm ci

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy migration TS source files so ts-node can run them
COPY src/core/database/migrations ./src/core/database/migrations

# Copy knexfile, tsconfig, and entrypoint
COPY knexfile.js ./knexfile.js
COPY tsconfig.json ./tsconfig.json
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
