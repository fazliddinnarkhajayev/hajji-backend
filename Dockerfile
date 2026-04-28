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

# Production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
