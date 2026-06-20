# ShipBond

**Milestone bond protocol built on GenLayer Studionet.**

Sponsors post work with GEN locked as reward. Builders accept by posting a bond.
When work is submitted, GenLayer's Intelligent Contract fetches public evidence
URLs directly, runs AI-powered consensus review across validators, and settles
funds automatically on-chain from the accepted verdict. No human can override the
verdict — the contract enforces it.

Live → **[shipbond.vercel.app](https://shipbond.vercel.app)**

Contract → [`0x9D780f42c16F0D2237325f62Ea55B0E3Df5FA102`](https://explorer-studio.genlayer.com/address/0x9D780f42c16F0D2237325f62Ea55B0E3Df5FA102) on GenLayer Studionet (Chain 61999)

---

## What Makes ShipBond a GenLayer App

ShipBond is not a claim reviewer — it is an evidence **verifier**.

When a sponsor triggers review, every GenLayer validator independently:

1. Fetches `raw_readme_url` — a stable plain-text raw GitHub URL pinned to the exact commit hash
2. Fetches `deployment_url` — the live app or service
3. Optionally fetches the StudioNet explorer page for the builder's `accept_bond_tx_hash`
4. Runs LLM judgment on what was actually found, against the milestone terms

Validators must reach consensus on `verdict`, `bond_action`, and `settlement_status`.
Wording may differ — structure must agree. This is the GenLayer equivalence principle.

Fake repos (404), placeholder pages (example.com, "coming soon"), or DNS errors
produce `FAILED` automatically. Network inaccessibility produces `NEEDS_HUMAN_REVIEW`.
No one can pass a milestone by making a text claim alone.

---

## How It Works

```
Sponsor posts milestone + locks reward GEN
  -> Builder accepts + posts bond GEN
  -> Builder submits public evidence refs on-chain
  -> Sponsor triggers GenLayer consensus review
  -> Every validator fetches evidence independently
  -> Validators reach equivalent verdict
  -> Anyone calls settle()
  -> Funds disperse automatically
```

The verdict is produced entirely by GenLayer validator consensus. The frontend
cannot set or influence a verdict. The sponsor cannot manually mark a submission
as passed or failed.

---

## Verdict Logic

| Signal | Verdict |
|---|---|
| README fetched + content relevant to milestone | PASSED (if deployment also ok) |
| Some evidence real, some missing/incomplete | PARTIAL_PASS |
| README 404 / placeholder page / fake link | FAILED |
| All fetches failed due to network error | NEEDS_HUMAN_REVIEW |

NEEDS_HUMAN_REVIEW requires mutual sponsor + builder agreement before settlement.

---

## Verified E2E (Studionet)

Last verified: **June 20, 2026**

```text
milestone_id: 1
status: SETTLED
verdict: PASSED
bond_action: RETURN
settlement_status: COMPLETED
```

| Step | Transaction |
|---|---|
| Create milestone | [`0xed1dd486aca1521e0abcd9f884ea7fb2d8aa843cf6a9a7b03244703afcfb900a`](https://explorer-studio.genlayer.com/tx/0xed1dd486aca1521e0abcd9f884ea7fb2d8aa843cf6a9a7b03244703afcfb900a) |
| Accept milestone | [`0x8ab2256649068dd5c2e0047f7fe6d1f42e0c73b8f68912f4d9bf10ed151041df`](https://explorer-studio.genlayer.com/tx/0x8ab2256649068dd5c2e0047f7fe6d1f42e0c73b8f68912f4d9bf10ed151041df) |
| Submit evidence | [`0xee850bd65e9472dea8a0fac2b0c262bf4f003e1981b141f0cee03b2c59b3a28c`](https://explorer-studio.genlayer.com/tx/0xee850bd65e9472dea8a0fac2b0c262bf4f003e1981b141f0cee03b2c59b3a28c) |
| Request review | [`0x461be27e895cfbbd488594690193be8af3918f1ba51900f3d33672e3b99e6649`](https://explorer-studio.genlayer.com/tx/0x461be27e895cfbbd488594690193be8af3918f1ba51900f3d33672e3b99e6649) |
| Settle | [`0xc2fc1f146bfdb8d9d1b81e5dd879483dca5fa511d7dce47ceb3d3f68ad5ebc23`](https://explorer-studio.genlayer.com/tx/0xc2fc1f146bfdb8d9d1b81e5dd879483dca5fa511d7dce47ceb3d3f68ad5ebc23) |

---

## Network

| Item | Value |
|---|---|
| Network | GenLayer Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |
| Protocol Contract | `0x9D780f42c16F0D2237325f62Ea55B0E3Df5FA102` |

---

## Contract Methods

| Method | Who | Payable | Notes |
|---|---|---|---|
| `create_milestone` | Sponsor | Yes, reward GEN | Locks reward into contract |
| `accept_milestone` | Builder | Yes, bond GEN | Locks builder bond |
| `submit_evidence` | Builder | No | Evidence digest + refs JSON on-chain |
| `request_review` | Sponsor | No | Triggers GenLayer validator consensus |
| `settle` | Anyone | No | Disperses funds after auto-settleable verdict |
| `cancel_milestone` | Sponsor | No | Only before acceptance, refunds reward |
| `propose_human_settlement` | Sponsor | No | Only after NEEDS_HUMAN_REVIEW |
| `accept_human_settlement` | Builder | No | Builder accepts proposal |
| `settle_human_agreement` | Anyone | No | Executes mutually agreed settlement |

---

## Evidence Packet (v0.4.0)

Fields submitted on-chain with every evidence submission:

| Field | Required | Notes |
|---|---|---|
| `repo_url` | Yes | Public GitHub repo |
| `full_commit_hash` | Yes | 40-char SHA-1 — pinned commit |
| `raw_readme_url` | Yes | `raw.githubusercontent.com` URL — validators fetch this directly |
| `deployment_url` | Yes | Live public URL |
| `read_result_summary` | Yes | What the app/contract returned when tested |
| `smoke_test_result` | Yes | Specific actions taken to verify |
| `builder_explanation_summary` | Yes | How this satisfies the milestone |
| `acceptance_criteria_checklist` | Yes | One result per criterion |
| `repo_tree_url` | Optional | GitHub tree view pinned to commit |
| `raw_key_file_url` | Optional | Raw URL to key source file |
| `contract_address` | Optional | StudioNet contract if applicable |
| `accept_bond_tx_hash` | Optional | Builder's accept_milestone tx hash |

Private files (screen recordings, logs) are uploaded to Supabase Storage and
are visible to the sponsor only — never exposed to other builders.

---

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is server-only, never prefixed with `NEXT_PUBLIC_`
- Builder submissions are private — builders cannot see each other's work
- The contract has no method that lets a sponsor manually mark a verdict
- Prompt injection attempts in evidence fields are rejected before they reach the contract
- Human settlement requires both sponsor proposal and builder acceptance

---

## Environment Variables

```env
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
NEXT_PUBLIC_GENLAYER_EXPLORER=https://explorer-studio.genlayer.com
NEXT_PUBLIC_FAUCET_URL=https://studio.genlayer.com
NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS=0x9D780f42c16F0D2237325f62Ea55B0E3Df5FA102

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server-only

SESSION_SECRET=your_32_plus_character_secret
SESSION_COOKIE_NAME=__shipbond_session
SESSION_MAX_AGE=604800
SHIPBOND_ADMIN_WALLETS=comma_separated_admin_wallets
```

---

## Project Structure

```text
contracts/
  ShipBondProtocol.py        GenLayer Intelligent Contract (Python)

app/
  api/                       Next.js API routes (server-only Supabase access)
  app/                       App shell, milestone pages, sponsor/builder views
  connect/                   Wallet connection flow

components/
  milestone/                 EvidenceSubmitForm, ConsensusChamber, VerdictCard
  wallet/                    ConnectButton, WalletBadge
  brand/                     ShipBond logo and UI tokens

hooks/
  useContractActions.ts      create, accept, submit, review, settle
  useGenLayerClient.ts       genlayer-js client setup
  useWalletAuth.ts           iron-session + wagmi wallet binding

lib/
  genlayer/
    studionet-chain.ts       Chain config and SHIPBOND_CONTRACT address
    contract.ts              Read/write wrappers and status mapping
  evidence-packet.ts         EvidencePacket interface, normalizer, stable JSON
  session.ts                 iron-session config
  terms-hash.ts              SHA-256 terms hash construction

scripts/
  studionet-e2e.mjs          Full on-chain E2E (create → settle)
  route-smoke.mjs            Production route availability check
```

---

## Local Development

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

Apply Supabase migrations from `supabase/migrations/` in order before first run.

---

## Validation

```bash
npm run typecheck
npm run build
node scripts/studionet-e2e.mjs
```

The E2E script requires funded Studionet test wallets:

```env
SHIPBOND_SPONSOR_KEY=0x...
SHIPBOND_BUILDER_KEY=0x...
```

Production route smoke test:

```bash
npm run build && npx next start -p 3001 &
set SHIPBOND_BASE_URL=http://127.0.0.1:3001
node scripts/route-smoke.mjs
```

---

## Design Notes

- `terms_hash` includes the local Supabase UUID, sponsor wallet, and timestamp so
  the server can resolve the verified on-chain milestone ID safely without trusting
  the frontend to supply it.
- GenLayer review is intentionally non-deterministic. Consensus accepts equivalent
  structured verdicts — the wording of `reasoning` may differ between validators,
  but `verdict`, `bond_action`, and `settlement_status` must match.
- The app waits for `ACCEPTED` (status 5) for fast Studionet UX. For payout audits,
  verify final balances directly on the Studionet explorer.
- `raw.githubusercontent.com` URLs are used for evidence because they return stable
  plain text with no JavaScript rendering, making them reliably fetchable by all
  GenLayer validators in a consensus round.

---

## License

MIT
