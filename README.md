# WiseCompanion Public Shell

This repository is a deliberately reduced public shell.

It contains only a lightweight landing surface and static assets for the WiseCompanion project. The operational product uses a separate private codebase and private infrastructure for:

- tactical decision engines
- capital path solving
- activity ingestion and rule parsing
- regional bank activity intelligence
- authentication and protected backend functions

## Included

- static `index.html`
- public-facing shell styles
- manifest and icon assets
- repository guardrails via `.gitignore`

## Not Included

- internal business logic
- solver heuristics
- Supabase functions and deployment details
- private activity datasets
- runtime configuration and secrets

## Notes

- `app.config.js` is intentionally ignored and should remain private.
- This public shell is not wired to a live backend.
- The private working system is maintained outside this reduced repo layout.

