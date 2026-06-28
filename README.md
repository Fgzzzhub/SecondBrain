# Brain OS — Personal Life Management PWA

Next.js 16 + React 19 + Tailwind v4 + Supabase, hosted on Vercel Hobby.

## Local dev

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Environment variables

Required keys live in `.env.local` (see the file for placeholders). Also add them in
**Vercel → Settings → Environment Variables** for production.

| Variable | Used by | How to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All Supabase clients | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/send-briefing` (cron, reads across users) | Supabase dashboard → Settings → API → **service_role secret** (keep server-only) |
| `GEMINI_API_KEY` | `/api/ai-chat` | https://aistudio.google.com/app/apikey (free tier varies by model & project) |
| `GEMINI_MODEL` (optional) | `/api/ai-chat` | Model id, defaults to `gemini-2.5-flash`. Override if a model returns a `limit: 0` free-tier quota error. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Browser push subscribe + server send | Generated below |
| `VAPID_PRIVATE_KEY` | Server-side `webpush.setVapidDetails` | Generated below |
| `VAPID_CONTACT_EMAIL` | VAPID identity (mailto link) | Your email, format `mailto:you@example.com` |
| `CRON_SECRET` (optional) | Verifies `/api/send-briefing` came from Vercel Cron | Any random string; set the same value in Vercel cron config |

### Regenerating VAPID keys

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Paste the public key into `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private into `VAPID_PRIVATE_KEY`.
Keys must match between client subscription and server sending; rotating them invalidates
existing push subscriptions.

## Daily briefing schedule

`vercel.json` runs `/api/send-briefing` once a day at `0 0 * * *` (00:00 UTC = **07:00 WIB**).
On Vercel Hobby you get one daily cron; this uses it.

To test locally, hit `GET http://localhost:3000/api/send-briefing` (skip `CRON_SECRET` while testing).

## Database migrations

After pulling, apply `supabase/migrations/` to your Supabase project:

```bash
supabase db push   # or run the SQL in supabase/migrations/ manually via dashboard
```

New tables added by the AI-chat + push features:
- `pomodoro_sessions` — one row per completed focus/break session (powers AI context + analytics)
- `push_subscriptions` — Web Push endpoints per device
- `auto_transactions` — Auto-Pilot finance rules with configurable frequency, intervals, start dates, and trigger hours.

## Architecture notes

- **Design system:** glass tokens live in `src/app/globals.css` (`--bg-base`, `--bg-surface`, `--accent`, `--glow`, …); accent color stays user-customizable via `SettingsContext`.
- **Primitives:** `src/app/components/ui/GlassCard.tsx`, `StatCard.tsx`.
- **Floating Quick Action:** `FloatingQuickAction.tsx` (FAB) + `QuickActionProvider.tsx` (context for modals/toasts).
- **AI Chat:** `/api/ai-chat/route.ts` reads the authenticated user's data from Supabase, builds a compact summary, and forwards to Gemini (model set by `GEMINI_MODEL`, default `gemini-2.5-flash`). UI is `components/AIChatDrawer.tsx`.
- **Push notifications:** custom worker chunk in `/worker/index.ts` is bundled by `@ducanh2912/next-pwa` into the generated SW. `lib/push.ts` subscribes the browser; `/api/save-subscription` stores the endpoint; `/api/send-briefing` fans out the daily push.
