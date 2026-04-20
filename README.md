# Umrah Buddy Backend

NestJS backend for Umrah Buddy with Postgres + Knex.

## Architecture

- `src/core`: core framework features (database connection)
- `src/modules`: API handler modules (`auth`)
- `src/shared`: reusable base DAO/service, guards, filters, interceptors

## Auth endpoints

Base URL prefix: `/api`

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/send-otp`
- `POST /auth/verify-otp`

`send-otp` and `verify-otp` match the frontend contracts in `umrah-buddy-app`.

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run migrations:

```bash
npm run db:migrate
```

4. Start dev server:

```bash
npm run start:dev
```

Default port is `3000`, so frontend `VITE_API_BASE_URL` should be `http://localhost:3000/api`.
