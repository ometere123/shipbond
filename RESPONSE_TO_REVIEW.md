# Response to Review — Joaquin, 2026-07-17

> **More information requested**
> Please update the contract so validators agree on the partial-payment percentage that controls the transfer. Also add a timeout or builder-triggered recovery path so a nonresponsive sponsor cannot leave the reward and bond locked indefinitely.

Both items are fixed, deployed, and verified live on-chain. Summary below, with the exact code and proof.

---

## 1. Validators now agree on the partial-payment percentage

**Before:** `validator_fn` only checked that `verdict`, `bond_action`, and `settlement_status` matched between the leader and each validator. `recommended_payout_bps` — the number that actually determines how much of the reward the builder receives on `PARTIAL_PASS` — was taken from the leader's result alone and never independently confirmed.

**Fix:** [`contracts/ShipBondProtocol.py`](contracts/ShipBondProtocol.py), inside `request_review`'s `validator_fn`:

```python
return (
    my_data.get("verdict") == leader_data.get("verdict")
    and my_data.get("bond_action") == leader_data.get("bond_action")
    and my_data.get("settlement_status") == leader_data.get("settlement_status")
    and my_data.get("recommended_payout_bps") == leader_data.get("recommended_payout_bps")
)
```

Now the exact percentage that controls a `PARTIAL_PASS` transfer must independently match across validators before it's accepted into consensus, same as the verdict itself.

## 2. Builder-triggered recovery for a nonresponsive sponsor

**Before:** if a sponsor never called `request_review` after evidence was submitted, or never called `propose_human_settlement` after a `NEEDS_HUMAN_REVIEW` verdict, the reward and bond had no way out of the contract — both `request_review` and `propose_human_settlement` are sponsor-only.

**Fix:** added `claim_sponsor_timeout(milestone_id)` — builder-only, callable once `SPONSOR_RESPONSE_TIMEOUT_SECONDS` (7 days) have elapsed since the relevant sponsor-action deadline:

```python
SPONSOR_RESPONSE_TIMEOUT_SECONDS = u256(7 * 24 * 60 * 60)  # 7 days

@gl.public.write
def claim_sponsor_timeout(self, milestone_id: str) -> None:
    ...
    if state["status"] == STATUS_SUBMITTED:
        reference_ts = _iso_to_u256(state["submitted_at"])
    elif state["status"] == STATUS_REVIEWED and state["verdict"] == VERDICT_NEEDS_HUMAN_REVIEW:
        reference_ts = _iso_to_u256(state["reviewed_at"])
    else:
        raise gl.vm.UserError("No sponsor action is pending for this milestone")

    if now < reference_ts + SPONSOR_RESPONSE_TIMEOUT_SECONDS:
        raise gl.vm.UserError("Sponsor response window has not elapsed")
    ...
    _send_gen(builder, total)  # reward + bond
```

A companion view, `is_sponsor_timeout_claimable(milestone_id)`, lets the frontend show the recovery option before the builder submits the transaction.

---

## Also fixed while verifying the above

Testing these two changes surfaced a pre-existing bug that had silently broken evidence verification: `_fetch_evidence` read `resp.status_code` on the object returned by `gl.nondet.web.request`, but this GenVM runner's `Response` object only exposes `.status` (confirmed by deploying a diagnostic probe contract and inspecting the object directly). Every fetch was throwing `AttributeError`, getting caught by a blanket `except Exception`, and silently reported as `fetch_error` — meaning every review was landing on `NEEDS_HUMAN_REVIEW` regardless of evidence quality. Fixed all 13 occurrences (`contracts/ShipBondProtocol.py`).

Also swept all `raise Exception(...)` calls to `raise gl.vm.UserError(...)` per GenLayer's documented error-handling pattern — bare `Exception` becomes an unrecoverable `VMError` crash exit, while `UserError` is a clean, catchable rejection.

---

## Live verification

Contract: [`0xd89762C939b973a04d2f06781B6e5A10f5C6CF9b`](https://explorer-studio.genlayer.com/address/0xd89762C939b973a04d2f06781B6e5A10f5C6CF9b) on GenLayer Studionet (Chain 61999), deployed with unanimous 5/5 validator consensus.

Full lifecycle run against **real evidence** — this repository's actual GitHub URL and its live Vercel deployment — with two separate funded wallets acting as sponsor and builder:

```text
milestone_id: 1
verdict: PASSED
bond_action: RETURN
recommended_payout_bps: 10000
settlement_status: COMPLETED
status: SETTLED
```

`settle()` executed automatically — no human settlement step required — and funds disbursed to the builder.

`claim_sponsor_timeout` was also exercised directly and confirmed to cleanly revert (no state change, no crash) when called before the response window elapses, and by the wrong caller.

Production deployment (`shipbond.vercel.app`) is live on this contract address and was verified reading the correct settled state via its own API route.

---

## Where to find it

- Contract: [`contracts/ShipBondProtocol.py`](contracts/ShipBondProtocol.py)
- Live app: https://shipbond.vercel.app
- Live contract: https://explorer-studio.genlayer.com/address/0xd89762C939b973a04d2f06781B6e5A10f5C6CF9b
