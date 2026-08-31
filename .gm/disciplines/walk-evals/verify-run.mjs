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
