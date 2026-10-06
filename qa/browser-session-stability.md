# Browser Session Stability Test

## Result: STABLE

Tested in one persistent `uae-admin` browser session. No command in this sequence included the `--restore` option. The tab was neither closed nor reopened between routes, and each navigation used a fresh post-navigation snapshot.

| Test | Expected Route | Actual Route | Expected Page | Actual Page | URL Correct | Rendered Content Correct | Unexpected Navigation | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | `/en/admin` | `/en/admin` | Affiliate intelligence dashboard | “Affiliate intelligence, at a glance.” | Yes | Yes | No | PASS |
| Products | `/en/admin/products` | `/en/admin/products` | Products registry | “Products Registry” | Yes | Yes | No | PASS |
| Settings | `/en/admin/settings` | `/en/admin/settings` | Platform settings | “Platform Settings” | Yes | Yes | No | PASS |
| API Sandbox | `/en/admin/api-sandbox` | `/en/admin/api-sandbox` | API tester | “API Integration Tester” | Yes | Yes | No | PASS |

## Procedure

1. Used the existing `uae-admin` session without `--restore` on individual commands.
2. Verified there was one active browser tab before the sequence.
3. Cleared diagnostics, explicitly opened Dashboard, waited 1.5 seconds, then captured URL, title, a fresh AX snapshot, screenshot, and network state.
4. Repeated the same serial procedure for Products, Settings, and API Sandbox.

Screenshots captured:

- `qa/browser-stability-dashboard.png`
- `qa/browser-stability-products.png`
- `qa/browser-stability-settings.png`
- `qa/browser-stability-api-sandbox.png`

## Diagnostics

- A single tab (`t1`) remained active throughout; its final route was `/en/admin/api-sandbox`.
- Document requests occurred only for the four explicit routes, all returning HTTP 200.
- There were no unexpected document loads, redirects, or authentication failures during this sequence.
- Titles were consistent (`UAEDISCOUNTHUB - Best Tech Deals in UAE & GCC`); route-specific headings supplied the reliable page identity.

## Important caveat

Although the commands did not include `--restore`, agent-browser still printed `restore: loaded; save: saved` and lifecycle metadata reported `restoreStatus: "loaded"`. That indicates restore is sticky in the already-running session or its environment/configuration. It did not cause a navigation failure in this serial, single-session test.

## QA runtime guidance

Use this stable pattern for subsequent work: one `--session uae-admin` context, strictly serial navigation, a settle wait, then a fresh URL and expected-heading check before capture. Do not pass `--restore` on each individual operation and do not run competing browser scripts against this session.
