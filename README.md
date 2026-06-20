# ShipBond

**Milestone bond protocol built on GenLayer Studionet.**

Sponsors post work with GEN locked as reward. Builders accept by posting a bond.
When work is submitted, GenLayer's Intelligent Contract runs an AI-powered
consensus review. Funds settle automatically on-chain from the accepted verdict.

Live -> **[shipbond.vercel.app](https://shipbond.vercel.app)**

Contract -> [`0xaD92f4d63B513394741cD5b5B650FfFfc3865D24`](https://explorer-studio.genlayer.com/address/0xaD92f4d63B513394741cD5b5B650FfFfc3865D24) on GenLayer Studionet (Chain 61999)

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

## Design Notes

- `terms_hash` includes the local Supabase UUID, sponsor wallet, and timestamp so
  the server can resolve the verified on-chain milestone ID safely.
- GenLayer review is intentionally non-deterministic; consensus accepts equivalent
  structured verdicts.
- The app waits for `ACCEPTED` for fast Studionet UX. For payout audits, verify
  final balances/messages directly on Studionet.

## License

MIT
