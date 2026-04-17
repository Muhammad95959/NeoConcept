# Backend Agent Guide

## Stack
- **Runtime**: Node.js, TypeScript (`module: commonjs`, strict mode)
- **ORM**: Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`)
- **Testing**: Jest + ts-jest + supertest
- **Dev runner**: `tsx` (not ts-node)
- **Package manager**: pnpm

## Dev Commands
```bash
pnpm dev          # Start dev server (tsx --watch, port 9595)
pnpm test         # Run all tests
pnpm test:watch   # Watch mode
pnpm test:ci      # Single-run with coverage (CI mode: --ci --runInBand)
pnpm prisma generate  # Regenerate Prisma client after schema changes
```

## Prisma
- Schema: `prisma/schema.prisma`
- Generated client: `src/generated/prisma` (gitignored)
- Config: `prisma.config.ts` (uses `dotenv/config`)
- **After any schema change, run `pnpm prisma generate`**

## API
- Entry: `src/server.ts` + `src/app.ts`
- Base: `/api/v1/`
- Routes: `auth`, `user`, `tracks`, `courses`, `staff-requests`, `student-requests`
- Nested under courses: `meetings`, `posts`, `comments`, `resources`
- Swagger docs: `/api-docs` (reads `swagger.yaml`)
- CORS whitelist: `http://localhost:3000` only

## Auth
- Passport.js (JWT + Google OAuth strategies)
- Config: `src/config/passport.ts` (auto-loaded by `app.ts`)

## Tests
- Located in `tests/` subdirectories within each module
- Pattern: `**/*.test.ts` under `src/`
- Coverage threshold: 70% for branches, functions, lines, statements
- Excluded: `src/**/*.test.ts`, `src/index.ts`, `src/utils/agora/**`
- Test timeout: 10000ms; max workers: 50%
- `jest.config.js` uses ts-jest with `diagnostics: false`

## Gotchas
- **`.env` is gitignored** — never commit it
- `src/generated/` is gitignored — always run `prisma generate` after `pnpm install`
- `dist/` is gitignored — TypeScript output goes there on build
- Dev server binds to `0.0.0.0`, not `localhost`
- No ESLint config — only `.prettierrc.toml` with `printWidth = 120`
