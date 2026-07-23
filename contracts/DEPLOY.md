# ShipBondProtocol Deployment Guide

ShipBond uses one global GenLayer protocol contract on Studionet.

The deployed contract stores many milestones internally. A sponsor does not deploy
a new contract per milestone; the app calls `create_milestone` on the global
protocol contract and stores the verified on-chain milestone ID in Supabase.

## Current Studionet Contract

```env
NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS=0xd840A072C6B491698E53e469f214f6c6D2750Dc4
NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS=0xd840A072C6B491698E53e469f214f6c6D2750Dc4
SHIPBOND_PROTOCOL_ADDRESS=0xd840A072C6B491698E53e469f214f6c6D2750Dc4
NEXT_PUBLIC_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CHAIN_RPC=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER=https://explorer-studio.genlayer.com
```

## Deploy Or Upgrade The Global Contract

1. Install and configure the GenLayer CLI.

```bash
npm install -g genlayer
genlayer network set studionet
genlayer account import --name deployer
genlayer account use deployer
```

2. Deploy the protocol once.

```bash
genlayer deploy --contract contracts/ShipBondProtocol.py
```

3. Copy the deployed contract address into `.env.local` and Vercel.

```env
NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS=0x...
SHIPBOND_PROTOCOL_ADDRESS=0x...
```

4. Restart or redeploy the Next.js app.

```bash
npm.cmd run dev
```

## Runtime Milestone Flow

1. `POST /api/milestones/create`
   Creates a Supabase milestone row and computes a unique `terms_hash`.

2. Client wallet calls:

```text
create_milestone(title, description, terms_hash, bond_wei, deadline)
```

The reward is sent as transaction value.

3. `POST /api/milestones/[id]/set-on-chain-id`
   Resolves the actual on-chain milestone ID by reading
   `get_sponsor_milestone_ids`, matching `terms_hash`, and verifying sponsor plus
   terms hash before storing it.

## Contract Lifecycle

```text
create_milestone -> accept_milestone -> submit_evidence -> request_review -> settle
```

Human fallback:

```text
request_review -> NEEDS_HUMAN_REVIEW -> propose_human_settlement -> accept_human_settlement -> settle_human_agreement
```

## Read Methods

```text
get_count()
get_milestone(milestone_id)
get_milestone_json(milestone_id)
get_sponsor_milestone_ids(sponsor)
get_builder_milestone_ids(builder)
get_verdict(milestone_id)
get_public_evidence_refs(milestone_id)
is_auto_settleable(milestone_id)
is_settled(milestone_id)
```

## Notes

- The app waits for `ACCEPTED` for fast Studionet UX.
- For payout audits, verify balances and explorer messages on Studionet after the
  network/indexer has caught up.
- Supabase is a mirror and access-control layer. The GenLayer protocol contract
  is the source of truth for verdict and settlement state.
- Chain ID is `61999` for Studionet.
