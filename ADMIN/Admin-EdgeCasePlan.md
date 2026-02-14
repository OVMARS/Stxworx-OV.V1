# Plan: Admin Edge Case Smart Contract Implementation

## Context

The escrow contract (`contracts/escrow-multi-token.clar`) lacks admin capabilities needed for production: no dispute resolution, no pause mechanism, no way to handle abandoned projects, hardcoded fees, and no orphaned sBTC recovery. The `Admin-EdgeCases.md` analysis identified 11 categories of gaps. This plan adds all missing admin on-chain capabilities, rewrites tests to use modern Vitest + Clarinet SDK, and adds Rendezvous fuzz tests.

**Scope**: Smart contract + Clarinet config + tests only. No frontend/backend changes.

---

## Files to Modify

| File | Action |
|------|--------|
| `contracts/escrow-multi-token.clar` | Modify (add admin functions, pause guard, dynamic fees, schema changes) |
| `Clarinet.toml` | Modify (update to Clarity 3 / epoch 3.0, add fuzz test contract) |
| `settings/Devnet.toml` | Modify (add wallet_2, wallet_3 for test coverage) |
| `tests/escrow-v4_test.ts` | Replace (rewrite from old Deno SDK to modern Vitest + Clarinet SDK) |
| `contracts/escrow-multi-token.tests.clar` | Create (Rendezvous fuzz/invariant tests) |
| `vitest.config.js` | Create (Vitest config for Clarinet SDK) |
| `package.json` | Modify (add `@stacks/clarinet-sdk`, `vitest`, `@stacks/rendezvous` dev deps) |

---

## Step 1: Update Clarinet.toml & Devnet.toml

**Clarinet.toml** — Update to Clarity 3, epoch 3.0 (Nakamoto). Add the fuzz test contract:

```toml
[project]
name = "stx-freelance-platform"
description = "Decentralized freelance platform on Stacks blockchain"
authors = []
telemetry = false
cache_dir = "./.cache"
requirements = []
boot_contracts = []

[contracts.escrow-multi-token-v4]
path = "contracts/escrow-multi-token.clar"
clarity_version = 3
epoch = 3.0

[repl.analysis]
passes = ["check_checker"]

[repl.analysis.check_checker]
strict = false
trusted_sender = false
trusted_caller = false
callee_filter = false
```

**Devnet.toml** — Add wallet_2 and wallet_3 (admin tests need deployer=admin, wallet_1=client, wallet_2=freelancer, wallet_3=attacker):

```toml
[accounts.wallet_2]
mnemonic = "install hierarchical mind bridge ..."  # (generate via clarinet)
balance = 100_000_000_000_000

[accounts.wallet_3]
mnemonic = "ability metal blind olive ..."
balance = 100_000_000_000_000
```

---

## Step 2: Contract Schema Changes

### 2a. New Constants

```clarity
(define-constant FORCE-RELEASE-TIMEOUT u144)   ;; ~24 hours after milestone completion
(define-constant ABANDON-TIMEOUT u1008)         ;; ~7 days
(define-constant MAX-FEE-RATE u1000)            ;; 10% cap

;; New error codes (u119-u125)
(define-constant ERR-CONTRACT-PAUSED (err u119))
(define-constant ERR-FEE-TOO-HIGH (err u120))
(define-constant ERR-MILESTONE-NOT-ELIGIBLE (err u121))
(define-constant ERR-PROJECT-NOT-ABANDONED (err u122))
(define-constant ERR-NO-SURPLUS (err u123))
(define-constant ERR-DISPUTE-INVALID (err u124))
(define-constant ERR-FORCE-RELEASE-TOO-EARLY (err u125))
```

### 2b. Convert FEE-PERCENT to Data Variable

Delete `(define-constant FEE-PERCENT u500)` and replace with:
```clarity
(define-data-var fee-rate uint u500)
(define-data-var contract-paused bool false)
(define-data-var total-committed-sbtc uint u0)
```

All references to `FEE-PERCENT` change to `(var-get fee-rate)` in `release-milestone-stx` (line 245) and `release-milestone-sbtc` (line 284).

### 2c. Expand Milestones Map

Add `completed-at: uint` field to track when milestones were marked complete:

```clarity
(define-map milestones {project-id: uint, milestone-num: uint}
  { amount: uint, complete: bool, released: bool, completed-at: uint })
```

**Impact** — Every `map-set milestones` call must include `completed-at`:
- `create-project-stx` / `create-project-sbtc`: set `completed-at: u0`
- `complete-milestone`: set `completed-at: burn-block-height`
- Release/dispute merges: `merge` preserves existing `completed-at` (no change needed)

### 2d. New Map

```clarity
(define-map project-last-activity uint uint)  ;; project-id -> burn-block-height
```

---

## Step 3: New Private Helper Functions

```
assert-not-paused     -> (ok (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED))
assert-is-owner       -> (ok (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER))
update-last-activity   -> (map-set project-last-activity project-id burn-block-height)
get-project-committed-sbtc -> returns committed sBTC for a single project
count-milestone-complete   -> count complete milestones (for status summary)
count-milestone-released   -> count released milestones (for status summary)
```

---

## Step 4: Modify All Existing Public Functions (9 functions)

Each user-facing public function gets 3 changes:

1. **Pause guard** — `(try! (assert-not-paused))` as first expression, BEFORE the `let` block (wrap body in `begin`):
   ```clarity
   (define-public (release-milestone-stx ...)
     (begin
       (try! (assert-not-paused))
       (let (...) ...)))
   ```

2. **Activity tracking** — `(update-last-activity project-id)` after every state-changing `map-set`

3. **sBTC committed tracking** (sBTC functions only):
   - `create-project-sbtc`: `(var-set total-committed-sbtc (+ (var-get total-committed-sbtc) total))`
   - `release-milestone-sbtc`: decrement by milestone `amount`
   - `request-full-refund-sbtc`: decrement by `total`
   - `emergency-refund-sbtc`: decrement by `refund-amount`

Functions affected: `create-project-stx`, `create-project-sbtc`, `complete-milestone`, `release-milestone-stx`, `release-milestone-sbtc`, `request-full-refund-stx`, `request-full-refund-sbtc`, `emergency-refund-stx`, `emergency-refund-sbtc`

Admin functions (`set-treasury`, `transfer-ownership`) are NOT paused — admin must always be able to act.

---

## Step 5: New Admin Public Functions (10 functions)

### Configuration
| Function | Purpose |
|----------|---------|
| `set-paused (paused bool)` | Circuit breaker. Owner-only. |
| `set-fee-rate (new-rate uint)` | Dynamic fee. Owner-only. Max `MAX-FEE-RATE`. |

### Dispute Resolution
| Function | Purpose |
|----------|---------|
| `admin-resolve-dispute-stx (project-id, milestone-num, release-to-freelancer)` | If `release-to-freelancer=true`: pay freelancer (minus fee). If false: refund client (no fee). Requires milestone not released, not refunded. |
| `admin-resolve-dispute-sbtc (project-id, milestone-num, release-to-freelancer, sbtc-token)` | Same for sBTC projects. |

### Force Actions (Abandoned Projects)
| Function | Purpose |
|----------|---------|
| `admin-force-release-stx (project-id, milestone-num)` | Release payment for completed milestone when client disappeared. Requires `complete=true`, `released=false`, and `(burn-block-height - completed-at) >= FORCE-RELEASE-TIMEOUT`. |
| `admin-force-release-sbtc (project-id, milestone-num, sbtc-token)` | Same for sBTC. |
| `admin-force-refund-stx (project-id)` | Refund remaining funds on abandoned project. Requires `(burn-block-height - last-activity) >= ABANDON-TIMEOUT`. Returns `total - released` to client. |
| `admin-force-refund-sbtc (project-id, sbtc-token)` | Same for sBTC. |

### Recovery & Protection
| Function | Purpose |
|----------|---------|
| `admin-recover-sbtc (amount, recipient, sbtc-token)` | Withdraw orphaned sBTC (surplus above `total-committed-sbtc`). Owner-only. |
| `admin-reset-milestone (project-id, milestone-num)` | Reset fraudulent `complete` flag back to false. Only if `released=false`. Griefing protection. |

---

## Step 6: New Read-Only Functions (5 functions)

```clarity
(define-read-only (get-fee-rate) ...)
(define-read-only (is-paused) ...)
(define-read-only (get-committed-sbtc) ...)          ;; returns total-committed-sbtc var
(define-read-only (get-last-activity (id uint)) ...)  ;; returns project-last-activity map entry
(define-read-only (get-project-status-summary (project-id uint)) ...)
  ;; returns: { milestones-complete, milestones-released, total-amount,
  ;;            released-amount, refundable-amount, refunded, age-blocks,
  ;;            last-activity-block, token-type }
```

---

## Step 7: Contract Section Order (Clean Code)

```
TRAITS
CONSTANTS (timeouts, fee cap, error codes)
DATA VARIABLES (counters, treasury, owner, fee-rate, paused, committed-sbtc)
DATA MAPS (projects, milestones [modified], project-last-activity [new])
PRIVATE HELPERS (assert-not-paused, assert-is-owner, valid-milestone, etc.)
ADMIN: CONFIGURATION (set-treasury, transfer-ownership, set-paused, set-fee-rate)
ADMIN: DISPUTE RESOLUTION (admin-resolve-dispute-stx/sbtc)
ADMIN: FORCE ACTIONS (admin-force-release-stx/sbtc, admin-force-refund-stx/sbtc)
ADMIN: RECOVERY & PROTECTION (admin-recover-sbtc, admin-reset-milestone)
CORE: STX (create-project-stx)
CORE: sBTC (create-project-sbtc)
SHARED (complete-milestone)
RELEASE (release-milestone-stx/sbtc)
REFUND (request-full-refund-stx/sbtc, emergency-refund-stx/sbtc)
READ-ONLY (all get-* and is-* functions)
```

---

## Step 8: Install Dependencies & Configure Vitest

```bash
npm install --save-dev @stacks/clarinet-sdk vitest @stacks/rendezvous
```

Create `vitest.config.js`:
```js
import { vitestSetupFilePath } from "@stacks/clarinet-sdk/vitest";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: [vitestSetupFilePath],
  },
});
```

Add test scripts to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:fuzz": "npx rv . escrow-multi-token-v4 test --runs=500",
"test:invariant": "npx rv . escrow-multi-token-v4 invariant --runs=500"
```

---

## Step 9: Unit Tests (`tests/escrow-multi-token-v4.test.ts`)

Replace old Deno-based `tests/escrow-v4_test.ts` with modern Vitest + Clarinet SDK tests. Test suites:

### A. Existing Functionality (regression)
- Create STX project (happy path + validations)
- Create sBTC project (happy path)
- Complete milestone (happy + wrong caller + already complete)
- Release milestone STX/sBTC (happy + not complete + already released)
- Full refund (happy + blocked by activity)
- Emergency refund (happy + too early + math verification)

### B. Pause Mechanism
- `set-paused`: owner can pause/unpause, non-owner rejected
- All 9 user functions return `ERR-CONTRACT-PAUSED` when paused
- Admin functions (`set-treasury`, `set-paused`, etc.) still work when paused
- Read-only functions still work when paused

### C. Dynamic Fee Rate
- `set-fee-rate`: owner can set, non-owner rejected, max cap enforced
- Release uses new fee rate (set to 0%, 3%, 10%, verify payout math)
- Fee precision edge case (small amounts where fee rounds to 0)

### D. Dispute Resolution
- Admin resolves in favor of freelancer (payout + fee math)
- Admin resolves in favor of client (full refund, no fee)
- Non-owner cannot resolve dispute
- Cannot resolve already-released milestone
- Cannot resolve on refunded project

### E. Force Release
- Happy path (complete milestone, wait FORCE-RELEASE-TIMEOUT, admin releases)
- Too early (fails with ERR-FORCE-RELEASE-TOO-EARLY)
- Milestone not complete (fails)
- Already released (fails)
- Verify payout and fee math

### F. Force Refund (Abandoned)
- Happy path (create project, mine ABANDON-TIMEOUT blocks, admin refunds)
- Too early (fails with ERR-PROJECT-NOT-ABANDONED)
- Partially released project (refund = total - released)
- Already refunded (fails)

### G. sBTC Recovery
- Orphaned sBTC surplus detected and recovered
- Cannot recover more than surplus
- Cannot recover when no surplus exists

### H. Milestone Reset (Griefing Protection)
- Admin resets fraudulent complete flag
- Cannot reset already-released milestone
- Client can full-refund after reset (activity cleared)

### I. Activity Tracking
- `get-last-activity` updates on every state change
- `get-project-status-summary` returns correct aggregated data

---

## Step 10: Fuzz Tests (`contracts/escrow-multi-token.tests.clar`)

Rendezvous property-based and invariant tests:

### Property Tests (prefixed with `test-`)
```
test-create-project-always-increments-counter (amount1 uint) (amount2 uint)
test-release-never-exceeds-milestone-amount (project-id uint) (milestone-num uint)
test-fee-always-within-bounds (amount uint)
test-refund-plus-released-equals-total (project-id uint)
test-double-release-always-fails (project-id uint) (milestone-num uint)
test-non-owner-admin-always-fails (fee-rate uint)
```

### Invariant Tests (prefixed with `invariant-`)
```
invariant-stx-balance-covers-obligations
  ;; Contract STX balance >= sum of (total - released) for all non-refunded STX projects

invariant-committed-sbtc-consistency
  ;; total-committed-sbtc var matches calculated obligations

invariant-released-never-exceeds-total
  ;; For any project, sum of released milestone amounts <= total-amount

invariant-refunded-project-has-zero-obligations
  ;; A refunded project's refundable amount is always 0
```

---

## Step 11: Regenerate Deployment Plan

```bash
clarinet deployments generate --devnet
```

---

## Step 12: Verification

1. **Compilation**: `clarinet check` — must pass with zero errors
2. **Unit tests**: `npm test` — all suites pass
3. **Fuzz tests**: `npm run test:fuzz` and `npm run test:invariant` — no property violations in 500 runs
4. **Manual smoke test**: Start devnet (`clarinet devnet start`), create a project, pause contract, verify pause blocks operations, unpause, resolve a dispute

---

## Key Design Decisions

1. **Single contract** — All admin functions go into the existing escrow contract (not a separate contract), because Clarity's data encapsulation prevents external contracts from modifying maps.
2. **`completed-at` schema addition** — Required for force-release timeout enforcement. Cannot be avoided.
3. **`total-committed-sbtc` tracking var** — O(1) lookup for sBTC recovery instead of impossible dynamic iteration in Clarity.
4. **Dispute resolution does NOT require `complete: true`** — Admin can resolve any unreleased milestone regardless of completion state (handles scenario where freelancer delivered off-chain but refuses to call `complete-milestone`).
5. **Pause does NOT affect admin or read-only functions** — Admin must always be able to act during incidents.
