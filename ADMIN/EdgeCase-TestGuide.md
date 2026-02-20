# STXWorx Edge Case Testing & Deployment Guide

> Covers: Admin Dashboard, Leaderboard, Smart Contract Integration  
> Branch: `client-feat`  
> Contract: `escrow-contract-v1` @ `STVNRH0FC9XJP8J18C92J09MNBS2BS2TW6RCAQ87`

---

## Prerequisites

1. **Backend running** — `cd backend && npm run dev` (port 5001)
2. **Frontend running** — `cd stxworx-freelance && npm run dev` (port 3000)
3. **MySQL running** — with `DECIMAL(18,8)` migration already applied
4. **Hiro Wallet installed** — connected to Stacks testnet
5. **Admin account** — login at `/admin` with admin credentials

---

## 1. Smart Contract Integration Tests

### 1.1 Create Project (STX)

| Step | Action | Expected |
|------|--------|----------|
| 1 | As client, go to "Create Project" | Modal opens |
| 2 | Fill in title, description, 2-3 milestones, total budget = 1 STX, token = STX | Fields validate |
| 3 | Click "Deploy Escrow" | Hiro Wallet popup appears with `create-project-stx` call |
| 4 | Confirm in wallet | TX broadcasts, project status → `funded` |
| 5 | Check Explorer: `contract-call` to `escrow-contract-v1::create-project-stx` | Args match: milestones padded to 4, amounts in micro-STX (×1,000,000) |

**Edge Cases:**
- [ ] **0 budget** — should reject (contract requires `> u0`)
- [ ] **More than 4 milestones** — frontend only allows up to 4; verify validation
- [ ] **Milestone amounts don't sum to budget** — frontend auto-distributes; verify on-chain totals match
- [ ] **Wallet rejected / cancelled** — `onCancel` callback fires; project stays in `open` status, no on-chain state
- [ ] **Wallet disconnected mid-flow** — should show wallet-connect prompt, not crash

### 1.2 Create Project (sBTC)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Same as above but select sBTC token | Contract call → `create-project-sbtc` |
| 2 | Verify `contract-transfer` post-condition for sBTC | sBTC transferred to escrow |

**Edge Cases:**
- [ ] **Insufficient sBTC balance** — wallet should reject with balance error
- [ ] **sBTC transfer allowance not set** — verify post-condition handles this

### 1.3 Complete Milestone (Freelancer)

| Step | Action | Expected |
|------|--------|----------|
| 1 | As freelancer on assigned project, click "Submit Milestone" | First submit to backend (submission + evidence) |
| 2 | Click "Mark Complete On-Chain" | Hiro Wallet: `complete-milestone` with `(project-id, milestone-num)` |
| 3 | Confirm | Milestone status → `submitted` on-chain |

**Edge Cases:**
- [ ] **Complete milestone out of order (e.g., MS3 before MS1)** — contract enforces sequential; should get `err-milestone-not-ready`
- [ ] **Complete already-completed milestone** — contract returns `err-milestone-already-completed`
- [ ] **Non-freelancer tries to complete** — contract returns `err-not-freelancer`

### 1.4 Release Milestone (Client)

| Step | Action | Expected |
|------|--------|----------|
| 1 | As client, view submitted milestone, click "Release Payment" | Hiro Wallet: `release-milestone-stx` or `release-milestone-sbtc` |
| 2 | Confirm | Funds released to freelancer's wallet, milestone status → `approved` |

**Edge Cases:**
- [ ] **Release before freelancer completes** — contract returns `err-milestone-not-completed`
- [ ] **Release same milestone twice** — contract rejects, funds already sent
- [ ] **Non-client caller** — contract returns `err-not-client`
- [ ] **All milestones released** — project auto-completes to `completed` status

### 1.5 File Dispute

| Step | Action | Expected |
|------|--------|----------|
| 1 | As either party, click "File Dispute" | Hiro Wallet: `file-dispute` with `(project-id, milestone-num)` |
| 2 | Confirm | Project status → `disputed` on-chain |

**Edge Cases:**
- [ ] **Dispute on already-released milestone** — contract should reject
- [ ] **Dispute on completed project** — contract should reject
- [ ] **Both parties file disputes** — only first succeeds; second gets error

### 1.6 Request Full Refund (Client)

| Step | Action | Expected |
|------|--------|----------|
| 1 | As client, "Request Refund" on a stalled project | Hiro Wallet: `request-full-refund-stx` or `sbtc` |
| 2 | After timeout period passes, confirm | Unreleased funds → client |

**Edge Cases:**
- [ ] **Refund before timeout** — contract returns `err-too-early`
- [ ] **Refund on project with all milestones released** — no unreleased funds
- [ ] **Refund after partial releases** — only unreleased portion refunded

---

## 2. Admin Dashboard Tests

### 2.1 Overview Tab

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login at `/admin` | Dashboard loads with Overview |
| 2 | Verify stat cards | Total Users, Total Projects, Active Projects, Open Disputes — all from API |

**Edge Cases:**
- [ ] **No data (fresh DB)** — stats show 0 or "—", no crash
- [ ] **Admin session expired** — redirect to login

### 2.2 Users Control Tab

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Users Control" | User list loads from API |
| 2 | Search by name/address | Filtered results |
| 3 | Ban/unban a user | Status toggles, API call succeeds |

**Edge Cases:**
- [ ] **Ban yourself (admin)** — should be prevented or warned
- [ ] **Search with no results** — empty state shown

### 2.3 Jobs Queue Tab

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Jobs Queue" | All projects load |
| 2 | Expand a project → "Admin Intervention Zone" | Milestones shown with Force Release / Refund buttons |
| 3 | Force Release on a pending milestone | API call succeeds, milestone updated |
| 4 | Force Refund on an active project | API call succeeds, project refunded |

**Edge Cases:**
- [ ] **Force Release on already-released milestone** — buttons hidden (only shown for pending/submitted/locked)
- [ ] **Force Refund on completed project** — buttons hidden
- [ ] **Concurrent admin actions** — processing state prevents double-click
- [ ] **Filter by "Disputed"** — shows only disputed projects

### 2.4 Disputes Tab (NEW)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Disputes" in sidebar | Disputes list loads with summary stats (Open/Resolved/Reset) |
| 2 | Filter by "Open" | Only open disputes shown |
| 3 | Click "Resolve" on an open dispute | Modal opens with dispute details + resolution form |
| 4 | Enter resolution notes + TX ID, click "Confirm Resolve" | API call, dispute status → `resolved` |
| 5 | Click "Reset" on an open dispute | Modal opens, enter notes + TX ID → dispute → `reset` |
| 6 | Click 👁 on a resolved dispute | View-only modal shows resolution details |

**Edge Cases:**
- [ ] **No disputes exist** — empty state with shield icon, "No disputes have been filed yet."
- [ ] **Submit with empty resolution** — button disabled (validation)
- [ ] **Submit with empty TX ID** — button disabled (validation)
- [ ] **Resolve/Reset fails (network error)** — error caught, modal stays open, form data preserved
- [ ] **Rapid-fire resolve buttons** — `processing` state prevents double submission
- [ ] **Dispute with evidence URL** — "View Evidence" link opens in new tab
- [ ] **Dispute without evidence** — evidence section hidden
- [ ] **Long reason text** — truncated in table with tooltip, full text in modal
- [ ] **Refresh after resolve** — resolved dispute moves to "Resolved" filter

### 2.5 NFT Release Tab

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "NFT Release" | NFT management loads from API |
| 2 | Mint/manage badges | Existing functionality verified |

### 2.6 Removed Tabs Verification

- [ ] **No "Monitor Chats" in sidebar** — removed
- [ ] **No "Approvals" in sidebar** — removed
- [ ] **No "Customer Service" in sidebar** — removed
- [ ] **Navigate to admin panel** — no console errors about missing components

---

## 3. Leaderboard Tests

### 3.1 Navigation

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Leaderboard" in desktop navbar | Navigates to `/leaderboard` |
| 2 | Click "Leaderboard" in mobile menu | Navigates to `/leaderboard` |
| 3 | Direct URL `/leaderboard` | Page loads correctly |

### 3.2 Ranking Display

| Step | Action | Expected |
|------|--------|----------|
| 1 | Page loads | API call to `GET /api/users/leaderboard` |
| 2 | Verify top 3 podium | Gold (#1), Silver (#2), Bronze (#3) cards with crown/medal icons |
| 3 | Verify full table below | All ranked freelancers with rank, avatar, name, completed count, rating stars |
| 4 | Verify "YOU" badge | Current logged-in user highlighted with orange "YOU" badge |
| 5 | Click "Refresh Rankings" | Data reloaded from API |

**Edge Cases:**
- [ ] **No freelancers exist** — empty state: "No rankings yet" message
- [ ] **Only 1-2 freelancers** — podium shows only available spots; no crash on missing #2/#3
- [ ] **Freelancer with 0 completed projects** — should still appear with 0 count, sorted last
- [ ] **Freelancer with no reviews** — avgRating shows 0.0 or "No ratings"
- [ ] **Tie in completed projects** — secondary sort by avgRating breaks the tie
- [ ] **100+ freelancers** — table renders without performance issues, no pagination needed initially
- [ ] **User not logged in** — leaderboard still accessible (public), "YOU" badge not shown
- [ ] **Rating display** — shows exact star count (e.g., 4.5 = 4 filled + 1 half star)
- [ ] **Avatar fallback** — users without profile pic show initials avatar

### 3.3 Data Accuracy

| Step | Action | Expected |
|------|--------|----------|
| 1 | Complete a project for a freelancer | Their "completed" count increases |
| 2 | Leave a 5-star review | Their average rating updates |
| 3 | Refresh leaderboard | Updated data reflected |

**Edge Cases:**
- [ ] **Completed project without review** — count increases, rating stays same
- [ ] **Multiple reviews from same client** — all counted in average
- [ ] **Project in 'disputed' status** — NOT counted as completed

---

## 4. Contract Address Verification

| Check | Expected |
|-------|----------|
| `constants.ts` CONTRACT_ADDRESS | `STVNRH0FC9XJP8J18C92J09MNBS2BS2TW6RCAQ87` |
| `constants.ts` CONTRACT_NAME | `escrow-contract-v1` |
| `contracts.ts` imports | From `constants.ts` (no hardcoded addresses) |
| All contract calls use constants | `contractAddress: CONTRACT_ADDRESS`, `contractName: CONTRACT_NAME` |
| sBTC reference | `SBTC_CONTRACT_ADDRESS` + `SBTC_CONTRACT_NAME` from constants |

---

## 5. Deployment Checklist

### Pre-Deploy

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx vite build stxworx-freelance` — builds successfully
- [ ] Backend starts without errors
- [ ] All API endpoints return correct data (test with Postman / Testing-endpoints.md)
- [ ] Admin login/logout works
- [ ] Smart contract address matches deployed contract on testnet

### Environment Variables

```env
# Backend
DATABASE_URL=mysql://...
PORT=5001
JWT_SECRET=...
ADMIN_PASSWORD=...

# Frontend (constants.ts)
CONTRACT_ADDRESS=STVNRH0FC9XJP8J18C92J09MNBS2BS2TW6RCAQ87
CONTRACT_NAME=escrow-contract-v1
NETWORK=testnet
API_URL=http://localhost:5001/api  (or production URL)
```

### Post-Deploy Verification

- [ ] Homepage loads, wallet connects
- [ ] Create project → contract call reaches testnet
- [ ] Leaderboard page shows rankings
- [ ] Admin panel loads all tabs (Overview, Users, Jobs, Disputes, NFT)
- [ ] No console errors in production build
- [ ] API calls use correct production URL (not localhost)

---

## 6. Known Limitations

1. **onChainId hardcoded to `1`** in ProjectDetailPage — should parse from TX result in future
2. **No pagination** on leaderboard — fine for <100 freelancers, add later if needed
3. **Admin force-release/refund** uses generated TX IDs — in production, wire to actual on-chain admin calls
4. **sBTC allowance** — user must have approved sBTC transfer to escrow contract beforehand
5. **Timeout values** — refund/abandon timeouts configured in smart contract, not adjustable via UI
