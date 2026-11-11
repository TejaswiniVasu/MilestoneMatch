# MilestoneMatch submission draft

**Live demo:** https://milestone-match.onrender.com/

**Source repository:** https://github.com/TejaswiniVasu/MilestoneMatch

The entrant verified the hosted Sandbox checkout and downloaded record on
November 10, 2026: USD 240.00 captured for design and staging, USD 60 unpaid.
The free service may take about a minute to wake; start a fresh review after a
restart. Hosted analytics and Gantt were verified with evaluation licenses;
Channel3 search and the Render readiness flow were also verified online.
The project does not use OpenAI or require an OpenAI API key.

**Tagline**  
Turn a messy freelance delivery update into an evidence-backed partial payment.

**Project description**  
A client gets an update that says two items are ready, a third is coming next week, and a fourth goes unmentioned. The invoice still has one total. MilestoneMatch lets that client compare the update with the original scope and pay for the work they accept today.

Paste a priced scope and the delivery notes. A local text model maps the notes to the scope and quotes the language behind each suggested match. The review highlights missing and pending evidence. After the client explicitly selects what to approve, the server creates a PayPal Sandbox order for that amount. The client approves the order with a test buyer account, captures it on return, and downloads a record linking the sandbox receipt to the approved scope and quoted evidence.

The demo follows a $300 landing-page milestone. The client approves $240 in design and staging work. Mobile testing and source handoff account for the remaining $60, which stays unpaid in this checkout.

The updated review explains why each item is offered or blocked. A bounded
assistant drafts a whole-item payment proposal within the client's chosen limit
and a clarification request for unresolved work. Applying the proposal is a
separate human action; it does not authorize or capture payment. Conflicting,
partial, unsupported and ambiguous claims stay blocked. The server-generated
record includes the original input, decision reasons, source fingerprint and
order/capture events.

**Built with**  
Node.js, vanilla JavaScript, HTML, CSS, an in-process supervised text classifier,
PayPal Server SDK 2.5 (APIMatic-generated) with Orders v2 in Sandbox, AG Studio 3.1, and Bryntum Gantt Enterprise
8.0.0 (evaluation), Channel3 SDK 4.9.0, with esbuild-generated browser bundles.

**How AG Studio is used**
The current review drives a themed analytics dashboard. A custom evidence-summary
widget queries Studio's engine; a status filter updates it alongside the bar chart
and decision grid. Selected and captured amounts remain distinct. Reviewers can
customize and reset the layout. The hosted dashboard uses a validated evaluation
license. Studio's agent framework is not integrated.

**How Bryntum is used**
Gantt shows planned dates and payment states for the current review's
milestones. Users can drag/resize uncaptured items, display scope-order dependency
links, and see captured milestones become read-only. Dates are illustrative until
edited and reset on reload/checkout redirects. The planner does not automatically
reschedule dependent tasks, authorize payment, or change approval decisions. This
uses an evaluation license via BRYNTUM_LICENSE_KEY for hosted access. Vendor
trial notices remain intact. Hosted key validation and task rendering were verified.

**How Channel3 is used**
A reviewer can research equipment for delivery/testing within a separate per-item
budget. Server-side SDK search is followed by fresh product retrieval. Results
show merchant prices, availability and affiliate retailer links. No retail
purchase is automated, and supply prices never alter the service payment. Live
API results and hosted search were verified; milestone payment totals stayed unchanged.

**How Render Workflows is used**
A readiness flow checkpoints evidence matching, blocked-work totals and a payment
proposal. The web app dispatches it once per review with an idempotency key,
shows run status, and checks the returned report against the current source.
Normal review remains available without workflow credentials. A hosted run
succeeded with four milestones, two blocked items, USD 60 withheld and a USD 240
proposal; approvals stayed at USD 0.
See [RENDER.md](RENDER.md). No payment runs inside the workflow.

**How AI is used**  
The model maps differently worded scope and update lines into supported deliverable categories using learned text feature weights. It can abstain. Rules flag pending language and ambiguous evidence, and the reviewer makes the acceptance decision.

**How PayPal is used**  
The server creates an order tied to the review and its approved total, redirects to PayPal Sandbox for buyer approval, and captures the test payment after the buyer returns. The resulting PayPal order and capture IDs appear in the payment record.

**How APIMatic context was used**
The sponsor-linked PayPal Server SDK Context Plugin's TypeScript skills were
consulted directly while migrating payment code to SDK 2.5.0. They informed client
configuration, auth recovery, model mapping, error handling and transport-level
tests. No editor-wide installation or runtime agent service is claimed. The
source revision and concrete changes are documented in [APIMATIC.md](APIMATIC.md).

## Demo recording

Use [DEMO.md](DEMO.md) for the current 2:50 recording outline, including the
hosted PayPal capture, analytics, Gantt, Channel3 and background report. Record
actual interactions, prepare a Sandbox buyer login off camera, and keep the final
public YouTube video under three minutes. Do not simulate a payment or label a
fixture as a live workflow.

## Check before submitting

- [ ] Run the application from a fresh checkout and complete a real Sandbox purchase using a personal test buyer.
- [x] Entrant confirmed the hosted receipt and export show USD 240.00 captured for the two approved items; USD 60.00 remains unpaid.
- [ ] Try the sample with the archive described as finished and check that the review offers it for approval after rerunning the match.
- [ ] Publish a public GitHub repository with all source and setup instructions. Confirm GitHub recognizes the root MIT license and the public source contains no `.env` or credentials.
- [ ] Add the repository URL and public YouTube link to the existing Devpost draft.
- [ ] Review the description and the entrant's eligibility and originality attestations. Submit before **Friday, Nov 13, 2026 at 1:30 a.m. IST**.

The official judging rubric gives equal weight to implementation, design, impact, innovation, and presentation. Use the same real scenario in the interface, repository, and video. The most distinctive demonstration is the transition from a quoted delivery claim to a specific paid amount with a matching PayPal receipt.

## Claims and remaining evidence

- The assistant uses the local classifier plus deterministic rules. Do not call
  it an autonomous commerce agent or claim artifact verification.
- `npm run evaluate` reports 23 synthetic regression cases; do not advertise that
  result as real-world AI accuracy.
- A SHA-256 source fingerprint is not a digital signature.
- AG Studio and Bryntum have verified hosted evaluation integrations, and APIMatic context was
  used for the SDK migration. Channel3 supply search is verified online. Render Workflows is implemented
  and verified online; Studio's agent framework is not integrated. Do not claim roadmap features as implemented.
  See [AWARDS.md](AWARDS.md) for the exact status and licensing prerequisites.
- Real user feedback, a recorded video and
  final Devpost submission remain outstanding.

[Official rules](https://paypalaihackathon.devpost.com/rules) · [Schedule](https://paypalaihackathon.devpost.com/details/dates)
