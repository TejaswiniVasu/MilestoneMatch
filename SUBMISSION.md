# MilestoneMatch submission draft

**Live demo:** https://milestone-match.onrender.com/

**Source branch:** https://github.com/TejaswiniVasu/MilestoneMatch/tree/improve-evidence-review

The entrant verified the hosted Sandbox checkout and downloaded record on
November 10, 2026: USD 240.00 captured for design and staging, USD 60 unpaid.
The free service may take about a minute to wake; start a fresh review after a
restart. Analytics and timeline integrations require the local setup and their
documented licensing conditions; do not assume they are available on the host.

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
8.0.0 (evaluation), with esbuild-generated browser bundles.

**How AG Studio is used**
The current review drives a themed analytics dashboard. A custom evidence-summary
widget queries Studio's engine; a status filter updates it alongside the bar chart
and decision grid. Selected and captured amounts remain distinct. Reviewers can
customize and reset the layout. This uses local evaluation mode unless a trial or
commercial license is configured. Studio's agent framework is not integrated.

**How Bryntum is used**
Gantt shows planned dates and payment states for the current review's
milestones. Users can drag/resize uncaptured items, display scope-order dependency
links, and see captured milestones become read-only. Dates are illustrative until
edited and reset on reload/checkout redirects. The planner does not automatically
reschedule dependent tasks, authorize payment, or change approval decisions. This
uses an evaluation license via BRYNTUM_LICENSE_KEY for hosted access. Vendor
trial notices remain intact; hosted key validation still needs confirmation.

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

## Demo outline, approximately 2 minutes 40 seconds

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:15 | Open the app with the sample project ready. | “You get a delivery update on a $300 freelance project. Some work is ready, and some is still pending. How much should you pay today?” |
| 0:15–0:38 | Run the review. Point to the two quoted source lines. | “MilestoneMatch compares the delivery update with the agreed scope. Here’s the text behind each suggested match, so I can check the model’s work.” |
| 0:38–1:00 | Open a decision reason. Draft the payment proposal, show the clarification draft, then apply after inspecting the evidence. | “The assistant proposes $240 within my limit and asks for evidence on the other $60. I inspect the work and choose what to approve.” |
| 1:00–1:45 | Open actual PayPal Sandbox checkout. Show amount, approve with a test buyer, return and capture. | “The server creates a PayPal Sandbox order for the selected lines. PayPal shows the same $240, and the app validates the capture against this review.” |
| 1:45–2:05 | Show confirmed receipt and downloaded record. | “This record connects the capture to my accepted items, original evidence and review events.” |
| 2:05–2:25 | Load the quantity or conflicting-claim scenario and run the review. | “A reported delivery is not proof of completion. Missing requirements and conflicting claims stay blocked for clarification.” |
| 2:25–2:40 | Return to a screenshot of the completed flow. | “AI helps review delivery claims, a person makes the acceptance decision, and PayPal handles the approved payment.” |

Record a completed test capture before using this script. Prepare a sandbox buyer session so credentials stay off camera. Use an original voiceover and clean screen capture. Upload the final video publicly to YouTube and confirm it opens while signed out.

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
- AG Studio and Bryntum have working local integrations, and APIMatic context was
  used for the SDK migration. Channel3, Render Workflows and Studio's
  agent framework remain pending. Do not claim roadmap features as implemented.
  See [AWARDS.md](AWARDS.md) for the exact status and licensing prerequisites.
- Real user feedback, a recorded video and
  final Devpost submission remain outstanding.

[Official rules](https://paypalaihackathon.devpost.com/rules) · [Schedule](https://paypalaihackathon.devpost.com/details/dates)
