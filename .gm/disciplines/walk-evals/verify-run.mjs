// verify-run.mjs — witnessed runner for the walk-evals golden set.
// A run is a real session execution; this harness only collects + grades the
// evidence (turn-summary + evidence receipt), it never marks a pass itself.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('./', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

export function loadGoldenTasks() {
  return JSON.parse(readFileSync(`${ROOT}golden-tasks.json`, 'utf8')).tasks;
}

export function loadBaseline() {
  const p = `${ROOT}baseline.json`;
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}

export function gradeRunEvidence({ task, turnSummary, evidenceReceipt }) {
  const failures = [];
  const receiptOk = evidenceReceipt && typeof evidenceReceipt.ledger_hash === 'string'
    && evidenceReceipt.ledger_hash.length === 16;
  if (!receiptOk) failures.push('no-evidence-receipt: walk has no hash-chained ledger evidence');
  const summaryHash = createHash('sha256').update(JSON.stringify(turnSummary ?? {})).digest('hex').slice(0, 16);
  if (!turnSummary) failures.push('no-turn-summary');
  return {
    task_id: task.id,
    ok: failures.length === 0,
    failures,
    evidence: {
      ledger_hash: evidenceReceipt?.ledger_hash ?? null,
      head_sha: evidenceReceipt?.head_sha ?? null,
      summary_hash: summaryHash,
    },
  };
}

export function compareToBaseline(results, baseline) {
  if (!baseline) return { ok: true, note: 'no baseline pinned; this run becomes the baseline' };
  const completed = results.filter((r) => r.ok).length;
  const rate = results.length === 0 ? 0 : completed / results.length;
  const baseRate = baseline.completion_rate ?? 0;
  return {
    ok: rate >= baseRate,
    completion_rate: rate,
    baseline_completion_rate: baseRate,
    regressed_tasks: results.filter((r) => !r.ok && (baseline.passed_task_ids ?? []).includes(r.task_id)).map((r) => r.task_id),
  };
}

// --- golden-stage1 mechanics (Exa golden-stage1-evals/golden_stage1/metrics.py) ---

// A/A null-first: score the SAME arm twice over the golden set. Agent walks are
// high-variance; the A/A variation IS the noise floor. Any arm-comparison run
// that has not first measured its own A/A spread compares against noise, not
// signal. Returns the per-task disagreement count and the null spread — if the
// null spread is nonzero, deltas smaller than it are not reportable.
export function aaNullSpread(runA, runB) {
  const bById = new Map(runB.map((r) => [r.task_id, r.ok]));
  let disagreements = 0;
  for (const r of runA) {
    if (bById.has(r.task_id) && bById.get(r.task_id) !== r.ok) disagreements += 1;
  }
  return { disagreements, spread: disagreements, comparable: disagreements === 0 };
}

// Paired per-item bootstrap delta: resample the TASK (not the corpus), so the
// delta CI reflects task-level variance. b_minus_a per task id; percentile CI95
// via seeded LCG (deterministic — same inputs, same intervals, replay-safe).
export function pairedBootstrapDelta(runNew, runBase, { iterations = 1000, seed = 1337 } = {}) {
  const baseById = new Map(runBase.map((r) => [r.task_id, r.ok ? 1 : 0]));
  const deltas = [];
  for (const r of runNew) {
    if (baseById.has(r.task_id)) deltas.push((r.ok ? 1 : 0) - baseById.get(r.task_id));
  }
  if (deltas.length === 0) return { delta: 0, ci95: [0, 0], n: 0, note: 'no paired tasks' };
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  let s = seed >>> 0;
  const lcg = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
  const boots = [];
  for (let i = 0; i < iterations; i += 1) {
    let sum = 0;
    for (let j = 0; j < deltas.length; j += 1) sum += deltas[Math.floor(lcg() * deltas.length)];
    boots.push(sum / deltas.length);
  }
  boots.sort((a, b) => a - b);
  const lo = boots[Math.floor(0.025 * boots.length)];
  const hi = boots[Math.floor(0.975 * boots.length)];
  return { delta: mean, ci95: [lo, hi], n: deltas.length, excludes_zero: lo > 0 || hi < 0 };
}

// Fail-closed comparability gate: two runs are comparable only when the task
// sets are identical and the null spread was measured. Otherwise the verdict
// is INCOMPARABLE, never a guessed pass/fail.
export function compareArms(runNew, runBase, nullSpread) {
  const paired = pairedBootstrapDelta(runNew, runBase);
  if (paired.n === 0) return { verdict: 'INCOMPARABLE', reason: 'no paired tasks between arms' };
  if (!nullSpread || !nullSpread.comparable) {
    return { verdict: 'INCOMPARABLE', reason: 'A/A null spread nonzero or unmeasured — arm noise floor unknown', paired };
  }
  const significant = paired.excludes_zero;
  return {
    verdict: significant ? (paired.delta < 0 ? 'REGRESSION' : 'IMPROVEMENT') : 'NO-DELTA',
    paired,
    null_disagreements: nullSpread.disagreements,
  };
}
