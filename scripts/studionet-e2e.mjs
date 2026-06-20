import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, ExecutionResult } from "genlayer-js/types";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { getAddress } from "viem";

export async function runStudionetE2E({
  sponsorKey,
  builderKey,
  contractAddress = "0xaD92f4d63B513394741cD5b5B650FfFfc3865D24",
  skipReview = false,
  waitStatus = TransactionStatus.ACCEPTED,
  log = console.log,
}) {
  if (!sponsorKey || !builderKey) {
    throw new Error("sponsorKey and builderKey are required");
  }

  const sponsor = createAccount(sponsorKey);
  const builder = createAccount(builderKey);
  const readClient = createClient({ chain: studionet });
  const sponsorClient = createClient({ chain: studionet, account: sponsor });
  const builderClient = createClient({ chain: studionet, account: builder });
  sponsorClient.estimateTransactionGas = async () => 200000n;
  builderClient.estimateTransactionGas = async () => 200000n;

  const rewardWei = 10n ** 15n; // 0.001 GEN
  const bondWei = 10n ** 15n;   // 0.001 GEN
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const title = `ShipBond Studionet E2E ${nonce}`;
  const description = [
    "Automated ShipBond Studionet E2E milestone.",
    "Builder must provide a public evidence packet with repo, commit, deployment, tx hash, smoke test result, and explanation.",
    "This run validates create, accept, submit, review request, and readable state transitions.",
  ].join(" ");
  const termsHash = sha256(JSON.stringify({
    title,
    description,
    sponsor: sponsor.address.toLowerCase(),
    reward_wei: rewardWei.toString(),
    bond_wei: bondWei.toString(),
    nonce,
  }));

  const summary = {
    sponsor: maskAddress(sponsor.address),
    builder: maskAddress(builder.address),
    contract: contractAddress,
    title,
    steps: [],
  };

  log(JSON.stringify({ event: "start", ...summary }, null, 2));

  log(JSON.stringify({ event: "step", name: "create_milestone:start" }));
  const createHashTx = await withTimeout(sponsorClient.writeContract({
    address: contractAddress,
    functionName: "create_milestone",
    args: [title, description, termsHash, bondWei, 0n],
    value: rewardWei,
  }), 45000, "create_milestone writeContract");
  log(JSON.stringify({ event: "step", name: "create_milestone:tx", tx: createHashTx }));
  await waitOk(readClient, createHashTx, waitStatus, "create_milestone", 45);
  summary.steps.push({ name: "create_milestone", tx: createHashTx });

  const milestoneId = await resolveMilestoneId({ readClient, contractAddress, sponsorAddress: sponsor.address, termsHash, title, rewardWei, bondWei });
  if (!milestoneId) throw new Error("Could not resolve milestone ID after create_milestone");
  summary.milestoneId = milestoneId;

  const created = await readClient.readContract({
    address: contractAddress,
    functionName: "get_milestone",
    args: [milestoneId],
  });
  assertEqual(created.status, "OPEN", "created status");

  log(JSON.stringify({ event: "step", name: "accept_milestone:start", milestoneId }));
  const acceptTx = await withTimeout(builderClient.writeContract({
    address: contractAddress,
    functionName: "accept_milestone",
    args: [milestoneId],
    value: bondWei,
  }), 45000, "accept_milestone writeContract");
  log(JSON.stringify({ event: "step", name: "accept_milestone:tx", tx: acceptTx }));
  await waitOk(readClient, acceptTx, waitStatus, "accept_milestone", 45);
  summary.steps.push({ name: "accept_milestone", tx: acceptTx });

  const accepted = await waitForMilestoneStatus(readClient, contractAddress, milestoneId, "ACCEPTED", 12);
  assertEqual(String(accepted.builder).toLowerCase(), builder.address.toLowerCase(), "builder address");

  const evidence = {
    repo_url: "https://example.com/shipbond-e2e",
    commit_hash: sha256(`commit-${nonce}`),
    deployment_url: "https://example.com/shipbond-e2e/deployment",
    contract_address: contractAddress,
    write_tx_hash: acceptTx,
    read_result_summary: "Automated smoke read succeeded after builder accepted the milestone.",
    smoke_test_result: "Route and contract smoke scenario executed by ShipBond Studionet E2E runner.",
    acceptance_criteria_checklist: [
      "Repository reference supplied.",
      "Deployment reference supplied.",
      "Transaction hash supplied.",
      "Smoke result supplied.",
    ],
    builder_explanation_summary: "This is an automated test packet for the ShipBond contract lifecycle.",
  };
  const evidenceJson = stableJson(evidence);
  const evidenceDigest = sha256(evidenceJson);

  log(JSON.stringify({ event: "step", name: "submit_evidence:start", milestoneId }));
  const submitTx = await withTimeout(builderClient.writeContract({
    address: contractAddress,
    functionName: "submit_evidence",
    args: [milestoneId, evidenceDigest, evidenceJson],
    value: 0n,
  }), 45000, "submit_evidence writeContract");
  log(JSON.stringify({ event: "step", name: "submit_evidence:tx", tx: submitTx }));
  await waitOk(readClient, submitTx, waitStatus, "submit_evidence", 45);
  summary.steps.push({ name: "submit_evidence", tx: submitTx });

  const submitted = await waitForMilestoneStatus(readClient, contractAddress, milestoneId, "SUBMITTED", 18);
  assertEqual(submitted.evidence_digest, evidenceDigest, "evidence digest");

  let reviewTx = null;
  let verdict = null;
  if (!skipReview) {
    log(JSON.stringify({ event: "step", name: "request_review:start", milestoneId }));
    reviewTx = await withTimeout(sponsorClient.writeContract({
      address: contractAddress,
      functionName: "request_review",
      args: [milestoneId],
      value: 0n,
    }), 90000, "request_review writeContract");
    log(JSON.stringify({ event: "step", name: "request_review:tx", tx: reviewTx }));
    await waitOk(readClient, reviewTx, waitStatus, "request_review", 90);
    summary.steps.push({ name: "request_review", tx: reviewTx });

    verdict = await waitForVerdict(readClient, contractAddress, milestoneId, 24);
    if (!verdict.verdict) throw new Error("Review finalized but verdict is empty");
    summary.verdict = verdict.verdict;
    summary.bondAction = verdict.bond_action;

    if (verdict.verdict !== "NEEDS_HUMAN_REVIEW") {
      log(JSON.stringify({ event: "step", name: "settle:start", milestoneId }));
      const settleTx = await withTimeout(sponsorClient.writeContract({
        address: contractAddress,
        functionName: "settle",
        args: [milestoneId],
        value: 0n,
      }), 90000, "settle writeContract");
      log(JSON.stringify({ event: "step", name: "settle:tx", tx: settleTx }));
      await waitOk(readClient, settleTx, waitStatus, "settle", 90);
      summary.steps.push({ name: "settle", tx: settleTx });

      await waitForMilestoneStatus(readClient, contractAddress, milestoneId, "SETTLED", 24);
    }
  }

  const result = {
    event: "passed",
    ...summary,
    txs: summary.steps.map((step) => ({ name: step.name, tx: step.tx })),
  };
  log(JSON.stringify(result, null, 2));
  return result;
}

if (typeof process !== "undefined" && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sponsorKey = process.env.SHIPBOND_SPONSOR_KEY;
  const builderKey = process.env.SHIPBOND_BUILDER_KEY;
  const contractAddress = process.env.SHIPBOND_PROTOCOL_ADDRESS
    ?? process.env.NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS
    ?? "0xaD92f4d63B513394741cD5b5B650FfFfc3865D24";

  await runStudionetE2E({
    sponsorKey,
    builderKey,
    contractAddress,
    skipReview: process.env.SHIPBOND_SKIP_REVIEW === "1",
    waitStatus: process.env.SHIPBOND_WAIT_STATUS === "FINALIZED"
      ? TransactionStatus.FINALIZED
      : TransactionStatus.ACCEPTED,
  });
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return JSON.stringify({
    acceptance_criteria_checklist: value.acceptance_criteria_checklist,
    builder_explanation_summary: value.builder_explanation_summary,
    commit_hash: value.commit_hash,
    contract_address: value.contract_address,
    deployment_url: value.deployment_url,
    read_result_summary: value.read_result_summary,
    repo_url: value.repo_url,
    smoke_test_result: value.smoke_test_result,
    write_tx_hash: value.write_tx_hash,
  });
}

async function waitOk(client, hash, status, label, timeoutSeconds = 45) {
  let receipt;
  try {
    receipt = await withTimeout(client.waitForTransactionReceipt({
      hash,
      status,
      retries: Math.max(timeoutSeconds, 10),
      fullTransaction: false,
    }), timeoutSeconds * 1000, `${label} waitForTransactionReceipt`);
  } catch (error) {
    console.warn(`${label}: receipt wait timed out; continuing with state polling`);
    return null;
  }

  if (receipt.txExecutionResultName && receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    throw new Error(`${label} execution failed: ${receipt.txExecutionResultName}`);
  }

  return receipt;
}

async function resolveMilestoneId({ readClient, contractAddress, sponsorAddress, termsHash, title, rewardWei, bondWei }) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));

    const rawIds = await readClient.readContract({
      address: contractAddress,
      functionName: "get_sponsor_milestone_ids",
      args: [getAddress(sponsorAddress)],
    });

    const ids = String(rawIds ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a));

    for (const id of ids) {
      const milestone = await readClient.readContract({
        address: contractAddress,
        functionName: "get_milestone",
        args: [id],
      });

      if (
        String(milestone.sponsor).toLowerCase() === sponsorAddress.toLowerCase()
        && milestone.terms_hash === termsHash
        && milestone.title === title
        && String(milestone.reward_wei) === rewardWei.toString()
        && String(milestone.bond_wei) === bondWei.toString()
      ) {
        return id;
      }
    }
  }

  return null;
}

async function waitForMilestoneStatus(readClient, contractAddress, milestoneId, status, attempts) {
  let latest = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    latest = await readClient.readContract({
      address: contractAddress,
      functionName: "get_milestone",
      args: [milestoneId],
    });
    if (latest.status === status) return latest;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Timed out waiting for milestone ${milestoneId} to reach ${status}; latest status ${latest?.status}`);
}

async function waitForVerdict(readClient, contractAddress, milestoneId, attempts) {
  let latest = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    latest = await readClient.readContract({
      address: contractAddress,
      functionName: "get_verdict",
      args: [milestoneId],
    });
    if (latest?.verdict) return latest;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Timed out waiting for verdict on milestone ${milestoneId}; latest status ${latest?.status ?? "unknown"}`);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch. Expected ${expected}, got ${actual}`);
  }
}

function maskAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}
