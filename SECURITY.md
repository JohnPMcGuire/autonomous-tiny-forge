# Security model

Autonomous Tiny Forge intentionally separates creative decisions from executable code.

## What the scheduled AI may change

The scheduled workflow may only add or revise declarative app entries in `registry/apps.json`. Every entry must use an engine already implemented and reviewed in `app.js`.

## What it may not change

The autonomous workflow does not edit JavaScript, HTML, CSS, workflows, repository settings, or secrets. It may not add dependencies or make public apps call external services.

## Feedback handling

Issue text is untrusted input. The workflow removes links, code blocks, HTML, and control characters before presenting feedback to the model. Model output is constrained to a strict JSON schema and then checked by `scripts/validate.mjs`.

## Secrets

`OPENAI_API_KEY` belongs only in GitHub Actions secrets. It must never be committed or placed in browser code. The public website runs without an API key.

## Reporting a security concern

Do not post secrets or exploit details in a public issue. Contact the repository owner privately through their GitHub profile.
