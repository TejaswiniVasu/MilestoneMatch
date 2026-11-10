# MilestoneMatch: award readiness

This is an implementation and evidence checklist, not a prediction of winning.
Overall placements and sponsor placements are ranked alternatives. Mentioning a
sponsor or adding a dependency is not evidence of a competitive integration.

## Verified capability

- Local supervised matching with conservative evidence rules and explanations.
- Bounded whole-item payment proposals; a human must inspect and apply selections.
- Clarification drafts for blocked work; nothing is sent to anyone.
- Server-side PayPal totals, idempotent create/capture, and receipt validation.
- Server-built export with original input, source fingerprint, decisions, and events.
- Five synthetic demo scenarios; 23 synthetic evidence regression cases.
- AG Studio dashboard with current-review data, a custom query-backed summary,
  filter-linked chart and grid, themed layout, editing/reset and mobile stacking.
  Local evaluation only without a key; no Studio agent integration yet.
- Bryntum Scheduler local trial: draggable planned dates, scope-order dependency
  links, live payment states, and captured-item date locking. Dates are temporary;
  there is no automatic dependency rescheduling or payment execution.
- Previous Windows version: owner reported a completed USD 240 Sandbox capture.
  Updated version: automated PayPal fixtures; repeat the real Sandbox capture
  after updating before filming it.

## Award-by-award work

| Award | Evidence available | Remaining work |
| --- | --- | --- |
| Overall placements | Complete review-to-checkout workflow | Record updated flow, get actual user feedback, sharpen differentiation, finish submission |
| Most Creative | Evidence-to-payment explanations and clarification drafts | Compare with existing milestone/invoicing products; demonstrate a specific advantage |
| Most Impactful | Specific freelance/client use case | Recruit volunteer testers; document observed feedback without inventing savings |
| Best Demo Delivery | Normal, conflicting, ambiguous, quantity, and instruction scenarios | Public video under three minutes, accurate captions, clean checkout recording |
| Best Use of PayPal + AI | Model output affects eligible items and server-calculated payment | Broader unseen evaluation and stronger model; demonstrate failures and abstention honestly |
| Best Use of Agentic Commerce | Bounded proposal helper with mandatory human approval | Model-directed tool loop with policy limits and execution trace; current helper is deterministic, not an autonomous commerce agent |
| Best Use of AG Grid | Local AG Studio dashboard with a custom summary, filtering, theming and layout editing | Obtain trial for hosting/judging; add and validate meaningful Studio Agent Framework behavior and richer agency data |
| Best Use of APIMatic | Sponsor-linked Context Plugin skills consulted for the PayPal Server SDK 2.5 migration and recovery/error handling; provenance recorded in APIMATIC.md | Hosted Sandbox checkout and record verified by entrant; retain evidence and confirm organizer eligibility; no editor-wide plugin installation is claimed |
| Best Use of Bryntum | Local Scheduler trial with editable planned dates, dependency links and capture-aware read-only items | Obtain appropriate licensing for hosted/judging use; add durable schedules and richer dependency handling; do not claim automatic rescheduling |
| Best Use of Channel3 | Not integrated | Obtain API key; implement useful agency procurement searches with actual source prices/availability, separate from service payment |
| Best Use of Render | Live Render web service with entrant-verified USD 240 Sandbox capture and record | Add/test meaningful Workflows orchestration for evidence jobs; hosting alone does not establish award eligibility |

## Entrant account setup

1. **AG Studio:** local evaluation is allowed without a key. Request the sponsor's
   trial for hosted testing; ensure licensing covers the judging period.
2. **Bryntum:** the sponsor lists a public npm trial, used for local evaluation.
   Review licensing and the judging-period requirements before hosted use.
   Do not commit proprietary distribution files into this MIT repository.
3. **Channel3:** create a developer account; store the key in private environment
   settings, never a chat, issue, PR, or public repository.
4. **Render:** connect GitHub and review plan/billing terms. Configuration alone
   is not proof of deployment or Workflows use.
5. **APIMatic:** the sponsor-linked context was used in development. An optional
   personal-editor installation follows its guide. See APIMATIC.md for the actual
   workflow; this is separate from the runtime AI feature.

## Final acceptance gates

- Fresh checkout works on Windows and Linux.
- Test cancellation, retries, unclear evidence and a real Sandbox capture of the
  exact displayed total after updating.
- Record the running app; keep credentials and unrelated details off camera.
- Include actual tool usage, license attribution and limitations in the submission.
- Seek feedback from freelancers/clients. Ask which items they would pay, whether
  explanations help, and what artifacts they still need to inspect. Report the
  actual sample size and findings, not assumed impact.
- Check repository visibility and license recognition. Upload video publicly to
  YouTube and add repository/video links to Devpost.

## Official sources checked November 10, 2026

- [Rubric and overview](https://paypalaihackathon.devpost.com/)
- [Rules](https://paypalaihackathon.devpost.com/rules)
- [AG Studio guidance and trial](https://paypalaihackathon.devpost.com/details/aggrid)
- [Local evaluation and license installation](https://www.ag-grid.com/studio/javascript/licence-install/)
- [APIMatic tooling](https://paypalaihackathon.devpost.com/details/apimatic)
- [Bryntum scheduling award](https://paypalaihackathon.devpost.com/details/bryntum)
- [Channel3: actual API use required](https://paypalaihackathon.devpost.com/details/channel3)
- [Render deployment and Workflows](https://paypalaihackathon.devpost.com/details/render)
