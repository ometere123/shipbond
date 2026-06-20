# ShipBondProtocol Deployment Guide

ShipBond uses one global GenLayer protocol contract on Bradbury.

The deployed contract stores many milestones internally. A sponsor does not deploy a new contract per milestone; the app calls `create_milestone` on the global protocol contract and stores the returned on-chain milestone ID in Supabase after verification.

## Current Bradbury Contract

```env
NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS=0xfb305e9011C58ebc1303795693026769E955e6B7
SHIPBOND_PROTOCOL_ADDRESS=0xfb305e9011C58ebc1303795693026769E955e6B7
NEXT_PUBLIC_CHAIN_ID=4221
NEXT_PUBLIC_GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
NEXT_PUBLIC_GENLAYER_CHAIN_RPC=https://rpc.testnet-chain.genlayer.com
```

## Deploy Or Upgrade The Global Contract

1. Install and configure the GenLayer CLI.

```bash
npm install -g genlayer
genlayer network set bradbury
genlayer account import --name deployer
genlayer account use deployer
```

2. Deploy the protocol once.

```bash
genlayer deploy --contract contracts/ShipBondProtocol.py
```

3. Copy the deployed contract address into `.env.local`.

```env
NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS=0x...
SHIPBOND_PROTOCOL_ADDRESS=0x...
```

4. Restart the Next.js app.

```bash
npm.cmd run dev
```

## Runtime Milestone Flow

The app performs these steps for every milestone:

1. `POST /api/milestones/create`
   Creates a Supabase milestone row and computes a unique `terms_hash`.

2. Client wallet calls:

```text
create_milestone(title, description, terms_hash, bond_wei, deadline)
```

The reward is sent as transaction value.

3. `POST /api/milestones/[id]/set-on-chain-id`
   Resolves the actual on-chain milestone ID by reading `get_sponsor_milestone_ids`, matching `terms_hash`, and verifying sponsor plus terms hash before storing it.

## Contract Lifecycle

```text
create_milestone -> accept_milestone -> submit_evidence -> request_review -> settle
```

Human fallback:

```text
request_review -> NEEDS_HUMAN_REVIEW -> propose_human_settlement -> accept_human_settlement -> settle_human_agreement
```

## Read Methods

Useful contract reads:

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

- Wait for `FINALIZED` for money-moving actions.
- `ACCEPTED` is enough for some state writes, but the app generally waits for `FINALIZED` where funds or evidence finality matters.
- Supabase is a mirror and access-control layer. The GenLayer protocol contract is the source of truth for verdict and settlement state.
- Chain ID is `4221` for Bradbury.
