# Browser Session / Navigation Diagnostics

## Conclusion

**SESSION/RESTORE ISSUE** — the required `uae-admin` session is not stable for deterministic navigation. The evidence does not support an authentication, middleware redirect, or application-route redirect diagnosis.

## Controlled reproduction

1. Used `agent-browser --session uae-admin --restore tab list --json` before navigation.
   - One page tab existed (`t1`), initially at `/en/admin/profile`.
   - No additional browser tabs/pages were reported.
2. Cleared console, page errors, and browser request log.
3. Explicitly opened `http://localhost:3000/en/admin` with the required session/restore options.
4. Waited 1.5 seconds, then read URL, title, a fresh accessibility snapshot, and screenshot.
5. Per the instruction to stop on URL/render disagreement, no Products, Settings, or API Sandbox navigation was initiated as part of the controlled sequence.

## Reproduction result

| Item | Expected | Actual | Navigation |
| --- | --- | --- | --- |
| Dashboard | URL `/en/admin`; dashboard heading/content | `open` printed `/en/admin`, but the subsequent URL read was `/en/admin/settings` and the fresh AX snapshot heading was **“Platform Settings”** | Explicit request was Dashboard; observed Settings transition was unexpected |
| Products | `/en/admin/products`; Products heading | Not attempted after the mismatch | N/A |
| Settings | `/en/admin/settings`; “Platform Settings” | Rendered as the unexpected result of the Dashboard request | Unexpected |
| API Sandbox | `/en/admin/api-sandbox`; “API Integration Tester” | Not attempted as an explicit controlled navigation | N/A |

The diagnostic screenshot of the mismatched Dashboard request is `qa/admin-session-dashboard.png`.

## Session and restore evidence

- Every command reported `restore: loaded; save: saved`.
- `tab list --json` reported `restoreStatus: "loaded"`, `reused: true`, and a single persistent tab (`t1`).
- After the invalid Dashboard sequence, a later tab listing showed that same tab at `/en/admin/api-sandbox` — despite no explicit API Sandbox navigation being issued during this controlled test.
- Browser request diagnostics showed successful document requests for `/en/admin`, `/en/admin/profile`, `/en/admin/settings`, and `/en/admin/api-sandbox`. The additional document navigations are unexplained by the controlled command sequence.

This makes `--restore` a material contributor: it loads and saves state on every separate CLI invocation. The observed route changes are consistent with a restored/reused context receiving stale state or queued navigation activity. This report does **not** assert the precise internal cause (restore state race vs. orphaned browser commands) without an agent-browser internal trace.

## Application, authentication, and network diagnostics

- The observed document requests returned HTTP 200; there was no 3xx redirect chain or failed document request in the captured network log.
- No Supabase authentication-refresh failure, login redirect, or authorization error was observed.
- The console contained development HMR/React DevTools messages and one React hydration mismatch on API Sandbox input IDs. That hydration warning is separate from, and does not establish the cause of, the cross-route navigations.
- The network log loaded route-specific Next.js chunks for Profile, Settings, and API Sandbox, confirming that those pages actually loaded; it did not show an application-side redirect response.

## Assessment

| Area | Assessment |
| --- | --- |
| agent-browser session behavior | Unstable reused context; one tab, but its location changes unexpectedly |
| `--restore` | Contributes materially because each command loads/saves restored state |
| browser context reuse | Present (`reused: true`) and implicated |
| Next.js client routing | Pages load successfully, but no evidence of an app-initiated redirect |
| Next.js middleware | No redirect evidence |
| Supabase auth | No auth failure or redirect evidence |
| stale refs | Not causal; snapshots were freshly captured after navigation |
| multiple tabs | Ruled out by the tab listings (one tab) |

## Recommended fix

Do not resume the UI audit in this session. First reset the **agent-browser session/restore state** outside the audit flow: close the `uae-admin` browser session, ensure no prior agent-browser automation process remains active, then establish a clean authenticated restore state once. For the subsequent audit, use one persistent browser connection/command stream rather than independently invoking `--restore` for every navigation/read command. Validate each navigation by checking both URL and a fresh expected-page heading before collecting evidence.

Do not change the application routing or authentication implementation based on this diagnostic alone.
