# guardians discipline — per-surface fences

Modeled on Exa's per-component GUARDIAN.md pattern: each gm surface gets a fenced guardian with named scope, rules, and severity. A change touching a surface reads its guardian first. A guardian's rules are enforced by its checker where one exists, and by review where one does not.

## Surfaces and rules

### spool-protocol (`.gm/exec-spool/**`, wasm_dispatch)
- A verb request is JSON written to `in/<verb>/<session>-<N>.txt`; the response is read from `out/` in the same turn block. Never narrate before the read.
- Session-prefixed N is mandatory; a bare integer claim reads another session's response.
- State lives on disk, never in context.

### fsm-config (`.gm/instructions/fsm/**`, gm-plugkit/instructions/**)
- Graph changes replace wholesale; never merge two tiers.
- A gate's `next_dispatch` names the recovery verb; a denial without one is a defect, not a hint.
- Adding a gate condition requires a golden walk task that exercises it (walk-evals).

### memory-store (`.gm/memories/**`, vecstore)
- Memory writes are content-keyed; a prune is a tombstone, not a deletion.
- Embedding dimension changes drop-and-rebuild via the version marker, never silent-mix.

### verbs (wasm_dispatch/verbs.rs)
- A new verb is an explicit registration, never a shadowed alias of an existing verb.
- Every verb failure names a `next_dispatch` recovery path.

## Severity
All surfaces: deny. A violation blocks the transition that introduced it.
