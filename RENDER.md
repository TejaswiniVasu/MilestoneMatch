# Render Workflows readiness report

The main app is hosted at https://milestone-match.onrender.com/. Its Sandbox
checkout/export, AG Studio evaluation and Gantt evaluation were verified; hosted
Channel3 search returned six refreshed offers on November 11, 2026.

## What the workflow does

`workflows/review.ts` registers `reviewReadiness` with Render SDK 1.8.0. A flow
checkpoints three pure steps: evidence matching, readiness totals, and a bounded
whole-item proposal/clarification draft. It uses the same local classifier/rules
as normal review. Render can reuse finished step results on infrastructure replay.
This does not inspect artifacts, run an autonomous commerce agent, approve items,
create orders, or capture payments. It needs no PayPal or Channel3 credentials.

The app starts one run per review, using `readiness-<review UUID>` as its
idempotency key. The browser polls status and can resume checking the same run.
Only a report matching the web server's canonical calculation is displayed. The
workflow and web app must use matching code. A paused flow remains pending for
user/operator investigation. There is no fallback that pretends local execution
is a successful remote run.

The public demo caps submissions at ten per hour per running web instance.
Repeated clicks reuse a run; status is polled no faster than once per 1.8 seconds
per review. All controls reset when the web process restarts. Render's step/run
history persists separately, but this app does not recover review-to-run mappings
after a restart. Reviews and planning remain temporary. Inputs and outputs are
stored in Render's run history: use synthetic data only.

## Deploy and connect

1. Claim the sponsor credits from the official hackathon Render page. Confirm the
   credit balance in your Render workspace. Runs consume compute and retention
   credits; usage can be billed after credits are exhausted.
2. Sync the existing Blueprint on `improve-evidence-review`. It adds a Node
   workflow named **milestone-match-reviews** in Oregon. Its build command installs
   dependencies, checks types, builds the small worker and runs tests. Its start
   command is `npm run start:workflow`; no dashboard bundling happens at runtime.
3. Open that workflow's **Definitions** page after deployment. Select
   **reviewReadiness** and copy its full flow slug (workflow slug plus flow name).
4. Create a Render API key in your personal account settings. Keep it private;
   do not paste it into chat or commit it. Set these variables on the existing
   **milestone-match web service**, not on the workflow:

   ```text
   RENDER_API_KEY=<your Render API key>
   RENDER_REVIEW_FLOW_SLUG=<the copied full flow slug>
   ```

5. Save and deploy the web service. Reload the public app, run a fresh sample
   review, and click **Run background report**. Confirm `succeeded` with a run ID,
   four milestones, two blocked items, USD 60 withheld, and a USD 240 proposal.
   Approved now should remain USD 0 unless you explicitly selected items.
6. Open that run in Render and inspect the three checkpointed steps. Save a
   screenshot of the successful run for submission evidence without credentials.

No Render credentials were provisioned in this development environment. The
hosted web service was configured privately by the entrant. On November 11, 2026,
a real hosted flow run succeeded with four milestones, two blocked items, USD 60
withheld and a USD 240 proposal; approvals remained USD 0. The run ID was
`frn-0b94gdbq35rrat3og00ck0c0g`. The function and SDK adapter also have automated
tests, and UI transitions were checked with a fixture before deployment.

## Local checks

`npm test` first builds the worker, then exercises its real registered function
with a local step context, SDK dispatch/status, duplicate submissions, mismatched
results, and payment isolation. `npm run typecheck` checks both TypeScript modules.
Generated worker output is ignored. For full local execution against Render's
runtime, follow the official local-development guide and Render CLI setup.

Sources consulted November 11, 2026:

- https://render.com/docs/workflows-tutorial
- https://render.com/docs/workflows-defining-flows
- https://render.com/docs/workflows-sdk-typescript
- https://render.com/docs/workflows-local-development
- https://paypalaihackathon.devpost.com/details/render
