# walk-evals discipline — golden walk regression gate

A golden walk set is a frozen, graded set of end-to-end gm sessions. It is the regression gate for changes to the walk machinery: skills/gm/SKILL.md, .gm/instructions/fsm/**, gm-plugkit/instructions/**, and any rs-plugkit gate predicate or dispatcher change.

Model (borrowed from Exa's golden-stage1-evals): a frozen task set, a witnessed run per change, a graded outcome, and a comparison against the pinned baseline. A change that drops the golden completion rate or raises the gate-denial rate does not ship.

## Rules

1. The golden set lives in golden-tasks.json. It is append-mostly. Each task has: id, prompt, expected_phases (the phases a correct walk must enter), forbidden (behaviors that fail the task regardless of outcome), and grade_rubric (what a grader checks in the trace).
2. A run is a real, witnessed execution of the task in a live session. A self-reported pass is not a run. The per-task record is the session's turn-summary plus the dispatch ledger hash (.gm/exec-spool/.evidence-receipt.json).
3. The gate compares against the pinned baseline in baseline.json: completion rate must not drop, mean gate denials per walk must not rise, and any newly-firing gate names a residual that did not exist before.
4. Changes to a gate predicate must note which golden tasks exercise that gate. If none do, add one in the same change.
5. The eval never blocks on infrastructure it does not own (no network, no external CI): golden tasks run against a scratch repo fixture.
