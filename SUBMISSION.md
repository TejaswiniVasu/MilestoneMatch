# MilestoneMatch submission draft

**Tagline**  
Turn a messy freelance delivery update into an evidence-backed partial payment.

**Project description**  
A client gets an update that says two items are ready, a third is coming next week, and a fourth goes unmentioned. The invoice still has one total. MilestoneMatch lets that client compare the update with the original scope and pay for the work they accept today.

Paste a priced scope and the delivery notes. A local text model maps the notes to the scope and quotes the language behind each suggested match. The review highlights missing and pending evidence. After the client explicitly selects what to approve, the server creates a PayPal Sandbox order for that amount. The client approves the order with a test buyer account, captures it on return, and downloads a record linking the sandbox receipt to the approved scope and quoted evidence.

The demo follows a $300 landing-page milestone. The client approves $240 in design and staging work. Mobile testing and source handoff account for the remaining $60, which stays unpaid in this checkout.

**Built with**  
Node.js, vanilla JavaScript, HTML, CSS, an in-process supervised text classifier, and PayPal REST OAuth plus Orders v2 in Sandbox.

**How AI is used**  
The model maps differently worded scope and update lines into supported deliverable categories using learned text feature weights. It can abstain. Rules flag pending language and ambiguous evidence, and the reviewer makes the acceptance decision.

**How PayPal is used**  
The server creates an order tied to the review and its approved total, redirects to PayPal Sandbox for buyer approval, and captures the test payment after the buyer returns. The resulting PayPal order and capture IDs appear in the payment record.

## Demo outline, approximately 2 minutes 20 seconds

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:15 | Open the app with the sample project ready. | “You get a delivery update on a $300 freelance project. Some work is ready, and some is still pending. How much should you pay today?” |
| 0:15–0:38 | Run the review. Point to the two quoted source lines. | “MilestoneMatch compares the delivery update with the agreed scope. Here’s the text behind each suggested match, so I can check the model’s work.” |
| 0:38–0:55 | Point to missing mobile evidence and pending archive. Select the first two items. | “I’ll approve the design and staging work. I still need mobile test results, and the archive is promised for next week. The checkout total is $240, with $60 still unpaid.” |
| 0:55–1:35 | Open actual PayPal Sandbox checkout. Show amount and approve with a test buyer. Return and capture. | “The server builds a PayPal Sandbox order for the approved lines. The buyer sees the same total in PayPal, approves it, and I capture the sandbox payment on return.” |
| 1:35–1:58 | Show confirmed receipt and downloaded record. | “The payment record connects this capture to the items I accepted and the evidence I reviewed. I can see what the $240 covered later.” |
| 1:58–2:20 | Show the ledger and final split. | “MilestoneMatch makes a delivery update actionable. The model finds the evidence, the client decides what to accept, and PayPal processes the approved payment.” |

Record a completed test capture before using this script. Prepare a sandbox buyer session so credentials stay off camera. Use an original voiceover and clean screen capture. Upload the final video publicly to YouTube and confirm it opens while signed out.

## Check before submitting

- [ ] Run the application from a fresh checkout and complete a real Sandbox purchase using a personal test buyer.
- [ ] Confirm the UI, PayPal approval page, receipt, and export all show $240.00 and that the two unapproved items remain unpaid.
- [ ] Try the sample with the archive described as finished and check that the review offers it for approval after rerunning the match.
- [ ] Publish a public GitHub repository with all source and setup instructions. Confirm GitHub recognizes the root MIT license and the public source contains no `.env` or credentials.
- [ ] Add the repository URL and public YouTube link to the existing Devpost draft.
- [ ] Review the description and the entrant's eligibility and originality attestations. Submit before **Friday, Nov 13, 2026 at 1:30 a.m. IST**.

The official judging rubric gives equal weight to implementation, design, impact, innovation, and presentation. Use the same real scenario in the interface, repository, and video. The most distinctive demonstration is the transition from a quoted delivery claim to a specific paid amount with a matching PayPal receipt.

[Official rules](https://paypalaihackathon.devpost.com/rules) · [Schedule](https://paypalaihackathon.devpost.com/details/dates)
