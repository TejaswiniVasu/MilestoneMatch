# Hackathon project and verification index

- **Public source:** https://github.com/TejaswiniVasu/MilestoneMatch (default branch: `main`)
- **Live Sandbox demo:** https://milestone-match.onrender.com/
- **Project description and submission checklist:** [SUBMISSION.md](SUBMISSION.md)
- **Recording outline:** [DEMO.md](DEMO.md)
- **Sponsor usage and remaining limitations:** [AWARDS.md](AWARDS.md)
- **APIMatic Context Plugin provenance:** [APIMATIC.md](APIMATIC.md)
- **Render Workflows setup and verified run:** [RENDER.md](RENDER.md)
- **Setup, licensing and architecture:** [README.md](README.md)

## Supplied Sandbox capture record

[Download the payment record](docs/evidence/sandbox-payment-record.json).
The entrant downloaded this record from the hosted app and supplied it for review
on November 10, 2026. It contains the synthetic Northstar landing-page example:

| Item | Amount USD | Payment decision |
| --- | ---: | --- |
| Design mockups and editable prototype | 150.00 | Approved |
| Hosted staging preview | 90.00 | Approved |
| Mobile screenshots | 40.00 | Unapproved: no evidence |
| Source handoff archive | 20.00 | Unapproved: pending |

The record reports a **COMPLETED Sandbox capture of USD 240.00**, leaving USD 60.00
unpaid. It includes the original synthetic input, source fingerprint, decision
reasons, order/capture identifiers and events. This is an exported demo artifact,
not a signed PayPal attestation or evidence of real-money processing. The source
fingerprint is not a digital signature. A checkout URL or buyer login is not
needed to inspect the record.

## Verification performed

GitHub Actions runs Node 22 dependency installation, TypeScript checks, browser
bundle build, 19 automated tests and 23 synthetic evidence regression cases.
See [Project checks](https://github.com/TejaswiniVasu/MilestoneMatch/actions/workflows/ci.yml).
The regression case count is not a real-world accuracy claim.

Browser checks covered the hosted checkout/export supplied by the entrant, licensed
analytics and Gantt evaluation, live Channel3 offers, and a successful Render
readiness flow. Local interface checks covered 320–1440 px widths, Light/Dark/System
preferences, theme persistence, keyboard skip navigation and unchanged payment
selections. No OpenAI service is used or required.

## Remaining submission artifacts

The public demo video, actual user-feedback findings and completed Devpost
submission are not yet supplied. Do not claim they are complete or invent their
URLs. Evaluation licenses apply to vendor components; generated vendor bundles
and credentials are deliberately excluded from Git. The app builds its bundles
from pinned npm dependencies.
