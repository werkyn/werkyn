# Werkyn Comprehensive Code Audit Plan

## High-Level Analysis

**Werkyn** is a full-stack, self-hosted project management platform (Jira/Monday alternative) built as a TypeScript monorepo:

| Layer | Tech | Location |
|-------|------|----------|
| Frontend | React 19 + Vite + TanStack Router + Mantine UI + Zustand | `packages/frontend/` |
| Backend | Fastify 5 + Prisma 6 + WebSockets | `packages/backend/` |
| Shared | Zod schemas + TypeScript types | `packages/shared/` |
| Database | PostgreSQL 16 | Prisma schema (1134 lines, 25 migrations) |
| Auth/SSO | JWT + embedded Dex OIDC provider | Backend middleware + Dex binary |
| Deployment | Docker multi-stage + Docker Compose | Root-level configs |

**Feature scope:** Tasks, projects, wiki, chat, drive/file storage, time tracking, dashboards, notifications, SSO, custom fields, recurring tasks — with real-time WebSocket updates throughout.

**Notable:** No test suite exists. Active development with breaking changes expected.

---

## Stage 1: Security Audit (Critical Priority)

### 1a. Authentication & Session Management
- JWT implementation: token generation, validation, expiry, secret strength requirements
- Refresh token rotation: family tracking, reuse detection, race conditions
- Password hashing (bcrypt 12 rounds): verify constant-time comparison
- Account lockout logic: bypass vectors, timing attacks
- Cookie flags: HttpOnly, Secure, SameSite enforcement across all paths
- SSO/OIDC flow: Dex integration, callback validation, state parameter handling

### 1b. Authorization & Access Control
- Authorize middleware: verify all routes are protected (look for unguarded endpoints)
- Workspace resolution from params: IDOR vulnerabilities (can user A access user B's workspace by manipulating `:wid`, `:pid`, `:tid`?)
- Role enforcement: ADMIN/MEMBER/VIEWER boundary testing at service layer (not just middleware)
- File access: storage endpoint authorization, share link security
- WebSocket auth: subscription to unauthorized channels/projects

### 1c. Input Validation & Injection
- Zod schema coverage: ensure every route has validation middleware applied
- SQL injection via Prisma: raw queries, `$queryRaw`, dynamic filters
- XSS vectors: sanitize-html config strictness, DOMPurify usage gaps, rich text editor (BlockNote/Tiptap) output handling
- Path traversal: file upload/download paths, storage directory escaping
- SSRF: any user-controlled URLs fetched server-side

### 1d. Secrets & Configuration
- Environment variable validation completeness
- Default values that could be insecure (e.g., `COOKIE_SECURE` defaulting)
- Secret entropy requirements for `JWT_SECRET`, `COOKIE_SECRET`
- Dex client secret handling

---

## Stage 2: Architecture & Design Review

### 2a. API Design Consistency
- RESTful convention adherence across all 25 modules
- Response format standardization (error shapes, pagination patterns)
- HTTP status code correctness
- Rate limiting granularity (currently global 100/min — sufficient?)

### 2b. Database Schema Integrity
- Index coverage for common query patterns (foreign keys, search fields, sort columns)
- Cascade delete behavior: orphaned records, data integrity on workspace/project deletion
- Migration safety: check for destructive migrations without data backups
- N+1 query analysis: Prisma `include`/`select` patterns in service layer

### 2c. Real-time Architecture
- WebSocket connection lifecycle: memory leaks, connection limits, reconnection storms
- Broadcast scope correctness: ensure events don't leak across workspace boundaries
- Race conditions between HTTP mutations and WS broadcasts

### 2d. Error Handling
- Custom AppError hierarchy completeness
- Unhandled promise rejections / uncaught exceptions
- Error leakage: stack traces, internal details in production responses
- Fastify error handler coverage for edge cases

---

## Stage 3: Code Quality & Maintainability

### 3a. TypeScript Strictness
- `any` type usage audit across all packages
- Type assertion (`as`) abuse
- Proper generic usage vs type casting
- Shared schema type inference correctness

### 3b. Code Duplication & Patterns
- Repeated logic across the 25 backend modules
- Controller/service boundary discipline (business logic leaking into controllers)
- Frontend feature isolation (cross-feature imports, circular dependencies)
- Utility function reuse vs reinvention

### 3c. Dependency Health
- Outdated packages with known CVEs (`npm audit` / `pnpm audit`)
- Unused dependencies (dead imports)
- Dependency pinning strategy (lockfile integrity)
- Bundle size impact analysis (frontend)

### 3d. Code Complexity
- Cyclomatic complexity hotspots
- Functions exceeding reasonable length
- Deeply nested logic
- Magic numbers/strings

---

## Stage 4: Performance & Scalability

### 4a. Database Performance
- Missing indexes on frequently queried columns
- Expensive queries: full table scans, unoptimized joins
- Prisma query analysis: `findMany` without pagination limits
- Connection pool configuration

### 4b. Frontend Performance
- Bundle splitting and lazy loading effectiveness
- React re-render analysis (missing memoization, unstable references)
- Large list rendering (virtual scrolling coverage via TanStack Virtual)
- Asset optimization (images, fonts, CSS)

### 4c. Backend Performance
- Memory leaks: WebSocket connection handling, file upload streaming
- Scheduler efficiency: concurrent job execution, failure recovery
- Static file serving optimization
- Response payload sizes (over-fetching from Prisma)

---

## Stage 5: Reliability & Operations

### 5a. Testing Gap Analysis
- Identify critical paths requiring unit tests (auth, payments-equivalent, data mutations)
- Integration test strategy for API endpoints
- E2E test plan for core user flows
- Recommended test framework and coverage targets

### 5b. Observability
- Logging coverage: are all error paths logged? Are sensitive fields redacted?
- Health check endpoint completeness
- Monitoring hook points for production metrics
- Structured logging (Pino) configuration for production aggregation

### 5c. Deployment & Infrastructure
- Docker image security: base image CVEs, non-root user, multi-stage efficiency
- Graceful shutdown: in-flight request handling, WebSocket cleanup, scheduler cancellation
- Database migration safety in production (zero-downtime strategy)
- Backup and disaster recovery gaps

### 5d. Configuration & Environment
- Dev/prod parity gaps
- Missing environment variable documentation
- CORS configuration flexibility for self-hosted scenarios
- TLS/HTTPS enforcement path

---

## Execution Approach

| Stage | Method | Output |
|-------|--------|--------|
| 1 (Security) | Line-by-line review of auth, middleware, input handling | Severity-ranked vulnerability report |
| 2 (Architecture) | Cross-module pattern analysis, schema review | Design improvement recommendations |
| 3 (Quality) | Static analysis, dependency audit, pattern matching | Refactoring priority list |
| 4 (Performance) | Query analysis, bundle analysis, profiling | Optimization backlog |
| 5 (Reliability) | Gap analysis against production readiness checklist | Test plan + ops runbook |
