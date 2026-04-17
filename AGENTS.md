# AGENTS.md — Retained

Agent-facing context for working on this codebase. Read this before making changes.

---

## Build and verification

After every change, run all three checks in order and confirm each passes:

```bash
npm run format:check   # Prettier — fails if any file would be reformatted
npm run lint           # ESLint — must exit 0 (zero errors, zero warnings)
npm run build          # tsc + vite — exits non-zero on any TypeScript error
```

The build passes when the output ends with `✓ built in`. No test suite exists yet; a clean lint + build is the minimum bar.

**To fix formatting automatically:**

```bash
npm run format         # rewrites files in place; run before committing
```

**To auto-fix safe lint issues:**

```bash
npm run lint:fix
```

**Local dev:**

```bash
# Terminal 1 — SPA hot reload
cd apps/web && npm run dev

# Terminal 2 — Pages Functions + D1 (must build first)
npm run build
wrangler pages dev apps/web/dist --d1=DB
```

Changes to `functions/` require a rebuild + restart of the Wrangler process. Vite hot-reloads the SPA only.

---

## Two separate TypeScript environments

This repo has **two distinct TS compilation contexts** that do not share types:

| Context                | Root                     | Compiler                        | Global types                                                                                                               |
| ---------------------- | ------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Pages Functions + Cron | `functions/`, `workers/` | Wrangler (esbuild)              | `@cloudflare/workers-types` — `D1Database`, `PagesFunction`, `ExecutionContext`, etc. available globally, no import needed |
| React SPA              | `apps/web/`              | Vite (`apps/web/tsconfig.json`) | Browser DOM types only                                                                                                     |

**Never import from `functions/` inside `apps/web/src/`** and vice versa. Shared types between the two layers must be manually kept in sync (`functions/_shared/types.ts` ↔ `apps/web/src/types.ts`).

The `apps/web/tsconfig.json` has `"noEmit": true` — Vite handles the actual transpilation; `tsc` is type-check only.

---

## Architecture in one diagram

```
Browser (SPA)
  └─ fetch /api/*  ──►  Cloudflare Pages Functions  (functions/api/**)
                              │
                              ├─ D1 (SQLite)           — all persistent state
                              ├─ Anthropic Claude API  — question gen + grading
                              └─ Resend               — OTP + reminder emails

Cloudflare Cron Worker  (workers/cron/index.ts)
  └─ runs 0 * * * *  ──►  D1 query  ──►  Resend
```

The SPA and Functions share the same Cloudflare Pages origin, which is why the session cookie (`SameSite=Strict`) works without CORS configuration.

---

## State machine (frontend)

`App.tsx` owns a single `AppState` union (defined in `apps/web/src/types.ts`). Every view receives `state` (its slice) and `onNext: (state: AppState) => void`. There is no router library. Views never call `setState` directly — they call `onNext`.

**Valid states:**

```
url_entry → url_teaser → otp_entry → quiz_loading → pre_test
  → pre_results → [email] → study_complete → [email] → final_test → final_results
```

Plus: `completed` (any link after `completed_at` is set) and `error`.

**Email entry points** are handled in `App.tsx`'s `useEffect` on mount:

- `/studied?id=<uuid>` → `{ view: 'study_complete', scheduleId }`
- `/final?id=<uuid>` → `loadFinalTest(scheduleId)` → `{ view: 'final_test', ... }`

`public/_redirects` makes Cloudflare Pages serve `index.html` for all paths.

---

## D1 schema essentials

Three tables — see `schema/init.sql` for full DDL.

**`schedules`** is the central table. Key columns and their invariants:

| Column             | Invariant                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pre_answers_json` | `NULL` until pre-test submitted. Gated by `schedule.ts` before study reminder is accepted.                                                                                                             |
| `study_at`         | Set by `schedule.ts`. The cron sends the study email when `study_at <= now() AND study_sent = 0`.                                                                                                      |
| `study_sent`       | `0` → `1` only by the cron. **Never set this in the Pages Function.**                                                                                                                                  |
| `studied_at`       | Set by `studied.ts` when the user confirms study completion.                                                                                                                                           |
| `test_at`          | Set by `studied.ts` alongside `studied_at`. The cron sends the final-test email when `test_at <= now() AND test_sent = 0 AND studied_at IS NOT NULL`.                                                  |
| `test_sent`        | `0` → `1` only by the cron.                                                                                                                                                                            |
| `completed_at`     | Set by `final-answers.ts`. **This is the single source of truth for link invalidation.** Every endpoint that accepts a `schedule_id` from an email link must check this first and return `410` if set. |

All timestamps are Unix epoch integers (seconds). Use `Math.floor(Date.now() / 1000)` for `now`.

---

## Auth model

**Session-authenticated endpoints** (`generate`, `grade`, `pre-answers`, `schedule`) call `getSession(request, env)` from `functions/_shared/auth.ts`. It reads the `session` cookie, looks up `sessions` in D1, and checks expiry. Returns `null` on any failure → callers return `401`.

**Schedule-ID-authenticated endpoints** (`studied`, `final`, `final-answers`) accept any request that presents a valid UUID in the URL — no session cookie needed. These are accessed from email links where the user has no session. They validate via `completed_at` and state checks only. The UUID is the auth token (generated by `crypto.randomUUID()`, 122 bits of entropy).

**OTPs** are stored as SHA-256 hashes in `otp_attempts`. Never compare plain text. The `hashCode` helper in `auth.ts` uses `crypto.subtle` (available globally in Workers).

---

## Claude API usage

All Claude calls are in `functions/_shared/claude.ts`. Two functions:

**`generateQuestions(apiKey, content)`**

- Model: `claude-sonnet-4-6`
- Uses tool-use forced output (`tool_choice: { type: 'tool', name: 'generate_questions' }`) to get a guaranteed-valid JSON array of 4–8 questions
- Called once per session, in `generate.ts`, after session auth check
- `answer` field is included in the stored `questions_json` but stripped before any client response

**`gradeAnswer(apiKey, question, modelAnswer, userAnswer)`**

- Model: `claude-haiku-4-5-20251001`
- `max_tokens: 10` — expects only `YES` or `NO`
- Called per answer for `free_recall` and `concept` types; MCQ is graded by exact string match (`userAnswer.trim() === question.answer.trim()`)
- Called from `grade.ts` (per-answer immediate feedback) AND `pre-answers.ts` / `final-answers.ts` (bulk submission)

`ANTHROPIC_API_KEY` is only ever referenced in server files. It must never appear anywhere under `apps/web/`.

---

## Email and the cron

**`functions/_shared/email.ts`** contains `sendEmail()` (direct Resend HTTP, no SDK) and four template functions: `otpEmailHtml/Text`, `studyReminderHtml/Text`, `finalTestEmailHtml/Text`.

**The cron** (`workers/cron/index.ts`) is the **only** sender of study reminder and final-test emails. The Pages Function `schedule.ts` writes `study_at` and leaves `study_sent = 0`. Do not add `sendEmail` calls to `schedule.ts` — doing so would break the delay feature (the user's chosen delay would be ignored and the email would arrive immediately).

The cron runs `0 * * * *`. Maximum delivery lag relative to the scheduled timestamp is 59 minutes.

---

## Question and answer data flow

```
generate.ts
  Claude → Question[] (with answer field)
  Stored in schedules.questions_json (with answer)
  Sent to client:  questions.map(({answer, ...q}) => q)   ← answer stripped

grade.ts / pre-answers.ts / final-answers.ts
  Read questions_json from D1 (with answer) for grading
  Return { correct: boolean } or result objects — never the answer field in isolation
  Exception: final-answers.ts returns model_answer in each FinalResult — this is intentional,
             it's the results screen reveal

final.ts
  Strips answer before returning questions for the final test (same strip as generate.ts)
```

**The `answer` field must never appear in any response except `final-answers.ts`'s `model_answer` field.**

---

## Linting and formatting

**Tools:**

| Tool     | Config              | What it owns                                                           |
| -------- | ------------------- | ---------------------------------------------------------------------- |
| Prettier | `.prettierrc`       | All whitespace, quotes, semicolons, line length (100), trailing commas |
| ESLint   | `eslint.config.mjs` | Correctness rules — unused vars, `prefer-const`, React Hooks rules     |

Prettier and ESLint do not overlap: `eslint-config-prettier` disables every ESLint rule that would conflict with Prettier's output.

**Active ESLint rules to be aware of:**

- `@typescript-eslint/no-unused-vars` — error. Prefix intentionally unused params with `_` (e.g. `_answer`, `_event`).
- `@typescript-eslint/no-explicit-any` — warning. Avoid `any`; use generics or `unknown` where possible.
- `prefer-const` — error. Use `const` unless reassignment is required.
- `react-hooks/rules-of-hooks` — error. Hooks must be called unconditionally at the top level.
- `react-hooks/exhaustive-deps` — warning. Include all referenced values in `useEffect` deps, or add a suppression comment with an explanation when the omission is intentional (see `QuizLoading.tsx` for the established pattern).

**When adding an `eslint-disable` comment:**

Place it on the line immediately before the offending line (not inside the block), and always include a brief explanation of why the suppression is correct:

```ts
// <reason why this suppression is safe>
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Never suppress `no-unused-vars` — rename the variable with a `_` prefix instead.

---

## Adding a new API endpoint

1. Create `functions/api/<path>.ts`
2. Export a named handler: `export const onRequestGet/Post/...: PagesFunction<Env> = async (context) => { ... }`
3. For dynamic segments, the directory name is `[param_name]` and `context.params.param_name` gives the value (always `string`)
4. Import `Env` from `../../_shared/types` (adjust depth as needed)
5. Use `jsonOk` / `jsonError` from `_shared/auth` for consistent response shape
6. Run `npm run format:check && npm run lint && npm run build` to verify

No registration or routing config is needed — Cloudflare Pages maps the file path to the URL automatically.

---

## Adding a new SPA view

1. Create `apps/web/src/views/MyView.tsx`
2. Add a new branch to the `AppState` union in `apps/web/src/types.ts`
3. Import and render it in the `App.tsx` conditional block
4. The view receives `state: Extract<AppState, { view: 'my_view' }>` and `onNext: (state: AppState) => void`
5. Never read from or write to `localStorage` / `sessionStorage` — all state lives in the React state machine
6. Run `npm run format:check && npm run lint && npm run build` to verify

---

## Common mistakes to avoid

- **Setting `study_sent` or `test_sent` in a Pages Function.** Those flags belong to the cron only.
- **Sending `answer` to the client** in any endpoint other than `final-answers.ts`.
- **Importing from `functions/` in `apps/web/src/`** or vice versa. The two TS environments are isolated.
- **Using `Date.now()` without dividing by 1000.** All D1 timestamps are Unix seconds, not milliseconds.
- **Trusting `context.params` types.** Wrangler types params as `string | string[]`; cast with `params.schedule_id as string`.
- **Forgetting to check `completed_at`** in any endpoint that accepts a `schedule_id` from an email link. The 410 response is what drives the `Completed` view.
- **Adding `@anthropic-ai/sdk` imports to `apps/web/src/`.** The SDK is a server-only dependency.
