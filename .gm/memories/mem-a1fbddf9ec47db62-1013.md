---
key: mem-a1fbddf9ec47db62-1013
ns: default
created: 1791938769200
updated: 1791938769200
---

gm-mcp: running the repo tests or witnesses, or any copy of bin/gm-mcp-server.js, with the real HOME is not read-only. On 2026-10-13 23:55Z a test run spawned the bundle, whose release bridge replaced the live ~/.gm-tools/agentplug-runner (0.1.211 -> 0.1.323, accepted on the .sha256 sidecar although the daemon own updater had rejected 0.1.323 for no signature) and SIGTERMed the live daemon; the old guard never reaped it and gm was down for every session for about five minutes. Since AnEntrypoint/gm-mcp PR 3 a dev copy (anything not <GM_TOOLS_DIR>/gm-mcp-server.mjs) cannot swap the runner or guest, signal the daemon, or seed/retire/supervise the shared HTTP server, and the bridge is opt-in (GM_MCP_RELEASE_BRIDGE=1, or gm-mcp release-bridge --install; --signal for the daemon). Witness with node scripts/sandboxed.mjs <command> (throwaway HOME, GM_TOOLS_DIR, AGENTPLUG_HOME, no runner binary). The installed ~/.gm-tools/gm-mcp-server.mjs is 0.2.1 with no self-update and no pre-flight: replace it by hand.
