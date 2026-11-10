# APIMatic Context Plugin usage

## What was actually used

The hackathon's [APIMatic sponsor page](https://paypalaihackathon.devpost.com/details/apimatic)
links a getting-started PDF that names the
[PayPal Server SDK Context Plugin preview](https://github.com/paypaldev/server-sdk-context-plugin-preview).
The development session retrieved that repository and directly consulted its
TypeScript skills while migrating `paypal.mjs` to `@paypal/paypal-server-sdk@2.5.0`.
The skills were read as development context, not copied into this app or presented
as a runtime AI feature. No editor-wide plugin installation was performed.

Source revision: `6aa057126f0d4709a42e15002aab832a94935d92`.

The source is labeled an experimental hackathon preview. The runtime dependency
is the separately published, pinned PayPal Server SDK, not this reference clone.
This evidence documents usage; award eligibility remains the organizers' decision.

## Context consulted

Under the source repository's `skills/typescript/` directory:

- `typescript-getting-started/SKILL.md`: package/version, source grounding and workflow.
- `typescript-client-initialization/SKILL.md`: client reuse and controller construction.
- `typescript-authentication/SKILL.md`: credential object, token lifecycle and failed-token recovery.
- `typescript-calling-endpoints/SKILL.md`: operation options, response wrappers and cancellation.
- `typescript-models/SKILL.md`: request member names, enum values and response schemas.
- `typescript-error-handling/SKILL.md`: typed errors, wire-shaped error payloads and safe translation.
- `typescript-configuration-resilience/SKILL.md`: explicit timeouts, retry defaults and silent logging.
- `typescript-testing/SKILL.md`: SDK transport fixtures without replacing auth or serialization.

The exact installed SDK's `src/` was also read for configuration, controller
signatures, payload schemas, enums, token requirements, base URLs and error classes.
No SDK source was modified or vendored into the project.

## Resulting implementation

- Explicit Sandbox environment, process-reused SDK controller and server-only credentials.
- SDK-managed OAuth caching/refresh with a 60-second clock skew.
- Explicit 12-second per-request timeout and resource-call cancellation. This is
  not advertised as a hard total deadline across OAuth and every network phase.
- Automatic SDK retries disabled. User retries reuse the server's distinct
  create/capture idempotency keys.
- SDK model serialization for create/capture, and model deserialization for receipts.
- Friendly credential, seller-currency, declined-instrument and rate-limit errors;
  raw error bodies, credentials and debug identifiers are not shown in the UI.
- Recovery via GET when PayPal reports an order already captured. Pending-status
  checks use GET rather than sending a second capture.
- OAuth/transport failures rebuild the affected client so a rejected cached token
  promise does not permanently prevent a later user retry.
- Existing exact amount/currency/review checks retained and tightened to reject
  unexpected extra purchase units or captures. Redirects require an exact Sandbox
  origin and cannot contain embedded credentials.

## Verification and remaining work

`npm test` runs the actual SDK against injected transport responses, including
OAuth, serialized request headers/body, provider errors, recovery, idempotency,
receipt validation and a canonical exported payment record. A browser fixture
also exercised order creation, intercepted buyer approval, capture, export and
reload through this SDK-backed implementation without contacting PayPal.

The SDK's `unstable_httpClientOptions` adapter is used only by fixtures. Production
uses the SDK's normal HTTP transport. A fresh **real Sandbox** checkout is still
required after installing this version, using the entrant's own private credentials.

To install the same development context into a supported personal editor, the
sponsor guide gives:

```sh
npx context-plugins install https://github.com/paypaldev/server-sdk-context-plugin-preview
```

Follow the installer's current prompts for your editor. This is optional for
running MilestoneMatch; the runtime does not need that editor plugin installed.
