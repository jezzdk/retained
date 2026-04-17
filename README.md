# Retained

Spaced retrieval learning for articles. Paste a URL, take a pre-test before you read, study, then take the same test days later to see how much you retained.

## Why

Most people read articles and promptly forget them. The research on why is pretty clear: passive reading doesn't make memories stick. What does work is retrieval — the act of trying to recall something, not just re-reading it.

Retained applies two evidence-backed techniques back to back:

**Pretesting.** Attempting to answer questions _before_ you've read the material primes the brain to look for those answers. You notice and encode information more deeply because you already know what to look for. The pre-test score doesn't matter — the attempt is the point.

**Spaced retrieval.** Taking the same test again after a delay (days, not minutes) forces your brain to reconstruct the memory rather than retrieve it from short-term cache. That reconstruction is what makes the memory durable.

The results screen shows both attempts side by side with model answers, so you can see exactly what changed — and what still needs work.

Built on Cloudflare Pages + D1 + Workers, with Anthropic Claude for question generation and Resend for email.

## Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- Cloudflare account (free)
- Anthropic API key
- Resend account + verified sender domain

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure secrets — the only file you need to edit for local dev
cp .dev.vars.example .dev.vars
# Fill in ANTHROPIC_API_KEY and RESEND_API_KEY

# 3. Set up local database
npm run db:init:local

# 4. Start dev servers
npm run dev
```

Open `http://localhost:5173`.

### Dev commands

| Command | What it does | When to use |
|---|---|---|
| `npm run dev` | Builds the frontend, then starts both servers | **Use this for all local development.** Open `http://localhost:5173`. |
| `npm run dev:web` | Starts only the Vite frontend server (no API) | When working on static UI with no backend calls |
| `npm run dev:worker` | Starts only the Wrangler server at `http://localhost:8788` | Requires a prior `npm run build`. Use when testing API in isolation. |
| `npm run build` | Compiles the frontend to `apps/web/dist/` | Run manually when you want to test built assets via the Wrangler URL |

### How the two servers fit together

**Wrangler** runs the backend: it emulates Cloudflare Pages locally, serving the `functions/` directory as API routes (`/api/*`) and providing the D1 database binding.

**Vite** runs the frontend: it serves the React app with hot module replacement so changes appear instantly without rebuilding.

**The proxy** connects them: when the React app makes a request to `/api/...`, Vite forwards it to Wrangler at `localhost:8788`, which handles it and returns the response. Your browser only ever talks to `localhost:5173`.

In production there is no Vite — Cloudflare serves the built `dist/` files and runs `functions/` as edge functions natively.

## Deployment

```bash
# 1. Create D1 database
wrangler d1 create retained-db
# Paste the returned database_id into wrangler.toml and workers/cron/wrangler.toml

# 2. Run schema
npm run db:init

# 3. Set secrets
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put RESEND_API_KEY

# 4. Update APP_URL and FROM_EMAIL in wrangler.toml and workers/cron/wrangler.toml

# 5. Deploy
npm run deploy
npm run deploy:cron
```

## License

MIT
