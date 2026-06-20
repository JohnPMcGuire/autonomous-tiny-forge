# Autonomous Tiny Forge

A public gallery of small, useful tools and playful experiments. The forge chooses what to create, while deterministic checks decide whether a change is published.

## Public site

The live site is published at:

`https://johnpmcguire.github.io/autonomous-tiny-forge/`

## Collaborate

There are several ways to help:

- Use the structured issue forms to propose a tool or game, report a bug, or share feedback.
- Review existing apps on mobile and desktop.
- Create a branch and submit a pull request for code, visual, game, accessibility, or documentation changes.
- Add screenshots or short recordings when proposing interactive or visual changes.

Start with [CONTRIBUTING.md](CONTRIBUTING.md). Pull requests use a checklist for tests, mobile behavior, keyboard and touch support, visual evidence, and safety. The repository owner reviews changes before merging.

## Architecture

- `index.html`, `styles.css`, and `app.js` provide a dependency-free static gallery.
- `registry/apps.json` contains every published app manifest.
- `.github/workflows/deploy.yml` validates and deploys the site.
- `.github/workflows/forge.yml` runs on Tuesdays and Fridays, or manually.
- `scripts/forge.mjs` asks the model to create, improve, or skip one bounded change.
- `scripts/validate.mjs` rejects unknown engines, duplicate IDs, network URLs, script-like content, and oversized manifests.
- GitHub Issue Forms provide the feedback loop.

## Enable autonomous runs

1. Open **Settings → Secrets and variables → Actions**.
2. Create the repository secret `OPENAI_API_KEY`.
3. Optionally create the repository variable `OPENAI_MODEL`. The workflow otherwise uses `gpt-5-mini`.
4. Open **Settings → Actions → General → Workflow permissions** and choose **Read and write permissions**.
5. Run **Actions → Autonomous forge run → Run workflow** once to verify the setup.

The API key is used only by the private GitHub Actions runner. It is never sent to visitors.

## Enable publishing

Open **Settings → Pages** and choose **GitHub Actions** under Build and deployment. A push to `main` will then run the deployment workflow.

## Local check

```bash
node --check app.js
node --check scripts/forge.mjs
node scripts/validate.mjs
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Safety boundary

The model cannot write arbitrary code. It can only choose content for reviewed app engines. See [SECURITY.md](SECURITY.md) for the full boundary.
