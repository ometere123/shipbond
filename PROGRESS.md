# ShipBond Progress

Last updated: **July 23, 2026**

## Status

ShipBond is green on GenLayer Studionet.

Latest local remediation addresses the staff evidence-authenticity request:
GitHub evidence is now derived from the claimed repository and exact commit
hash, and the evidence digest is recomputed by the contract before evidence is
accepted.

The app, contract helpers, docs, and E2E scripts now target:

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Explorer: `https://explorer-studio.genlayer.com`
- Protocol contract: `0xd840A072C6B491698E53e469f214f6c6D2750Dc4`

## Verified

- `python -m pytest tests\direct\test_evidence_authenticity.py -v` passed.
- `python -m py_compile contracts\ShipBondProtocol.py` passed.
- `npm run typecheck` passed after the evidence-authenticity changes.
- Studionet deployment passed with 5/5 validator agreement.
- Two-account Studionet E2E passed with `party_a` as sponsor and `party_b`
  as builder: create, accept, submit canonical evidence, request review, settle.
- `npm run build` passed.
- Production route smoke passed for `/`, `/connect`, `/app/port`,
  `/app/verdicts`, `/app/contract-trace`, and `/app/settings`.
- Live Studionet E2E passed from create through settlement.
- Final contract read-back confirmed:
  - milestone `1`
  - status `SETTLED`
  - verdict `PASSED`
  - bond action `RETURN`
  - settlement status `COMPLETED`
- Balance read-back confirmed the builder received the payout.

## July 23 Evidence Authenticity Remediation

The contract now structurally binds GitHub evidence before validator review can
move funds:

- `submit_evidence` recomputes the canonical evidence digest and rejects any
  builder-supplied digest mismatch.
- `repo_url` must be a canonical `https://github.com/{owner}/{repo}` URL.
- `full_commit_hash` must be a 40-character lowercase commit hash.
- `raw_readme_url` is derived as
  `https://raw.githubusercontent.com/{owner}/{repo}/{commit}/README.md`.
- Optional key-file proof now uses `key_file_path`, which is also derived from
  the same repository and commit.
- Supplied raw README or key-file URLs are accepted only if they exactly match
  the contract-derived URL.
- The frontend now computes the same canonical digest material as the contract
  and shows the README URL as derived/read-only.

Focused tests were added for:

- Canonical raw README derivation from repo plus commit.
- Rejection of raw README URLs from another repo.
- Rejection of branch-based raw README URLs such as `/main/README.md`.
- Digest tamper detection.

`genvm-lint check contracts\ShipBondProtocol.py` could not be run locally
because `genvm-lint` is not installed on PATH in this environment. Run it before
the next Studionet deployment.

## Latest Live E2E Transactions

| Step | Transaction |
|---|---|
| Deploy contract | `0x12451f4fa022270302684ad38a5359f941047b6dece5288f5b9645d16506d77a` |
| Create milestone | `0x94a91928d73b529396a76e7eeb9e20d146b7a7a4e5ec9fb6610b5d21587e8af0` |
| Accept milestone | `0xf46edbdbe2c0b566e5deb4bf31e094f7b91ee7d8599b9dcb5ff01adba67fafad` |
| Submit evidence | `0xf2f84288c2cb71d0f86b375316bbe1d07c93cf40d247a08202bbb7fbf1fe21ab` |
| Request review | `0x1f79d3fc10e48a665369af98d2dfbdf4de205a2979839c03874bfdc789c0b9c3` |
| Settle | `0x0198cea22cec3cb6adc78981686b01d151af85ee13e3cdaece7eacb6b9f016e2` |

## Not Fully Automated

The exact browser wallet click-through flow was not automated in Codex because
the local in-app browser automation helper was unavailable. This means the
human UI path should still be manually clicked once in Chrome/MetaMask:

1. Connect wallet and sign in.
2. Create a fresh Studionet milestone.
3. Switch to builder wallet.
4. Accept and lock bond.
5. Submit evidence.
6. Switch to sponsor wallet.
7. Request review.
8. Settle after a non-human-review verdict.

The built UI routes and the live on-chain lifecycle are already green.

## Operational Notes

- Use fresh Supabase milestones on Studionet. Old Bradbury rows should be
  archived or cleared because their `on_chain_id` values refer to the old
  deployment.
- The app waits for `ACCEPTED` by default for fast Studionet UX.
- Use `SHIPBOND_WAIT_STATUS=FINALIZED` only for slower finality audits.
- Never expose funded private keys in public logs, docs, Vercel variables with
  browser exposure, or committed files.
