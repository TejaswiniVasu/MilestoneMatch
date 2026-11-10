# MilestoneMatch

An evidence review and PayPal Sandbox checkout desk for freelance web projects. Paste the agreed scope and a delivery update. A local model links reported work to individual scope items and surfaces missing, pending, or ambiguous evidence. A reviewer selects the items they accept, then checks out for that exact amount.

## Try it in two minutes

Install **Node.js 22.9 or newer**. Extract this project and open a terminal in the folder that contains `package.json`.

```sh
node --version
npm start
```

Open **http://127.0.0.1:3000**. The server binds to that address. The AI review works immediately without credentials, package installation, or network access.

1. Click **Load example**, then **Match delivery evidence**.
2. The $300 example has $150 in design work and a $90 staging deployment with matching delivery claims. Mobile testing ($40) has no evidence. The handoff archive ($20) is reported as pending.
3. Review the quoted update lines and select the first two items. The totals should show **$240 approved** and **$60 unpaid**. Deselect either line to see the amount change.

## Run a real PayPal Sandbox checkout

1. Sign in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/). In **Apps & Credentials**, select **Sandbox**, then use a sandbox REST app associated with a **business** sandbox account. Create one if needed.
2. Copy `.env.example` to `.env` and add the sandbox app's client ID and secret to `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`. Keep the credentials in this local file. Git ignores it.
3. Under **Testing Tools → Sandbox Accounts**, open a separate **personal** sandbox test account and retrieve its test login. PayPal's [sandbox account guide](https://developer.paypal.com/sandbox-testing/accounts) shows where to find these accounts. Judges can use their own free test accounts and credentials.
4. Restart the server with `npm start`. Open the printed address and rerun the example. Select the two reported deliveries and click **Continue to PayPal Sandbox**.
5. In the PayPal checkout page, sign in as the **personal sandbox buyer** and approve the $240 order. Keep the same tab open. On return, click **Capture sandbox payment**.
6. Verify **Payment captured · USD 240.00**, then download the payment record. It includes the review ID, approved and unpaid scope lines, original evidence, and the order and capture IDs.

If the approval page says the checkout has expired, start a fresh review. If the app shows a pending capture, use **Check payment status**. Run the app on a machine that can reach PayPal Sandbox over HTTPS. PayPal processes sandbox transactions using test funds.

## How the two integrations work

| Component | Role |
| --- | --- |
| Local machine learning | Supervised, example-based text classification. The model learns feature weights from 48 labeled synthetic phrases across 12 web-project deliverable categories. Whole words and character trigrams help it recognize phrasing changes. It abstains on weak or ambiguous matches. |
| Evidence rules | Show the original update text beside each scope line. Detect common pending and negation phrases and flag shared categories that cannot be uniquely allocated. A person reviews and selects the lines to pay. |
| PayPal Sandbox | Server-side REST OAuth and Orders v2 create/capture. The server calculates the amount from approved scope lines in integer cents and uses distinct idempotency keys for create and capture. It checks the returned currency, total, and review reference before showing a receipt. |
| UI | Browser-based JavaScript, HTML, and CSS. Checkout state stays in the same tab across the approval redirect. The download pairs the resulting receipt with the selection and source evidence. |

## Validate

```sh
npm test
```

The tests cover 12 held-out synthetic paraphrases, two out-of-domain examples, conflicting reports, the approved/unpaid split, same-origin handling, duplicate order and capture requests, a rejected pre-approval capture, and a receipt amount mismatch. The PayPal request tests use an injected HTTP fixture. Follow the Sandbox steps above to validate the external service.

This prototype targets English-language updates for small web projects. A category match is a reported claim and may miss task-specific details. Use a line per deliverable and verify the underlying artifacts yourself. Reviews live in server memory for up to eight hours. Each review has one checkout selection. The app is designed for local sandbox testing with USD test payments.

References: [PayPal Orders v2](https://developer.paypal.com/api/orders/v2), [buyer approval flow](https://developer.paypal.com/whats-an-order/), and [REST authentication](https://developer.paypal.com/api/rest/authentication/).
