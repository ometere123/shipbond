<p align="center">
  <img src="https://raw.githubusercontent.com/ometere123/shipbond/main/public/logo.svg" alt="ShipBond" width="180" />
</p>

# ShipBond - Milestone Bond Protocol

**Trustless, AI-consensus milestone payments on GenLayer.**
A sponsor posts a milestone and locks the reward. A builder accepts by locking a bond. GenLayer validators independently fetch the builder's public evidence, reach consensus on a verdict, and the contract disperses funds. No human reviewer, no opaque committee, no backend database.

[Live app - shipbond.vercel.app](https://shipbond.vercel.app)

---

## What it is

Connect your wallet, post a milestone with a reward, and a builder locks a bond to accept it. Once the builder submits public evidence (repo, deployment, commit hash), GenLayer's validator network independently fetches every URL, judges it against the milestone terms, and reaches AI consensus on a verdict. The result is written to contract state - not to a server, not to a database.

- **Evidence verification, not self-report** - the contract derives the raw GitHub README URL from `repo_url` + `full_commit_hash`, recomputes the canonical evidence digest, and validators fetch the derived README plus `deployment_url` themselves; a `PASSED` verdict means validators confirmed real, relevant content, not that the builder claimed it
- **AI consensus review** - every validator independently re-fetches and re-judges; `verdict`, `bond_action`, `settlement_status`, and `recommended_payout_bps` - the exact percentage that controls a partial payout - must all agree before any result is stored
- **Full lifecycle on-chain** - create, accept, submit, review, settle - every step is a contract transaction
- **No off-chain storage** - no database, no private file store. All state lives in the GenLayer contract; the frontend is a pure client for it
- **Nonresponsive-sponsor recovery** - if a sponsor never requests review or never proposes a human settlement, `claim_sponsor_timeout` lets the builder reclaim the reward and bond after the response window elapses

---

## How it works

**For sponsors**

1. Create a milestone with a title, description, reward (GEN), required bond amount, and optional deadline
2. Wait for a builder to accept and lock the bond
3. Once the builder submits evidence, trigger GenLayer consensus review
4. If the verdict is auto-settleable, call `settle` (or let anyone call it) - funds disperse automatically
5. If GenLayer returns `NEEDS_HUMAN_REVIEW`, propose a payout split for the builder to accept

**For builders**

1. Accept an open milestone by locking the exact bond amount
2. Submit a public evidence packet - repo URL, pinned commit hash, deployment URL, optional key-file path, and a written explanation
3. Wait for GenLayer consensus review
4. If the sponsor requests review and the verdict is auto-settleable, anyone can call `settle` to release funds
5. If the sponsor goes silent, call `claim_sponsor_timeout` after the response window to recover the reward and bond yourself

---

## Evidence Verification

Builders supply public refs - a canonical GitHub repo URL, a full commit hash, a live deployment URL, and optionally a StudioNet transaction/contract reference. The contract derives the raw GitHub README URL from the claimed repo and exact commit, rejects mismatched raw URLs, and recomputes the evidence digest before accepting the packet. When `request_review` is called, every GenLayer validator independently fetches the derived URL and deployment with `gl.nondet.web.request`, inspects the actual content, and runs LLM judgment against the milestone terms. Validators must reach equivalent structured output before a verdict is written to state.

Outcomes stored on-chain:

| Verdict | Meaning |
| --- | --- |
| `PASSED` | Validators fetched and confirmed real, relevant evidence for every deliverable |
| `PARTIAL_PASS` | Some evidence verified, some missing or incomplete - `recommended_payout_bps` sets the split |
| `FAILED` | Repo returned 404, deployment is a placeholder, or evidence contradicts the terms |
| `NEEDS_HUMAN_REVIEW` | Fetches failed for network/access reasons the validators could not attribute to fake evidence |

Use canonical repo URLs (`https://github.com/{owner}/{repo}`) and full 40-character commit hashes. Branch names such as `main` are not accepted as evidence bindings.

---

## Milestone lifecycle

```
OPEN -> ACCEPTED -> SUBMITTED -> REVIEWING -> REVIEWED -> SETTLED
                                                  |
                                                  v
                                    HUMAN_SETTLEMENT_PROPOSED -> SETTLED
```

| Status | What happens |
| --- | --- |
| `OPEN` | Sponsor has funded the reward; waiting for a builder |
| `ACCEPTED` | Builder has locked the bond |
| `SUBMITTED` | Builder has submitted the public evidence packet |
| `REVIEWING` | GenLayer consensus round is in progress |
| `REVIEWED` | Verdict is written; auto-settleable or blocked pending human review |
| `HUMAN_SETTLEMENT_PROPOSED` | Sponsor proposed a payout split after `NEEDS_HUMAN_REVIEW`; awaiting builder acceptance |
| `SETTLED` | Funds have been disbursed; terminal state |
| `CANCELLED` | Sponsor cancelled before any builder accepted; reward refunded |

---

## GenLayer consensus functions

| Function | What GenLayer does |
| --- | --- |
| `request_review(milestone_id)` | Every validator independently fetches evidence URLs and judges them against the milestone terms; consensus required on verdict, bond action, settlement status, and payout percentage |

All other write methods are deterministic contract logic - fund custody, state transitions, and access control - and do not invoke validator consensus.

---

## Contract

| Field | Value |
| --- | --- |
| Network | GenLayer Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |
| Contract | [`0xd840A072C6B491698E53e469f214f6c6D2750Dc4`](https://explorer-studio.genlayer.com/address/0xd840A072C6B491698E53e469f214f6c6D2750Dc4) |
| Source | `contracts/ShipBondProtocol.py` |

### Write methods

| Method | Who | Payable | Notes |
|---|---|---|---|
| `create_milestone` | Sponsor | Yes, reward GEN | Locks reward into contract |
| `accept_milestone` | Builder | Yes, bond GEN | Locks builder bond, exact amount |
| `submit_evidence` | Builder | No | Evidence digest + refs JSON on-chain |
| `request_review` | Sponsor | No | Triggers GenLayer validator consensus |
| `settle` | Anyone | No | Disperses funds after an auto-settleable verdict |
| `cancel_milestone` | Sponsor | No | Only before acceptance; refunds reward |
| `propose_human_settlement` | Sponsor | No | Only after `NEEDS_HUMAN_REVIEW` |
| `accept_human_settlement` | Builder | No | Builder accepts the proposed split |
| `settle_human_agreement` | Anyone | No | Executes the mutually agreed settlement |
| `claim_sponsor_timeout` | Builder | No | Recovers reward + bond if the sponsor never responds within the timeout window |

### Read methods

`get_milestone`, `get_milestone_json`, `get_verdict`, `get_public_evidence_refs`, `get_sponsor_milestone_ids`, `get_builder_milestone_ids`, `get_count`, `is_auto_settleable`, `is_settled`, `is_sponsor_timeout_claimable`, `get_owner`.

### Consensus guarantees

- **Partial-payout percentage is validator-agreed, not leader-trusted** - `recommended_payout_bps` is included in the equivalence check alongside `verdict`, `bond_action`, and `settlement_status`, so the exact split that controls a `PARTIAL_PASS` transfer must independently match across validators.
- **Funds never lock indefinitely** - `claim_sponsor_timeout` gives the builder a recovery path if the sponsor never requests review or never proposes a human settlement within the response window (`SPONSOR_RESPONSE_TIMEOUT_SECONDS`, 7 days).
- **Zero-then-transfer escrow** - every payout path zeroes the `reward_deposited`/`bond_deposited` ledger fields and saves state before calling the transfer, so no path can pay out twice.

---

## Verified E2E (Studionet)

Full lifecycle run against real, live evidence - the actual public repository for this project and its live deployment - end to end, auto-settled with no human intervention required.

```text
milestone_id: 1
verdict: PASSED
bond_action: RETURN
recommended_payout_bps: 10000
settlement_status: COMPLETED
status: SETTLED
fetched_repo_status: ok
fetched_deployment_status: ok
fetched_tx_status: ok
```

Latest transaction trail:

| Step | Transaction |
| --- | --- |
| Deploy contract | `0x12451f4fa022270302684ad38a5359f941047b6dece5288f5b9645d16506d77a` |
| Create milestone | `0x94a91928d73b529396a76e7eeb9e20d146b7a7a4e5ec9fb6610b5d21587e8af0` |
| Accept milestone | `0xf46edbdbe2c0b566e5deb4bf31e094f7b91ee7d8599b9dcb5ff01adba67fafad` |
| Submit evidence | `0xf2f84288c2cb71d0f86b375316bbe1d07c93cf40d247a08202bbb7fbf1fe21ab` |
| Request review | `0x1f79d3fc10e48a665369af98d2dfbdf4de205a2979839c03874bfdc789c0b9c3` |
| Settle | `0x0198cea22cec3cb6adc78981686b01d151af85ee13e3cdaece7eacb6b9f016e2` |

Reasoning returned by GenLayer consensus:
> README fetched OK from pinned commit: describes ShipBond milestone bond protocol on GenLayer Studionet with sponsor/builder roles, GEN locking, AI validator consensus, and wallet connect flow. Deployment at shipbond.vercel.app fetched OK: real Next.js app - not a placeholder. All milestone deliverables are credibly evidenced by fetched content.

---

## Tech stack

| Layer | Tech |
| --- | --- |
| Intelligent contract | GenLayer Python - `gl.nondet.web.request`, `gl.vm.run_nondet_unsafe`, `gl.vm.UserError` |
| Frontend | Next.js App Router - TypeScript - Tailwind CSS |
| Web3 | GenLayer JS SDK (`genlayer-js`) - viem - wagmi |
| Auth | Wallet-signature challenge - `iron-session` cookie, no server-side session store |
| Storage | None - all state on-chain |

---

## Repository

```text
contracts/
  ShipBondProtocol.py        GenLayer Intelligent Contract - all on-chain logic

app/
  api/                       Next.js API routes - pure contract reads/writes, no database
  app/                       App shell, milestone pages, sponsor/builder views
  connect/                   Wallet connection flow

components/
  milestone/                 EvidenceSubmitForm, ConsensusChamber, VerdictCard
  wallet/                    ConnectButton, WalletBadge
  brand/                     ShipBond logo and UI tokens

hooks/
  useContractActions.ts      create, accept, submit, review, settle - one hook per write
  useGenLayerClient.ts       genlayer-js client setup
  useWalletAuth.ts           iron-session + wagmi wallet binding

lib/
  genlayer/
    studionet-chain.ts       Chain config and SHIPBOND_CONTRACT address
    contract.ts              Contract status/verdict types
    server-client.ts         Server-only read-only GenLayer client
    resolve-milestone-id.ts  Resolves the on-chain milestone_id after create_milestone
  data/
    milestones.ts            All milestone reads, wrapping server-client.ts
    nonces.ts, profiles.ts   In-memory login nonce store, wallet-only profile
  evidence-packet.ts         EvidencePacket interface, normalizer, stable JSON
  session.ts                 iron-session config
  terms-hash.ts              SHA-256 terms hash construction

scripts/
  studionet-e2e.mjs          Full on-chain E2E (create -> settle)
  route-smoke.mjs            Production route availability check
```

---

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

Open http://localhost:3000. No database setup required - the app reads and writes the deployed contract directly.

```bash
npm run typecheck
npm run build
node scripts/studionet-e2e.mjs
```

The E2E script requires funded Studionet test wallets. You can pass raw private
keys through environment variables:

```env
SHIPBOND_SPONSOR_KEY=0x...
SHIPBOND_BUILDER_KEY=0x...
```

Or use unlocked GenLayer CLI account names:

```env
SHIPBOND_SPONSOR_ACCOUNT=party_a
SHIPBOND_BUILDER_ACCOUNT=party_b
```

---

## Environment variables

```env
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
NEXT_PUBLIC_GENLAYER_EXPLORER=https://explorer-studio.genlayer.com
NEXT_PUBLIC_FAUCET_URL=https://studio.genlayer.com
NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS=0xd840A072C6B491698E53e469f214f6c6D2750Dc4
NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS=0xd840A072C6B491698E53e469f214f6c6D2750Dc4
SHIPBOND_PROTOCOL_ADDRESS=0xd840A072C6B491698E53e469f214f6c6D2750Dc4

SESSION_SECRET=your_32_plus_character_secret
SESSION_COOKIE_NAME=__shipbond_session
SESSION_MAX_AGE=604800
SHIPBOND_ADMIN_WALLETS=comma_separated_admin_wallets
```

---

## Security

- No backend database - there is nothing to leak beyond what's already public on-chain
- `SESSION_SECRET` is server-only, never prefixed with `NEXT_PUBLIC_`
- The contract has no method that lets a sponsor manually mark a verdict
- Prompt injection attempts in evidence fields are rejected before they reach the contract
- GitHub evidence is structurally bound to the claimed repository and exact commit before validator review can move funds
- Human settlement requires both sponsor proposal and builder acceptance
- All validation failures raise `gl.vm.UserError`, a clean catchable rejection - not a bare `Exception`, which GenVM treats as an unrecoverable crash

---

## Design notes

- `terms_hash` includes a client-generated nonce, sponsor wallet, and timestamp so it's globally unique, letting the app resolve the real on-chain `milestone_id` by matching `get_sponsor_milestone_ids` after `create_milestone` confirms.
- GenLayer review is intentionally non-deterministic. Consensus accepts equivalent structured verdicts - the wording of `reasoning` may differ between validators, but `verdict`, `bond_action`, `settlement_status`, and `recommended_payout_bps` must match exactly.
- `raw.githubusercontent.com` URLs are derived by the contract because they return stable plain text with no JavaScript rendering, making them reliably fetchable by every validator in a consensus round.
- The pinned GenVM runner's web-fetch `Response` object exposes `.status`, not `.status_code` - verify runtime object shapes empirically rather than trusting docs alone when the pinned runner is older than the latest.

---

## Disclaimer

ShipBond automates milestone-based payment release using AI-driven evidence verification. It does not constitute legal, financial, or contractual advice, and sponsors/builders remain responsible for the terms they agree to off-chain.

---

## License

MIT
