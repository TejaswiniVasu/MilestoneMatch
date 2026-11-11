# MilestoneMatch

An evidence review and PayPal Sandbox checkout desk for freelance web projects. Paste the agreed scope and a delivery update. A local model links reported work to individual scope items and surfaces missing, pending, or ambiguous evidence. A reviewer selects the items they accept, then checks out for that exact amount.

## Try it in two minutes

Install **Node.js 22.9 or newer**. Extract this project and open a terminal in the folder that contains `package.json`.

```sh
node --version
npm ci
npm start
```

Open **http://127.0.0.1:3000**. The server binds to that address. `npm ci` installs
the pinned dependencies once; `npm start` builds the local analytics bundle before
starting the app. After installation, the review and dashboard work without
PayPal credentials or an external AI service.

1. Click **Load example**, then **Match delivery evidence**.
2. The $300 example has $150 in design work and a $90 staging deployment with matching delivery claims. Mobile testing ($40) has no evidence. The handoff archive ($20) is reported as pending.
3. Review the quoted update lines and select the first two items. The totals should show **$240 approved** and **$60 unpaid**. Deselect either line to see the amount change.

### Explain, propose, clarify

Open **Why this decision?** to see reasons, source update identifiers, and the
next action. In **Review assistant**, set a maximum payment and click **Draft
payment proposal**. The server proposes eligible whole items in scope order
within that limit. Applying a proposal only changes the checkbox selection;
checkout and PayPal buyer approval remain separate actions. Blocked items produce
a clarification draft you can copy and send yourself.

The scenario picker includes conflicting claims, missing acceptance evidence,
ambiguous allocation, and approval instructions embedded in delivery text.
All scenarios are synthetic and can be reviewed without credentials.

### AG Studio analytics

After running a review, click **Open analytics**. AG Studio 3.1 displays a custom
evidence summary, a status filter, a bar chart and a milestone decision grid,
all backed by the current review. The summary queries Studio's data engine, so
filtering the status updates it along with the chart and grid. Changes to the
payment selection and confirmed capture update the data source.

**Selected** is not **captured**: selected amounts remain unpaid until the capture
is completed. The dashboard's unpaid field means the full amount not yet captured;
the payment desk's unpaid total means the part outside the current selection.

**Customize layout** enables Studio's edit mode and panels. You can rearrange,
resize, duplicate and configure widgets. **Reset layout** restores the original
dashboard. Report settings are saved in this browser tab's session storage;
the dashboard does not collect a shared portfolio of other users' reviews.
It has no AI chat or Studio Agent Framework integration yet.

AG Studio is a **commercial dependency**, separate from this project's MIT code.
[Official licensing guidance](https://www.ag-grid.com/studio/javascript/licence-install/)
allows local evaluation without a key, with a watermark and console warnings.
For hosted testing or publication, obtain a trial/commercial license covering
the application and judging period and configure `AG_STUDIO_LICENSE_KEY` privately.
Hosted analytics stays disabled until a key is configured. The license is used by
the browser library as documented; it is not a server-only API secret. This app
does not suppress licensing warnings or remove watermarks.

The analytics bundle is generated from the npm dependency and is not committed.
Scripts remain restricted to this origin. Studio style elements receive a nonce;
a short list of exact pinned vendor stylesheet hashes covers styles for which
Studio/Charts do not propagate the nonce. Inline style attributes support the
library's positioning. No external script CDN is required.

## Bryntum delivery planning

After a review, **Open timeline** loads Bryntum Gantt Enterprise 8.0.0. The integration module is TypeScript
(`studio/timeline.ts`), built with esbuild; `npm run typecheck` checks its types.
The timeline shows each scope item, its amount, payment state, and planned dates.
Dates begin as an illustrative schedule, not dates extracted from the agreement.
Choose a start date and days per milestone, then **Apply planning dates**.

Drag or resize uncaptured milestone bars to adjust the plan. **Fit milestones**
brings all items into view. Optional scope-order links display dependencies and
highlight when a preceding milestone remains unpaid. These are visual planning
links, not automatic rescheduling or enforceable contract/payment restrictions.
Changing a plan never changes the checkout selection, approves work, creates an
order, or captures a payment. Captured milestones become read-only. Updating a
payment selection preserves dragged dates while the page remains open.

Planning dates are temporary: reloads and checkout redirects reset them. They are
not included in the canonical payment record. Tasks are manually scheduled: links
are visual planning order, not automatic dependency rescheduling.

Gantt Enterprise runs a fully functional 14-day trial without a key. A registered
trial key provides 45 days, subject to Bryntum's evaluation terms. Set
`BRYNTUM_LICENSE_KEY` privately in Render's Environment or in the local `.env`;
the app passes this browser-visible vendor license to `bryntum.licenseKey` once
before creating Gantt. Hosted timeline access requires this setting. Do not commit
keys. If a key does not cover Gantt Enterprise, the vendor may mask the component;
obtain the correct key instead of suppressing the notice. No real key is bundled.
Generated vendor bundles, themes and fonts are not committed to this MIT repository.

Potential next Enterprise features: **critical paths** to identify schedule drivers,
**baselines** to compare a revised plan, and **task editing** for richer planning.
These are not implemented or claimed by this demo. For richer development guidance,
install the [Bryntum AI Agent skills](https://github.com/bryntum/skills) and
[Bryntum MCP Server](https://mcp.bryntum.com). See the
[Gantt docs](https://bryntum.com/products/gantt-next/docs/?utm_source=ax).

[Official sponsor trial guidance](https://paypalaihackathon.devpost.com/details/bryntum)

## Channel3 project supplies

After running a review, use **Project supplies** to find delivery/testing equipment
within a separate per-item budget. The server uses `@channel3/sdk` 4.9.0 to search
US offers in USD, then retrieves each product again before displaying refreshed
prices, availability and merchant links. Results are not cached. Over-budget,
out-of-stock, non-USD and unsafe offer links are excluded. Unknown availability
is labeled explicitly. The UI does not buy products or add their cost to approved
milestones; retailer links lead to real shops and may be affiliate-tracked.

Set `CHANNEL3_API_KEY` in the local ignored `.env` or Render's Environment, then
restart/deploy. This key is server-only and never returned by `/api/config`.
Missing configuration disables only supply search. The demo limits searches to
30 per hour per running instance, with one search in progress; restarts reset
that counter. No automatic SDK retries or catalog auto-pagination are enabled.
Prices exclude unspecified shipping/taxes and may change at the merchant.

The [Channel3 API skill](https://github.com/channel3-ai/skills/tree/main/skills/channel3-api)
was installed with `npx skills add channel3-ai/skills --skill channel3-api`.
The ignored local skill files guide server-side auth, SDK search, product refresh
and affiliate-link handling. Install them again in another development checkout
for the same guidance. A live API smoke test on November 11, 2026 returned six
microphone products with refreshed offers within a USD 75 per-item limit; hosted
search was subsequently verified with six live results and unchanged milestone totals.

## Run a real PayPal Sandbox checkout

1. Sign in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/). In **Apps & Credentials**, select **Sandbox**, then use a sandbox REST app associated with a **business** sandbox account. Create one if needed.
2. Copy `.env.example` to `.env` and add the sandbox app's client ID and secret to `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`. Keep the credentials in this local file. Git ignores it.
3. Under **Testing Tools → Sandbox Accounts**, open a separate **personal** sandbox test account and retrieve its test login. PayPal's [sandbox account guide](https://developer.paypal.com/sandbox-testing/accounts) shows where to find these accounts. Judges can use their own free test accounts and credentials.
4. Restart the server with `npm start`. Open the printed address and rerun the example. Select the two reported deliveries and click **Continue to PayPal Sandbox**.
5. In the PayPal checkout page, sign in as the **personal sandbox buyer** and approve the $240 order. Keep the same tab open. On return, click **Capture sandbox payment**.
6. Verify **Payment captured · USD 240.00**, then download the payment record. It includes the review ID, approved and unpaid scope lines, original evidence, and the order and capture IDs.

If the approval page says the checkout has expired, start a fresh review. If the app shows a pending capture, use **Check payment status**. Run the app on a machine that can reach PayPal Sandbox over HTTPS. PayPal processes sandbox transactions using test funds.

For the USD demo, use separate **US Business seller** and **US Personal buyer**
Sandbox accounts. If checkout reports an unsupported seller currency, check the
test accounts' regions and receiving settings. Credentials must belong to the
intended Sandbox seller. Your real PayPal login opens the Developer Dashboard;
generated Sandbox buyer credentials sign in at test checkout.

The payment download comes from the server's captured review, rather than the
browser selection. It includes original input, a SHA-256 source fingerprint,
model version, reasons, totals, and order/capture events. The fingerprint is
reproducible, **not a digital signature or independent proof of delivery**.

## How the two integrations work

| Component | Role |
| --- | --- |
| Local machine learning | Supervised, example-based text classification. The model learns feature weights from 48 labeled synthetic phrases across 12 web-project deliverable categories. Whole words and character trigrams help it recognize phrasing changes. It abstains on weak or ambiguous matches. |
| Evidence rules | Show the original update text beside each scope line. Detect common pending and negation phrases and flag shared categories that cannot be uniquely allocated. A person reviews and selects the lines to pay. |
| PayPal Sandbox | PayPal Server SDK 2.5 handles OAuth and Orders v2 create/capture/status reads. The server calculates approved amounts in integer cents, uses distinct idempotency keys, and validates receipt currency, amount and review reference. |
| UI | Browser-based JavaScript, HTML, and CSS. Checkout state stays in the same tab across the approval redirect. The download pairs the resulting receipt with the selection and source evidence. |

## Validate

```sh
npm test
npm run evaluate
```

The tests cover 12 held-out synthetic paraphrases, two out-of-domain examples, conflicting reports, the approved/unpaid split, same-origin handling, duplicate order and capture requests, a rejected pre-approval capture, and a receipt amount mismatch. The PayPal request tests use an injected HTTP fixture. Follow the Sandbox steps above to validate the external service.

The PayPal adapter now uses the APIMatic-generated `@paypal/paypal-server-sdk`
at pinned version 2.5.0. Credentials still use the same `.env` names; no new
account is required. SDK fixtures exercise actual OAuth, serialization and response
parsing. Additional cases cover failed-token recovery, seller currency errors,
declines, rate limiting, already-captured recovery and pending status checks.
Automatic SDK retries and request/response logging are disabled. See
[APIMATIC.md](APIMATIC.md) for the sponsor Context Plugin source and actual usage.
Repeat the real Sandbox checkout after updating this payment integration.

The evaluation runs 23 synthetic regression cases: negation, partial quantities,
required devices/screenshots, conflicting claims, payment instructions, and
unsupported work. It is **not a real-world accuracy estimate**. Category matching
now requires topical whole-word support. Rules compare numeric tokens and selected
named requirements (screenshots, Android, iPhone, Lighthouse); they do not inspect
artifacts or understand every acceptance criterion. Conservative rules can block
valid claims, including dates or conditional language.

## Hosted demo

`render.yaml` configures a single Render service with `/health`. Its build command
creates the dashboard bundles and runs checks; its runtime command launches
`node server.mjs` directly so the free 512 MB instance does not rebuild bundles
through the local `npm start` prestart hook. The public demo is [milestone-match.onrender.com](https://milestone-match.onrender.com/).
On November 10, 2026, the entrant completed a hosted USD 240.00 Sandbox
capture and supplied its downloaded record: USD 150 design and USD 90 staging
approved, with USD 60 remaining unpaid. Set fresh Sandbox credentials privately in Render's environment
settings. Render supplies `RENDER_EXTERNAL_URL` for callbacks and origin checks.
For another host, set `HOST=0.0.0.0`, `PORT`, and `APP_ORIGIN` to the exact public
HTTPS origin without a path. Do not derive it from incoming request headers.
Re-run Sandbox checkout on the deployed origin before sharing the demo.

This is a synthetic-data Sandbox demo without production accounts or durable
storage. Reviews expire after eight hours or any restart; use one instance.
A sleeping/free host can lose an in-flight review. Do not use real client data.
Render Workflows readiness reporting is implemented with three checkpointed steps;
a real hosted run succeeded on November 11, 2026, suggesting USD 240 and
withholding USD 60 while leaving approvals unchanged. See [RENDER.md](RENDER.md) for setup, usage limits and verification. Channel3 supply search is integrated; its
server API key must be configured separately on each host. The APIMatic Context Plugin
was consulted during SDK integration; it is development context, not a runtime
agent service or an editor-wide installation.
See [AWARDS.md](AWARDS.md) for readiness and the account checklist.

This prototype targets English-language updates for small web projects. A category match is a reported claim and may miss task-specific details. Use a line per deliverable and verify the underlying artifacts yourself. Reviews live in server memory for up to eight hours. Each review has one checkout selection. The app is designed for local sandbox testing with USD test payments.

References: [PayPal Orders v2](https://developer.paypal.com/api/orders/v2), [buyer approval flow](https://developer.paypal.com/whats-an-order/), and [REST authentication](https://developer.paypal.com/api/rest/authentication/).

## Demo recording and submission

See [DEMO.md](DEMO.md) for the recording outline and [SUBMISSION.md](SUBMISSION.md)
for the project description and final checklist. This project uses its local
classifier and rules; it does not require OpenAI or an OpenAI API key.

## Appearance

Use the header theme selector for **Light**, **Dark**, or **System** (default).
The choice is saved in this browser and follows OS changes when System is selected.
Analytics and Gantt update with the workspace without resetting approvals or dates.
Theme preference also syncs across tabs; unavailable browser storage falls back to
a working System preference for the current session.
