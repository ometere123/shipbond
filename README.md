# ShipBond

**Milestone bond protocol built on GenLayer Studionet.**

Sponsors post work with GEN locked as reward. Builders accept by posting a bond.
When work is submitted, GenLayer's Intelligent Contract runs an AI-powered
consensus review. Funds settle automatically on-chain from the accepted verdict.

Live -> **[shipbond.vercel.app](https://shipbond.vercel.app)**

Contract -> [`0xaD92f4d63B513394741cD5b5B650FfFfc3865D24`](https://explorer-studio.genlayer.com/address/0xaD92f4d63B513394741cD5b5B650FfFfc3865D24) on GenLayer Studionet (Chain 61999)

## Current Status

ShipBond is fully pointed at GenLayer Studionet and the deployed protocol
contract above.

Last verified: **June 20, 2026**

Green:

- Next.js production build
- TypeScript check
- Production route smoke test
- Live Studionet contract E2E
- On-chain settlement and balance movement

Latest live E2E result:

```text
milestone_id: 1
status: SETTLED
verdict: PASSED
bond_action: RETURN
settlement_status: COMPLETED
```

Verified transaction path:

| Step | Transaction |
|---|---|
| Create milestone | [`0xed1dd486aca1521e0abcd9f884ea7fb2d8aa843cf6a9a7b03244703afcfb900a`](https://explorer-studio.genlayer.com/tx/0xed1dd486aca1521e0abcd9f884ea7fb2d8aa843cf6a9a7b03244703afcfb900a) |
| Accept milestone | [`0x8ab2256649068dd5c2e0047f7fe6d1f42e0c73b8f68912f4d9bf10ed151041df`](https://explorer-studio.genlayer.com/tx/0x8ab2256649068dd5c2e0047f7fe6d1f42e0c73b8f68912f4d9bf10ed151041df) |
| Submit evidence | [`0xee850bd65e9472dea8a0fac2b0c262bf4f003e1981b141f0cee03b2c59b3a28c`](https://explorer-studio.genlayer.com/tx/0xee850bd65e9472dea8a0fac2b0c262bf4f003e1981b141f0cee03b2c59b3a28c) |
| Request review | [`0x461be27e895cfbbd488594690193be8af3918f1ba51900f3d33672e3b99e6649`](https://explorer-studio.genlayer.com/tx/0x461be27e895cfbbd488594690193be8af3918f1ba51900f3d33672e3b99e6649) |
| Settle | [`0xc2fc1f146bfdb8d9d1b81e5dd879483dca5fa511d7dce47ceb3d3f68ad5ebc23`](https://explorer-studio.genlayer.com/tx/0xc2fc1f146bfdb8d9d1b81e5dd879483dca5fa511d7dce47ceb3d3f68ad5ebc23) |

Known validation gap: the exact browser wallet click-through path was not
automated in Codex because the local in-app browser helper was unavailable.
The built UI routes and the live contract lifecycle were validated separately.

## How It Works

```text
Sponsor posts milestone + locks reward GEN
  -> Builder accepts + posts bond GEN
  -> Builder submits evidence
  -> Sponsor triggers GenLayer consensus review
  -> Validators reach an equivalent verdict
  -> Anyone calls settle()
```

The verdict is produced by GenLayer validator consensus. The frontend cannot set
a verdict manually.

## Network

| Item | Value |
|---|---|
| Network | GenLayer Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |
| Protocol Contract | `0xaD92f4d63B513394741cD5b5B650FfFfc3865D24` |

## Contract Methods

| Method | Who | Payable | Notes |
|---|---|---|---|
| `create_milestone` | Sponsor | Yes, reward GEN | Locks reward into contract |
| `accept_milestone` | Builder | Yes, bond GEN | Locks builder bond |
| `submit_evidence` | Builder | No | Evidence digest + refs JSON |
| `request_review` | Sponsor | No | Triggers GenLayer consensus |
| `settle` | Anyone | No | Disperses funds after verdict |
| `cancel_milestone` | Sponsor | No | Only before acceptance |
| `propose_human_settlement` | Sponsor | No | Only after `NEEDS_HUMAN_REVIEW` |
| `accept_human_settlement` | Builder | No | Builder accepts proposal |
| `settle_human_agreement` | Anyone | No | Executes agreed settlement |

## Environment Variables

```env
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CHAIN_RPC=https://studio.genlayer.com/api
NEXT_PUBLIC_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
NEXT_PUBLIC_GENLAYER_EXPLORER=https://explorer-studio.genlayer.com
NEXT_PUBLIC_FAUCET_URL=https://studio.genlayer.com

NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS=0xaD92f4d63B513394741cD5b5B650FfFfc3865D24
NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS=0xaD92f4d63B513394741cD5b5B650FfFfc3865D24
SHIPBOND_PROTOCOL_ADDRESS=0xaD92f4d63B513394741cD5b5B650FfFfc3865D24

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

SESSION_SECRET=your_32_plus_character_secret
SESSION_COOKIE_NAME=__shipbond_session
SESSION_MAX_AGE=604800
SHIPBOND_ADMIN_WALLETS=comma_separated_admin_wallets
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser.

## Project Structure

```text
contracts/
  ShipBondProtocol.py

app/
  api/
  app/
  connect/

components/
  milestone/
  wallet/
  brand/

hooks/
  useContractActions.ts
  useGenLayerClient.ts
  useWalletAuth.ts

lib/
  genlayer/
    studionet-chain.ts
    server-client.ts
    contract.ts
    resolve-milestone-id.ts
  wagmi.ts
  terms-hash.ts
  session.ts

scripts/
  studionet-e2e.mjs
```

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply Supabase migrations from `supabase/migrations/` in order.

## Validation

```bash
npm run typecheck
npm run build
node scripts/studionet-e2e.mjs
```

The live e2e script expects funded Studionet test wallets in:

```env
SHIPBOND_SPONSOR_KEY=
SHIPBOND_BUILDER_KEY=
```

The E2E runner defaults to `ACCEPTED` transaction waiting for faster Studionet
feedback. Set `SHIPBOND_WAIT_STATUS=FINALIZED` only when you intentionally want
to wait for finality.

Production route smoke:

```bash
npm run build
set SHIPBOND_BASE_URL=http://127.0.0.1:3001
node scripts/route-smoke.mjs
```

## Design Notes

- `terms_hash` includes the local Supabase UUID, sponsor wallet, and timestamp so
  the server can resolve the verified on-chain milestone ID safely.
- GenLayer review is intentionally non-deterministic; consensus accepts equivalent
  structured verdicts.
- The app waits for `ACCEPTED` for fast Studionet UX. For payout audits, verify
  final balances/messages directly on Studionet.

## License

MIT
