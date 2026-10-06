# Dashboard API outage and recovery — 4 October 2026

## Genuine outage captured

The developer stopped the local API server after the existing System Administrator session reached Dashboard. Vite remained running. The assistant navigated inside the application to Users and back to Dashboard, causing a fresh Dashboard request without refreshing the browser/session or intercepting any response.

The resulting page displayed `Unable to load the Dashboard. Please retry.` with an enabled Retry button. Read-only DOM inspection confirmed the failure panel uses `role=alert`, viewport 614 × 507, and no page-level horizontal overflow. No Ticket/user mutation or database reset was performed.

[Full original outage screenshot](evidence/main/dashboard-api-unavailable-live.jpg) was captured, opened for inspection and retained uncropped/unstretched. This is the operational Dashboard rendered for an Administrator session, not a Requester failure image, an IT Staff login image or an authorization-denial screenshot.

## Recovery verified

The developer restarted the local API. The assistant confirmed the same tab/session was still displaying the failure and activated its Retry button without refreshing the page, signing in again or navigating away. Dashboard recovered to actual populated metrics: 17 unassigned, 0 owned by me, 8 urgent, 0 waiting; zero Actions recorded by this Administrator and five recent operational Tickets, including fixture TT-2026-000021 still OPEN. These are observed UI counts, not new independent database aggregates.

[Full original recovered Dashboard screenshot](evidence/main/dashboard-api-retry-recovered-live.jpg) was captured and opened for visual inspection, uncropped/unstretched. Read-only DOM inspection confirmed zero alert elements and no page-level horizontal overflow at the same 614 × 507 viewport. The API remains running and the browser was left on the recovered Dashboard.

This proves the real local failure → Retry → successful recovery sequence. No Ticket/user mutation or database reset occurred in this sequence. It does not prove slow-network loading, wholly empty Dashboard, forbidden access, Requester failure, production outage handling or complete final submission compliance. Those items and final PDF assembly remain separate.
