# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev        # Run with watch mode
npm run build            # Compile TypeScript to dist/

# Database migrations
npm run db:migrate       # Run pending migrations
npm run db:migrate:make  # Create new migration file (TS)
npm run db:migrate:rollback  # Roll back last batch

# Docker
docker-compose up        # Start postgres + app containers
```

No test runner or linter is configured in this project.

## Architecture

**Stack:** NestJS 11 + Knex 3 (query builder) + PostgreSQL 16 + Socket.io

```
src/
  core/database/          # Knex setup, migrations, DatabaseModule
  modules/                # Feature modules (auth, admins, agencies, pilgrims, mobile, references, websocket)
  shared/                 # Cross-cutting: BaseDao, BaseService, guards, filters, interceptors, decorators, enums, constants
```

### DAO Pattern

`BaseDao<T>` (in `shared/dao/`) is the core data access abstraction. Every entity has its own DAO extending `BaseDao`, which provides `findById`, `findMany`, `insert`, `updateById`, `deleteById`. Soft deletes (`is_deleted`, `deleted_at`) are filtered at query time in `BaseDao`. All DAOs receive the Knex connection via the `KNEX_CONNECTION` injection token provided globally by `DatabaseModule`.

### Module Structure

Each feature module in `src/modules/` follows the same pattern:
- `*.module.ts` — imports, registers DAO + Service + Controller
- `*.controller.ts` — handles HTTP routing, calls the service
- `*.service.ts` — business logic, calls the DAO
- `*.dao.ts` — extends `BaseDao`, raw Knex queries
- `dto/` — class-validator DTOs for request bodies

### Authentication

JWT guard (`shared/guards/jwt-auth.guard.ts`) is applied **globally** via `SharedModule`. Routes opt out with the `@IsPublic()` decorator.

Three user types (`shared/enums/user-types.enum.ts`): `ADMIN`, `PILGRIM`, `AGENCY_USER`.

Two login strategies:
- **Admin/Agency:** username + password → bcrypt verify → access + refresh tokens
- **Pilgrim:** phone-based OTP flow (`/auth/send-otp` → `/auth/verify-otp`) — OTP sessions stored in `otp_sessions` table, expire after `OTP_EXPIRY_MINUTES`

Tokens: access token (15 min default), refresh token (7 days). Stored in `refresh_tokens` table.

### Table Names

All table names are defined as constants in `shared/constants/`. Always use these constants in DAOs rather than string literals.

### Response Format

A global interceptor (`shared/interceptors/`) wraps all responses. A global exception filter (`shared/filters/`) handles error formatting.

## Environment Variables

Required in `.env`:

```
PORT=
API_PREFIX=
NODE_ENV=

DATABASE_HOST=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRES_IN=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRES_IN=
REFRESH_TOKEN_EXPIRES_IN_DAYS=

OTP_EXPIRY_MINUTES=
DEFAULT_COUNTRY_ID=
```

## Key Conventions

- **Transactions:** Pass a Knex `trx` object through the service → DAO call chain for atomic operations.
- **Pagination:** Use `shared/interfaces/pagination.interface.ts` types for paginated responses.
- **Current user:** Access via `@CurrentUser()` decorator in controllers (populated by the JWT guard).
- **Migration files:** TypeScript (`.ts`), placed in `src/core/database/migrations/`, created via `db:migrate:make`.
