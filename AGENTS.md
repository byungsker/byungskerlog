# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Overview

Next.js 16 personal blog with Neon PostgreSQL (Prisma), Stack Auth, TipTap editor, deployed on Vercel.

## Delivery and Release Policy (MANDATORY)

- Primary delivery unit: `web`
- Primary delivery profile: `web-continuous`
- Protected production and PR base branch: `main`
- Active target versions and promotion sources:
  `.byungskerlab/release-lines.json`
- Branch and pull-request validation policy:
  `.byungskerlab/branch-policy.json`
- Work branches use
  `[codex/]<type>/web/<exact-semver>/<issue-or-scope>` and target `main`.
- The legacy `dev` branch may remain temporarily for historical staging
  compatibility, but new product work and pull requests must not target it.
- Production promotion is reviewed PR/preview → `main` → the same verified
  commit deployed by Vercel. Preserve the previous verified deployment as the
  rollback target.
- Before any branch, commit, push, PR, review, merge, tag, or deployment,
  independently verify the complete Target Delivery Contract and the
  fail-closed `Target Version Contract` check.

## Database Environment (CRITICAL)

This project uses **Neon PostgreSQL** with branch-based development workflow.

### Environment Structure

| Environment     | Neon Branch | Database Endpoint            | Environment File | Usage                    |
| --------------- | ----------- | ---------------------------- | ---------------- | ------------------------ |
| **Production**  | `main`      | `ep-old-poetry-a16nvu2i`     | `.env`           | Vercel production, CI/CD |
| **Development** | `dev`       | `ep-wandering-tree-a11ymokd` | `.env.local`     | Local development        |

**Key Point:** `.env.local` overrides `.env` during local development (`npm run dev`).

### Neon Branching Model

Neon branches are **copy-on-write** snapshots of your database:

- `main` branch: Production data (live)
- `dev` branch: Development data (snapshot from main + local changes)
- Each branch has independent data and schema

**Benefits:**

- ✅ Develop safely without affecting production
- ✅ Test migrations on real-like data
- ✅ Instant branch creation (COW snapshot)

### Prisma Migration Strategy (MANDATORY)

This project uses **`prisma migrate`** for all schema changes. **NEVER use `prisma db push` for production.**

| Command                     | Environment   | Purpose                        |
| --------------------------- | ------------- | ------------------------------ |
| `npx prisma migrate dev`    | Local dev     | Create and apply migrations    |
| `npx prisma migrate deploy` | Production/CI | Apply existing migrations only |
| `npx prisma generate`       | All           | Regenerate Prisma Client       |
| `npx prisma studio`         | All           | GUI database browser           |

**Why `migrate` over `db push`?**

- ✅ Migration history tracking (`prisma/migrations/`)
- ✅ Safe rollback capability
- ✅ Team collaboration (commit migration files)
- ✅ Prevents accidental data loss
- ❌ `db push` has NO history, NO rollback, NOT safe for production

### Local Development Workflow

#### 1. Making Schema Changes

```bash
# 1. Ensure you're using dev database
cat .env.local | grep DATABASE_URL  # Should be ep-wandering-tree-a11ymokd

# 2. Edit prisma/schema.prisma
# ... make your changes ...

# 3. Create migration (generates SQL + applies to dev DB)
npx prisma migrate dev --name add_user_profile

# 4. Review generated SQL
cat prisma/migrations/<timestamp>_add_user_profile/migration.sql

# 5. Test the changes
npm run dev
```

**CRITICAL:** Migration files are auto-applied to `.env.local` database. NO need to manually load env vars.

#### 2. Viewing Database

```bash
# Open Prisma Studio (auto-uses .env.local)
npx prisma studio

# Or use Neon Console
# https://console.neon.tech → select 'dev' branch
```

#### 3. Resetting Dev Database (if needed)

```bash
# WARNING: Deletes all data in dev branch
npx prisma migrate reset

# Or recreate dev branch from Neon Console
```

### Production Deployment Workflow

#### Automated (via GitHub Actions)

When you merge a PR with migration changes to `main`:

```
1. PR includes: prisma/schema.prisma + prisma/migrations/**
2. GitHub Actions detects migration changes
3. Runs: npx prisma migrate deploy (on Production DB)
4. Vercel deployment proceeds
```

**No manual intervention required** if migrations are committed properly.

#### Manual (emergency only)

```bash
# Load production DATABASE_URL
export $(grep -E "^DATABASE_URL=" .env | xargs)

# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

### Migration Safety Rules (BLOCKING)

⛔ **NEVER:**

- Use `prisma db push` on production
- Use `--accept-data-loss` flag
- Edit migration files after they're committed
- Skip migration files (always commit them with schema changes)
- Run `migrate dev` in CI/CD (use `migrate deploy` only)

✅ **ALWAYS:**

- Create migrations with `migrate dev` locally
- Review generated SQL before committing
- Test migrations on dev branch first
- Commit both `schema.prisma` AND `prisma/migrations/` together
- Use descriptive migration names (`--name add_user_profile`)

### Common Prisma Commands

```bash
# Local Development (uses .env.local automatically)
npx prisma migrate dev --name <description>  # Create + apply migration
npx prisma migrate reset                     # Reset dev DB to initial state
npx prisma generate                          # Regenerate Prisma Client
npx prisma studio                            # Open database GUI

# Production/CI (requires DATABASE_URL env var)
npx prisma migrate deploy   # Apply pending migrations
npx prisma migrate status   # Check migration status

# Useful utilities
npx prisma db pull          # Reverse-engineer schema from existing DB
npx prisma validate         # Validate schema.prisma syntax
```

### Environment Variable Management

**Local (`.env.local`):**

```bash
# Development Database (Neon dev branch)
DATABASE_URL="postgresql://neondb_owner:password@ep-wandering-tree-a11ymokd-pooler.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:password@ep-wandering-tree-a11ymokd.region.aws.neon.tech/neondb?sslmode=require"
```

**Production (`.env` - DO NOT MODIFY):**

```bash
# Production Database (Neon main branch)
DATABASE_URL="postgresql://neondb_owner:password@ep-old-poetry-a16nvu2i-pooler.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:password@ep-old-poetry-a16nvu2i.region.aws.neon.tech/neondb?sslmode=require"
```

**Vercel Environment Variables:**

- Production: Uses `DATABASE_URL` secret (Neon main branch)
- Preview: Can use dev branch for PR previews (optional)

### Troubleshooting

#### "Migration already applied" error

```bash
# Check migration status
npx prisma migrate status

# Mark migration as applied (if manually run)
npx prisma migrate resolve --applied <migration_name>
```

#### Schema drift detected

```bash
# Compare schema with database
npx prisma migrate status

# If dev branch has manual changes, reset it
npx prisma migrate reset
```

#### Database connection errors

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# For local dev, ensure .env.local exists
cat .env.local | grep DATABASE_URL

# Test connection
npx prisma db pull
```

### References

- [Neon Branching Documentation](https://neon.tech/docs/introduction/branching)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Production Deployment Guide](./docs/MIGRATION-GUIDE.md)

## Code Style Guidelines

### Formatting (Prettier)

- Semicolons required, double quotes, 2-space tabs
- Trailing comma: ES5, print width: 120, arrow parens: always, LF endings

### Imports

```typescript
// 1. External packages → 2. @/ alias → 3. Relative
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Post } from "@/lib/types/post";
import { createWrapper } from "../test-utils";
```

### TypeScript

- Strict mode, use `interface` for objects, `type` for unions
- Use `type` imports for type-only imports

### Naming Conventions

| Item             | Convention      | Example                          |
| ---------------- | --------------- | -------------------------------- |
| Components       | PascalCase      | `PostDetail`, `MarkdownRenderer` |
| Component Files  | PascalCase      | `PostDetail.tsx`, `Header.tsx`   |
| Hooks            | camelCase, use- | `usePost`, `useDraftMutations`   |
| Hook Files       | camelCase       | `usePost.ts`, `useDrafts.ts`     |
| Other Files      | kebab-case      | `post-data.ts`, `api-client.ts`  |
| Constants        | SCREAMING_SNAKE | `ErrorCode.NOT_FOUND`            |
| Types/Interfaces | PascalCase      | `Post`, `ApiErrorResponse`       |
| Query keys       | nested object   | `queryKeys.posts.detail(slug)`   |

### Tailwind CSS

First class name describes the DOM element's purpose:

```tsx
<div className="post-detail-layout relative py-12">  // Good
<div className="relative py-12">                      // Bad
```

Use semantic HTML tags (`article`, `section`, `nav`, `header`, `footer`).

### Error Handling

Server-side (API routes):

```typescript
import { ApiError, handleApiError } from "@/lib/api/errors";
throw ApiError.notFound("Post");
throw ApiError.validationError("Title is required");
return handleApiError(error, "Failed to fetch post");
```

Client-side:

```typescript
import { ClientApiError } from "@/lib/api/client";
if (error instanceof ClientApiError) {
  if (error.code === "NOT_FOUND") {
    /* handle */
  }
}
```

### React Query Patterns

```typescript
export function usePost(id: string, options: UsePostOptions = {}) {
  return useQuery({
    queryKey: queryKeys.posts.detailById(id),
    queryFn: () => apiClient.get<Post>(`/api/posts/${id}`),
    staleTime: Infinity,
    enabled: !!id && options.enabled !== false,
  });
}
```

### Component Structure

- Hooks first, early returns, main render last
- Define props interface above component
- Add `"use client"` directive for client components

## Testing Guidelines

### Test Patterns

- Use `vitest`, `@testing-library/react`, `msw` for mocking
- Test descriptions in Korean, function names in English
- Test loading/success/error states for hooks
- Test success/failure cases for API client
- Use `renderHook` with `createWrapper()` for React Query hooks

### API Route Tests (WHEN TO RUN)

다음 API를 수정/리팩토링/버그수정할 때 **반드시** 테스트 실행:

| API                         | 테스트 파일                      | 실행 명령                                          |
| --------------------------- | -------------------------------- | -------------------------------------------------- |
| `app/api/posts/route.ts`    | `__tests__/api/posts.test.ts`    | `npm test -- --run __tests__/api/posts.test.ts`    |
| `app/api/comments/route.ts` | `__tests__/api/comments.test.ts` | `npm test -- --run __tests__/api/comments.test.ts` |
| `app/api/drafts/route.ts`   | `__tests__/api/drafts.test.ts`   | `npm test -- --run __tests__/api/drafts.test.ts`   |
| `app/api/series/route.ts`   | `__tests__/api/series.test.ts`   | `npm test -- --run __tests__/api/series.test.ts`   |

**작업 흐름:**

1. API 코드 수정 전: `npm test -- --run __tests__/api/해당파일.test.ts` (기존 동작 확인)
2. API 코드 수정 후: 같은 명령 재실행 (기존 동작 유지 확인)
3. PR 전: `npm test` (전체 테스트)

**테스트 실패 시:**

- API 로직 버그 → API 코드 수정
- 테스트 코드가 잘못됨 (outdated, 잘못된 기대값) → 테스트 코드 수정
- 새 기능 추가로 기존 동작 변경 → 테스트 코드 업데이트

**테스트 커버리지가 없는 API 수정 시:**

- 테스트 추가 필수 아님 (선택)
- 단, 버그 수정 시에는 재발 방지용 테스트 추가 권장

## Git Conventions

- Use English conventional commits with Korean bullets
- Create target-versioned work branches and open PRs to `main`
- Push only when work chunk is complete, use "Merge Pull Request" (not squash)

## Key Paths

| Path                   | Purpose                        |
| ---------------------- | ------------------------------ |
| `app/`                 | Next.js App Router pages & API |
| `components/`          | React components               |
| `hooks/`               | Custom React hooks             |
| `lib/`                 | Utilities, types, API client   |
| `lib/prisma.ts`        | Prisma client singleton        |
| `prisma/schema.prisma` | Database schema                |
| `__tests__/`           | Test files                     |

## Important Conventions

- Always import Prisma from `@/lib/prisma`
- Path alias: `@/*` maps to project root
- Client components need `"use client"` directive
- Use `cn()` for conditional Tailwind classes
- Toast notifications via Sonner
- State management via React Query (no Redux/Zustand)
