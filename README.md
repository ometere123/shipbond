# ShipBond

**Milestone bond protocol built on GenLayer.**

Sponsors post work with GEN locked as reward. Builders accept by posting a bond. When work is submitted, GenLayer's Intelligent Contract runs an AI-powered consensus review — no human can override the verdict. Funds settle automatically on-chain.

Live → **[shipbond.vercel.app](https://shipbond.vercel.app)**  
Contract → [`0xfb305e9011C58ebc1303795693026769E955e6B7`](https://explorer-bradbury.genlayer.com/address/0xfb305e9011C58ebc1303795693026769E955e6B7) on GenLayer Bradbury (Chain 4221)

---

## How it works

```
Sponsor posts milestone + locks reward GEN
        ↓
Builder accepts + posts bond GEN
        ↓
Builder submits evidence (digest + refs)
        ↓
Sponsor triggers GenLayer consensus review
        ↓
AI validators reach consensus → PASSED / PARTIAL_PASS / FAILED / NEEDS_HUMAN_REVIEW
        ↓
Anyone calls settle() → funds disperse on-chain automatically
```

The verdict is **produced by GenLayer's validator network** — no admin, no sponsor, no builder can set it manually. The frontend cannot submit a pre-decided result. The contract enforces this.

---

## Verdict outcomes

| Verdict | Builder gets | Bond |
|---|---|---|
| `PASSED` | Full reward | Returned |
| `PARTIAL_PASS` | Proportional payout (bps) | Returned |
| `FAILED` | Nothing | Slashed to sponsor |
| `NEEDS_HUMAN_REVIEW` | Held | Held — dispute flow |

---

## Tech stack

| Layer | Technology |
|---|---|
| Intelligent Contract | Python on GenLayer (Bradbury testnet) |
| Frontend | Next.js 16 · React 19 · Tailwind CSS |
| Web3 reads/writes | genlayer-js 1.1.8 |
| Wallet connection | wagmi v2 · viem v2 · injected() connector |
| Auth | SIWE-style sign-to-verify · iron-session v8 |
| Database | Supabase (Postgres + RLS) |
| Deployment | Vercel |

---

## Network

| | Value |
|---|---|
| Network | GenLayer Bradbury Testnet |
| Chain ID | 4221 |
| IC RPC | `https://rpc-bradbury.genlayer.com` |
| Chain RPC | `https://rpc.testnet-chain.genlayer.com` |
| IC Explorer | `https://explorer-bradbury.genlayer.com` |
| Chain Explorer | `https://explorer.testnet-chain.genlayer.com` |
| Faucet | `https://testnet-faucet.genlayer.foundation` |

---

## Contract methods

| Method | Who | Payable | Notes |
|---|---|---|---|
| `create_milestone` | Sponsor | ✓ reward GEN | Locks reward into contract |
| `accept_milestone` | Builder | ✓ bond GEN | Locks builder bond |
| `submit_evidence` | Builder | — | Evidence digest + refs JSON |
| `request_review` | Sponsor | — | Triggers GenLayer consensus |
| `settle` | Anyone | — | Disperses funds after verdict |
| `cancel_milestone` | Sponsor | — | Only before acceptance |
| `propose_human_settlement` | Sponsor | — | Only after NEEDS_HUMAN_REVIEW |
| `accept_human_settlement` | Builder | — | Builder accepts proposal |
| `settle_human_agreement` | Anyone | — | Executes agreed settlement |

---

## Project structure

```
contracts/
  ShipBondProtocol.py     # GenLayer Intelligent Contract (v0.2.18)

app/
  api/
    auth/                 # Nonce, verify, logout (SIWE flow)
    milestones/           # Create, accept, evidence, review, settle
    contract/             # Read milestone, sync verdict
  app/                    # Authenticated app routes
  connect/                # Wallet connect page

components/
  milestone/              # CreateMilestoneForm, EvidenceSubmitForm, etc.
  wallet/                 # ConnectWalletPanel, ChainMismatchBanner
  brand/                  # ShipBondLogo

hooks/
  useContractActions.ts   # All write hooks (create, accept, submit, review, settle)
  useGenLayerClient.ts    # genlayer-js client bound to connected wallet
  useWalletAuth.ts        # Sign-to-verify auth flow

lib/
  genlayer/
    bradbury-chain.ts     # Chain definition (testnetBradbury from genlayer-js 1.1.8)
    server-client.ts      # Server-only read helpers
    contract.ts           # Types + verdict/bond_action mappers
    resolve-milestone-id.ts  # Post-create on_chain_id resolution via terms_hash
  wagmi.ts                # wagmi config (Bradbury, injected connector)
  terms-hash.ts           # SHA-256 terms hash (includes local UUID + sponsor + timestamp)
  session.ts              # iron-session config

supabase/
  migrations/             # 001–009 schema migrations
```

---

## Security constraints (enforced, not configurable)

- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — never exposed to the browser, never prefixed `NEXT_PUBLIC_`
- Sponsor cannot call any method that sets a verdict manually
- Builder submissions are private — submitters cannot see each other's evidence
- Funder can view submissions; builders cannot see others'
- No embedded wallets. No Privy. Injected wallet only (MetaMask, Rabby, Frame)
- StudioNet and Chain ID 61999 are never used anywhere in the codebase
- Verdict is produced exclusively by GenLayer validator consensus

---

## Environment variables

```env
# Public — safe for browser
NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS=0xfb305e9011C58ebc1303795693026769E955e6B7
NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS=0xfb305e9011C58ebc1303795693026769E955e6B7
NEXT_PUBLIC_GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
NEXT_PUBLIC_GENLAYER_CHAIN_RPC=https://rpc.testnet-chain.genlayer.com
NEXT_PUBLIC_GENLAYER_CHAIN_ID=4221
NEXT_PUBLIC_BRADBURY_EXPLORER=https://explorer-bradbury.genlayer.com
NEXT_PUBLIC_CHAIN_EXPLORER=https://explorer.testnet-chain.genlayer.com
NEXT_PUBLIC_FAUCET_URL=https://testnet-faucet.genlayer.foundation
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

# Server-only — never expose to browser
SHIPBOND_PROTOCOL_ADDRESS=0xfb305e9011C58ebc1303795693026769E955e6B7
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # NEVER prefix with NEXT_PUBLIC_
SESSION_SECRET=your_64_char_hex_secret
```

---

## Local development

```bash
git clone https://github.com/ometere123/shipbond.git
cd shipbond
npm install

cp .env.example .env.local
# fill in your Supabase credentials and SESSION_SECRET

npm run dev
```

Apply database migrations in the Supabase SQL editor (`supabase/migrations/` in order).

---

## Database migrations

| File | Description |
|---|---|
| `001_login_nonces.sql` | SIWE nonce store |
| `002_profiles.sql` | Wallet-linked user profiles |
| `003_milestones.sql` | Core milestone table |
| `004_submissions.sql` | Builder submissions |
| `005_evidence_files.sql` | Evidence file refs |
| `006_reviews.sql` | GenLayer review records |
| `007_settlements.sql` | Settlement records |
| `008_access_audit.sql` | Audit log |
| `009_fix_verdict_enums.sql` | Verdict enum values update |

---

## Key design decisions

**Terms hash uniqueness** — Each milestone's `terms_hash` includes the pre-generated Supabase UUID, sponsor wallet address, and creation timestamp. This makes the hash globally unique and allows the server to resolve the `on_chain_id` by scanning `get_sponsor_milestone_ids` and matching on `terms_hash` after the transaction finalizes — no race conditions.

**RPC separation** — genlayer-js uses the IC RPC (`rpc-bradbury.genlayer.com`) for Intelligent Contract reads and writes. wagmi uses the standard EVM chain RPC (`rpc.testnet-chain.genlayer.com`) for wallet ops. These are separate chain objects and must stay separate.

**FINALIZED wait** — All payable transactions (`create_milestone`, `accept_milestone`, `settle`) wait for `TransactionStatus.FINALIZED`. State-only writes (`propose_human_settlement`, `accept_human_settlement`) wait for `ACCEPTED`. IC storage only commits at FINALIZED — reading state before then returns stale data.

**u256 args as BigInt** — GenLayer's calldata encoder encodes JavaScript `bigint` as `TYPE_PINT` (correct for `u256` params). Passing `String(bigint)` encodes as `TYPE_STR` and causes `FINISHED_WITH_ERROR` in the Python contract.

---

## License

MIT
