# Contributing

## Run locally

Use Node 20.9+, npm and Docker Compose v2. Start from a local copy of the repo.

```bash
cp .env.example .env
openssl rand -base64 32
# Set AUTH_SECRET in .env to the value above.
docker compose up -d --wait
npm install
npm run setup
npm run dev -- -p 3001
```

Open http://localhost:3001. The login page shows the demo account. See the [README](README.md#run-it) for setup details. Run setup only against a local demo database; the seed replaces some records and resets demo staff passwords.

## Use invented data

Never use real patient data in development, issues or pull requests. Keep demo names invented. Do not commit `.env` or secrets. Read the [checklist before real patients](README.md#before-real-patients) before considering clinic use.

## Send a small PR

Keep each PR focused on one change. Explain the problem, what changed and how you checked it. For UI work, include screenshots with invented data. Leave unrelated cleanup for another PR.

Report security issues privately using [SECURITY.md](SECURITY.md).
