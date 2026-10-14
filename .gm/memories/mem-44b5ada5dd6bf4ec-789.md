---
key: mem-44b5ada5dd6bf4ec-789
ns: default
created: 1791938769462
updated: 1791938769462
---

agentplug sweeps a project at agentplug_host::project_root(path): canonicalize, then the nearest ancestor holding a .git file or .git/HEAD, else the path itself (spool at main.rs:78 and dispatch at main.rs:165 apply it; daemon read_registry canonicalizes every lease the same way). A spool in any other directory is never swept: a dispatch whose cwd is a subdirectory and whose wrapper cannot resolve the root through git (no git on PATH, timeout) wrote its in-file into <sub>/.gm/exec-spool, waited out 120 s and left it behind. An old .status.json there (9.8 days, runner_update_in_progress still true) is the record of a daemon that once swept it, not a live daemon. gm-mcp mirrors the rule in sweptRootFor (PR 4); the plugkit guest cannot detect it (it runs only for a claimed ticket).
