# STXWORX — PostgreSQL → MySQL Migration Plan

## Goal

Migrate all database references from PostgreSQL to MySQL. This is a **driver and schema-definition swap** — the Drizzle ORM abstraction means most application logic remains unchanged. Only the connection layer, schema definitions, and a few pg-specific query features need updating.

---

## Affected Files (17 total)

### Code Changes (12 files)

> [!CAUTION]
> **Critical Finding:** `.returning()` is used **19 times across 8 files**. MySQL does NOT support the `RETURNING` clause. Every `.returning()` call must be replaced with an insert/update followed by a separate `SELECT` to fetch the result.

---

#### [MODIFY] [schema.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/shared/schema.ts)

**What changes:**
- Import path: `drizzle-orm/pg-core` → `drizzle-orm/mysql-core`
- `pgTable` → `mysqlTable`
- `pgEnum` → `mysqlEnum`
- `serial` → `serial` (same name, different import source)
- `text().array()` → `json()` (MySQL has no native text arrays; `json` column stores `string[]`)
- `numeric()` → `decimal()` (MySQL equivalent for arbitrary-precision numbers)
- `timestamp` → `timestamp` (same name, different import source; MySQL version uses `mode: 'string'` by default)

**Diff preview:**
```diff
 import {
-  pgTable,
+  mysqlTable,
   varchar,
   text,
   integer,
   serial,
   boolean,
-  numeric,
+  decimal,
   timestamp,
-  pgEnum,
+  mysqlEnum,
+  json,
-} from "drizzle-orm/pg-core";
+} from "drizzle-orm/mysql-core";

-export const userRoleEnum = pgEnum("user_role", ["client", "freelancer"]);
+export const userRoleEnum = mysqlEnum("user_role", ["client", "freelancer"]);
 // ... same pattern for all 7 enums

-export const users = pgTable("users", {
+export const users = mysqlTable("users", {
 // ... same pattern for all 9 tables

-  milestone1Amount: numeric("milestone_1_amount").notNull(),
+  milestone1Amount: decimal("milestone_1_amount").notNull(),
 // ... same pattern for all 4 milestone amount columns

-  subcategories: text("subcategories").array().notNull(),
+  subcategories: json("subcategories").$type<string[]>().notNull(),
```

> **Note on enums:** In `drizzle-orm/mysql-core`, `mysqlEnum` is a **column type builder** (not a standalone type declaration like `pgEnum`). The standalone `pgEnum` declarations must be removed. Instead, enums are defined **inline** within each table column. For example:
> ```typescript
> // OLD (pg):
> export const userRoleEnum = pgEnum("user_role", ["client", "freelancer"]);
> export const users = pgTable("users", {
>   role: userRoleEnum("role").notNull(),
> });
>
> // NEW (mysql):
> export const users = mysqlTable("users", {
>   role: mysqlEnum("role", ["client", "freelancer"]).notNull(),
> });
> ```
> To keep the code maintainable and avoid duplicating enum values, we will extract the value arrays into shared constants.

---

#### [MODIFY] [db.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/db.ts)

**What changes:**
- `drizzle-orm/node-postgres` → `drizzle-orm/mysql2`
- Replace `pg` Pool with `mysql2/promise` connection pool
- `connectionString` → `uri` (mysql2 pool config format)
- Export the mysql2 pool instead of pg pool

**Diff preview:**
```diff
-import { drizzle } from "drizzle-orm/node-postgres";
-import pkg from "pg";
-const { Pool } = pkg;
+import { drizzle } from "drizzle-orm/mysql2";
+import mysql from "mysql2/promise";
 import * as schema from "@shared/schema";

 if (!process.env.DATABASE_URL) {
   throw new Error(
     "DATABASE_URL must be set. Did you forget to provision a database?"
   );
 }

-export const pool = new Pool({
-  connectionString: process.env.DATABASE_URL,
-});
+export const pool = mysql.createPool(process.env.DATABASE_URL);

-export const db = drizzle(pool, { schema });
+export const db = drizzle(pool, { schema, mode: "default" });
```

---

#### [MODIFY] [drizzle.config.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/drizzle.config.ts)

**What changes:**
- `dialect: "postgresql"` → `dialect: "mysql"`

```diff
 export default defineConfig({
   out: "./migrations",
   schema: "./shared/schema.ts",
-  dialect: "postgresql",
+  dialect: "mysql",
   dbCredentials: {
     url: process.env.DATABASE_URL,
   },
 });
```

---

#### [MODIFY] [check-db.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/check-db.ts)

**What changes:**
- Replace `pool.connect()` → use the mysql2 pool from `db.ts`
- Replace `client.query("SELECT version()")` → `pool.query("SELECT VERSION()")`
- Update all log messages from "PostgreSQL" to "MySQL"

**Diff preview:**
```diff
 import { pool } from "./db";

 async function checkConnection() {
-  console.log("Checking PostgreSQL connection...");
+  console.log("Checking MySQL connection...");
   console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

   try {
-    const client = await pool.connect();
-    const result = await client.query("SELECT version()");
-    console.log("PostgreSQL connection successful!");
-    console.log("PostgreSQL version:", result.rows[0].version);
-    client.release();
+    const [rows] = await pool.query("SELECT VERSION() as version");
+    console.log("MySQL connection successful!");
+    console.log("MySQL version:", (rows as any)[0].version);

     // ... Drizzle queries remain unchanged ...

   } catch (error) {
     console.error("Database connection failed:", error);
     console.log("\nMake sure:");
-    console.log("  1. PostgreSQL is running");
+    console.log("  1. MySQL is running");
     console.log("  2. DATABASE_URL is set in .env file");
     console.log("  3. Database exists and is accessible");
     process.exit(1);
   }
 }
```

---

#### [MODIFY] [project.service.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/services/project.service.ts)

**What changes:**
- `ilike` → `like` (MySQL's `LIKE` is case-insensitive by default on `utf8mb4_general_ci` collation)
- Update import statement

```diff
-import { eq, and, or, ilike, sql } from "drizzle-orm";
+import { eq, and, or, like, sql } from "drizzle-orm";

 // Line 42-43:
-          ilike(projects.title, `%${filters.search}%`),
-          ilike(projects.description, `%${filters.search}%`)
+          like(projects.title, `%${filters.search}%`),
+          like(projects.description, `%${filters.search}%`)
```

Also replace all `.returning()` calls with insert-then-select / update-then-select:
```diff
 // INSERT pattern (create method):
-    const [project] = await db.insert(projects).values(data).returning();
-    return project;
+    const result = await db.insert(projects).values(data);
+    const [project] = await db.select().from(projects).where(eq(projects.id, result[0].insertId));
+    return project;

 // UPDATE pattern (update method):
-    const [updated] = await db
-      .update(projects)
-      .set({ ...data, updatedAt: new Date() })
-      .where(eq(projects.id, id))
-      .returning();
-    return updated || null;
+    await db
+      .update(projects)
+      .set({ ...data, updatedAt: new Date() })
+      .where(eq(projects.id, id));
+    const [updated] = await db.select().from(projects).where(eq(projects.id, id));
+    return updated || null;
```

---

#### [MODIFY] [auth.service.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/services/auth.service.ts)

Replace `.returning()` on user insert (line 50):
```diff
-    const [newUser] = await db
-      .insert(users)
-      .values({ stxAddress, role })
-      .returning();
-    user = newUser;
+    const result = await db
+      .insert(users)
+      .values({ stxAddress, role });
+    const [newUser] = await db.select().from(users).where(eq(users.id, result[0].insertId));
+    user = newUser;
```

---

#### [MODIFY] [proposal.service.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/services/proposal.service.ts)

Replace `.returning()` on 4 calls: `create` (line 22), `accept` (line 58), `reject` (line 86), `withdraw` (line 95).

**Insert pattern** (`create`):
```diff
-    const [proposal] = await db.insert(proposals).values(data).returning();
+    const result = await db.insert(proposals).values(data);
+    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, result[0].insertId));
```

**Update pattern** (`accept`, `reject`, `withdraw`):
```diff
-    const [accepted] = await db
-      .update(proposals)
-      .set({ status: "accepted", updatedAt: new Date() })
-      .where(eq(proposals.id, proposalId))
-      .returning();
+    await db
+      .update(proposals)
+      .set({ status: "accepted", updatedAt: new Date() })
+      .where(eq(proposals.id, proposalId));
+    const [accepted] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
```

---

#### [MODIFY] [admin.service.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/services/admin.service.ts)

Replace `.returning()` on 6 calls: `resolveDispute` (line 88), `resetDispute` (line 107), `forceRelease` (line 136), `updateUserStatus` (line 155), `createNft` (line 168), `confirmNftMint` (line 195).

Same pattern as above — remove `.returning()`, add a follow-up `select` by the known `id` or `insertId`.

---

#### [MODIFY] [dispute.controller.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/controllers/dispute.controller.ts)

Replace `.returning()` on insert (line 47).

---

#### [MODIFY] [milestone.controller.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/controllers/milestone.controller.ts)

Replace `.returning()` on 3 calls: submit (line 51), approve (line 92), reject (line 134).

---

#### [MODIFY] [review.controller.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/controllers/review.controller.ts)

Replace `.returning()` on insert (line 67).

---

#### [MODIFY] [user.controller.ts](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/backend/controllers/user.controller.ts)

Replace `.returning()` on update (line 55).

---

#### [MODIFY] [package.json](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/package.json)

**What changes:**
- **Remove:** `pg`, `@neondatabase/serverless`, `connect-pg-simple`, `@types/pg`, `@types/connect-pg-simple`
- **Add:** `mysql2`

```diff
 "dependencies": {
+    "mysql2": "^3.11.0",
-    "@neondatabase/serverless": "^0.10.4",
-    "connect-pg-simple": "^10.0.0",
-    "pg": "^8.16.0",
     ...
 },
 "devDependencies": {
-    "@types/connect-pg-simple": "^7.0.3",
-    "@types/pg": "^8.11.6",
     ...
 }
```

> After editing `package.json`, run `npm install` to update `node_modules` and regenerate `package-lock.json`.

---

### Documentation Changes (5 files)

---

#### [MODIFY] [README.md](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/README.md)

| Line(s) | Current | New |
|---------|---------|-----|
| 51 | `PostgreSQL database (Neon serverless)` | `MySQL database` |
| 76-78 | Download PostgreSQL / Neon references | Download MySQL / use cloud MySQL |
| 119 | `Option A: Local PostgreSQL` | `Option A: Local MySQL` |
| 123 | `psql -U postgres` | `mysql -u root -p` |
| 135 | `DATABASE_URL=postgresql://...` | `DATABASE_URL=mysql://root:password@localhost:3306/stx_freelance` |
| 139 | `Option B: Neon (Cloud PostgreSQL)` | `Option B: Cloud MySQL (PlanetScale, Aiven, etc.)` |
| 141 | `neon.tech` reference | Remove Neon-specific references |
| 146 | `DATABASE_URL=postgresql://...neon.tech...` | `DATABASE_URL=mysql://user:pass@host:3306/dbname` |
| 474 | `DATABASE_URL=postgresql://...` | `DATABASE_URL=mysql://user:password@host:3306/database` |
| 529 | `Ensure PostgreSQL is running` | `Ensure MySQL is running` |
| 653 | `PostgreSQL & Drizzle ORM` | `MySQL & Drizzle ORM` |

---

#### [MODIFY] [implementation.md](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/implementation.md)

| Line | Current | New |
|------|---------|-----|
| 5 | `Express.js + Drizzle ORM + PostgreSQL + Zod` | `Express.js + Drizzle ORM + MySQL + Zod` |
| 481 | `DATABASE_URL # PostgreSQL connection string` | `DATABASE_URL # MySQL connection string` |

---

#### [MODIFY] [QUICK_START.md](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/QUICK_START.md)

| Line | Current | New |
|------|---------|-----|
| 53 | `DATABASE_URL=postgresql://user:pass@host:port/database` | `DATABASE_URL=mysql://user:pass@host:3306/database` |

---

#### [MODIFY] [Testing-endpoints.md](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/Testing-endpoints.md)

| Line | Current | New |
|------|---------|-----|
| 11 | `PostgreSQL running with DATABASE_URL set` | `MySQL running with DATABASE_URL set` |

---

#### [MODIFY] [.env.production.example](file:///Users/arowolokehinde/STX-WORKX/STX-WORX-COPY/.env.production.example)

| Line | Current | New |
|------|---------|-----|
| 4 | `# Database Connection (Get from Hostinger cPanel → Databases)` | Same (unchanged) |
| 5 | `DATABASE_URL="postgresql://username:password@host:5432/database_name"` | `DATABASE_URL="mysql://username:password@host:3306/database_name"` |

---

## Key Technical Notes

### MySQL enum handling in Drizzle
In `drizzle-orm/mysql-core`, `mysqlEnum` works differently than `pgEnum`:
- **PostgreSQL**: Enums are standalone database-level types (`CREATE TYPE`), declared separately and referenced by tables
- **MySQL**: Enums are **column-level** inline declarations (`ENUM('a','b','c')`) — no standalone type exists

In Drizzle, `mysqlEnum` is a **column builder**, not a standalone type declarator. The standalone `pgEnum(...)` calls must be removed. Enum values are defined inline in each column. To avoid duplicating values across columns, we extract them into shared `const` arrays:

```typescript
// Shared constants for enum values (reusable, type-safe)
export const USER_ROLES = ["client", "freelancer"] as const;
export const TOKEN_TYPES = ["STX", "sBTC"] as const;
// ...

// Used inline in tables:
export const users = mysqlTable("users", {
  role: mysqlEnum("role", [...USER_ROLES]).notNull(),
});
```

### `.returning()` not supported in MySQL
MySQL does not support the `RETURNING` clause. Every `.returning()` call (19 total) must be replaced:

**For INSERTs** (auto-increment ID):
```typescript
// MySQL returns insertId from the result header
const result = await db.insert(table).values(data);
const [row] = await db.select().from(table).where(eq(table.id, result[0].insertId));
```

**For UPDATEs** (ID already known):
```typescript
// Just do the update, then re-select by the known ID
await db.update(table).set(data).where(eq(table.id, knownId));
const [row] = await db.select().from(table).where(eq(table.id, knownId));
```

### `text[].array()` → `json()`
PostgreSQL supports native array columns. MySQL does not. The `categories.subcategories` column currently uses `text("subcategories").array()`. This will become `json("subcategories").$type<string[]>()`, which stores a JSON array. The `$type<string[]>()` call provides TypeScript type safety without changing runtime behavior.

### `numeric` → `decimal`
Drizzle's `mysql-core` doesn't export `numeric` — the equivalent is `decimal()`. Both represent arbitrary-precision decimal numbers. No precision/scale arguments are currently used, so no changes to business logic are needed.

### `ilike` → `like`
PostgreSQL's `ILIKE` performs case-insensitive pattern matching. MySQL's `LIKE` is already case-insensitive by default when using `utf8mb4_general_ci` or `utf8mb4_0900_ai_ci` collation (the MySQL defaults). Replacing `ilike` with `like` produces identical search behavior.

### `DATABASE_URL` format
```
# PostgreSQL format (old):
postgresql://user:password@host:5432/database

# MySQL format (new):
mysql://user:password@host:3306/database
```

---

## Verification Plan

### Automated Verification
1. **TypeScript compilation** — Run `npx tsc --noEmit` from the project root to verify no type errors after the migration (especially that all `.returning()` removals compile cleanly)
2. **Drizzle schema validation** — Run `npx drizzle-kit generate` to verify the schema is valid MySQL and can generate migrations
3. **npm install** — Verify `mysql2` installs correctly and pg packages are removed

### Manual Verification (User)
1. **Set up a local MySQL database** and update `.env` with `DATABASE_URL=mysql://root:password@localhost:3306/stx_freelance`
2. **Push schema:** `npm run db:push` — verifies Drizzle can create all tables in MySQL
3. **Seed data:** `npm run db:seed` — verifies seed script works with MySQL
4. **Check connection:** `npm run db:check` — verifies the health check utility works
5. **Start dev server:** `npm run dev` — verifies the app boots without errors
6. **Test key endpoints:** Follow the happy path in `Testing-endpoints.md` (admin login, categories, create project, browse with search filters) to confirm query compatibility
