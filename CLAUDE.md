# CLAUDE.md
> Instruksi wajib untuk Claude Code saat bekerja di project ini.
> Baca seluruh file ini sebelum melakukan perubahan apapun.

---

## 🧠 PROJECT OVERVIEW

**Nama:** second-brain
**Tipe:** Personal Life Management PWA — untuk penggunaan pribadi (single user)
**Stack:** Next.js 14+ App Router · Supabase (PostgreSQL + Auth + Edge Functions) · Vercel Hobby · Tailwind CSS
**Platform utama:** iPhone iOS (PWA via Add to Home Screen) · Android sekunder

---

## ⚠️ ATURAN WAJIB — BACA SEBELUM CODING

### 1. Mobile-first iOS PWA — jangan break existing features
- Setiap perubahan UI harus ditest secara mental untuk **iPhone screen (390px width)**
- Jangan gunakan `position: fixed` dengan `transform` bersamaan — ini trigger iOS stacking context bug yang membuat dropdown menembus elemen lain
- `backdrop-filter` hanya boleh ada di: navbar, bottom sheet, modal overlay, FAB. **Tidak boleh** di form container, card, atau list item
- Selalu sertakan `-webkit-backdrop-filter` setiap kali menulis `backdrop-filter`
- Dropdown/select **wajib** menggunakan `createPortal` ke `document.body` — lihat `AnimatedSelect.tsx` sebagai referensi pattern yang benar
- Padding bottom konten: minimal `calc(88px + 32px)` agar tidak tertutup navbar
- Safe area: gunakan `env(safe-area-inset-bottom)` untuk elemen fixed di bottom

### 2. Design system — selalu ikuti, jangan improvisasi
- **Background base:** `#080B14`
- **Glass card:** `background: rgba(30,32,48,0.82)` + `backdrop-filter: blur(24px) saturate(180%)`
- **Border:** `0.5px solid rgba(255,255,255,0.14)` · border-top lebih terang: `rgba(255,255,255,0.22)`
- **Accent primary:** `#6366F1` · secondary: `#8B5CF6`
- **Text primary:** `rgba(255,255,255,0.92)` · secondary: `rgba(255,255,255,0.45)` · muted: `rgba(255,255,255,0.28)`
- **Border radius:** 20px card besar · 16px card medium · 12px input · 8px badge
- **Animasi spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)` untuk elemen yang butuh bounce
- **Animasi smooth:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` untuk transisi biasa
- Tidak boleh ada: gradient text, glow effect berlebihan, colored border terang, pulse animation, atau efek "AI-ish"
- Referensi desain: **Apple native apps** (Health, Wallet, Reminders) — clean, minimal, tidak flashy

### 3. Jangan ubah file-file kritis ini tanpa instruksi eksplisit
- `src/app/layout.tsx`
- `src/lib/supabase/client.ts` · `server.ts` · `admin.ts`
- `src/app/components/navigation/LiquidGlassNav.tsx`
- `src/app/components/navigation/liquid-glass.css`
- `supabase/migrations/` — **jangan pernah edit file migration yang sudah ada**
- `public/sw.js`
- `vercel.json`

### 4. Supabase — pattern yang benar
- Client-side: `createClient` dari `@/lib/supabase/client`
- Server-side / API routes: `createClient` dari `@/lib/supabase/server`
- Admin operations: `@/lib/supabase/admin`
- RLS aktif di semua tabel — jangan bypass
- Migration baru: `supabase/migrations/YYYYMMDDHHMMSS_nama.sql`
- Gunakan `.maybeSingle()` bukan `.single()` jika data mungkin tidak ada

### 5. API Routes
- Validasi `WEBHOOK_SECRET` atau `CRON_SECRET` untuk semua endpoint eksternal
- Gunakan `NextResponse.json()` — bukan `Response.json()`
- Selalu try-catch + return status code yang tepat

---

## 📁 STRUKTUR PROJECT

```
src/
├── app/
│   ├── api/
│   │   ├── ai-chat/route.ts           ← AI chat + function calling (Gemini)
│   │   ├── save-subscription/route.ts  ← Push notification subscription
│   │   └── send-briefing/route.ts      ← Morning briefing push notif
│   ├── components/
│   │   ├── navigation/
│   │   │   ├── LiquidGlassNav.tsx      ← Bottom navbar utama
│   │   │   ├── MoreSheet.tsx           ← Bottom sheet "More" pages
│   │   │   ├── SwipeTransition.tsx     ← Page transition wrapper
│   │   │   └── liquid-glass.css        ← CSS glass material + animasi
│   │   ├── ui/
│   │   │   ├── AnimatedSelect.tsx      ← Dropdown dengan createPortal (iOS-safe)
│   │   │   ├── GlassCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── PageSkeleton.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── AIChatDrawer.tsx            ← AI chat + voice I/O + function calling
│   │   ├── FloatingQuickAction.tsx     ← FAB liquid glass + spring menu
│   │   ├── MobileHeader.tsx            ← Header per halaman
│   │   ├── DailyBriefing.tsx
│   │   ├── AutoFinanceSync.tsx
│   │   ├── NotificationPrompt.tsx
│   │   ├── OmniSearch.tsx
│   │   └── Pomodoro.tsx
│   ├── finance/auto/                   ← Auto transactions management
│   ├── cigarettes/                     ← Pack-based cigarette tracker
│   ├── tasks/
│   ├── notes/
│   ├── trips/
│   ├── analytics/
│   ├── schedule/
│   ├── inventory/
│   ├── subscriptions/
│   ├── timeline/
│   ├── forum/
│   ├── docs/
│   ├── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                        ← Home dashboard
├── hooks/
│   ├── useAutoFinanceSync.ts
│   └── useRealtimeSync.ts
└── lib/
    ├── supabase/ (client · server · admin)
    ├── dateUtils.ts
    ├── haptic.ts
    ├── notifications.ts
    └── push.ts
supabase/
├── functions/notify-telegram/
└── migrations/
```

---

## 🗄️ SUPABASE SCHEMA — FINAL & VERIFIED

> ⚠️ Jangan asumsikan nama kolom — gunakan referensi ini.

### `transactions`
```sql
id, user_id, amount (numeric), 
type text CHECK ('income' | 'expense'),   -- ⚠️ BUKAN 'plus'/'minus'
description text,
wallet_type text CHECK ('Cash' | 'Cashless'),
wallet_name text,
category text DEFAULT 'Lainnya',
status text DEFAULT 'manual',             -- 'manual' | 'auto' | 'pending_review'
source text,                              -- 'mandiri', 'automation', dll
raw_subject text,
confidence integer DEFAULT 100,
created_at
```

### `auto_transactions`
```sql
id, title, type text, amount numeric, category text,
wallet_name text,
frequency text CHECK ('daily' | 'monthly'),
billing_day integer,
last_processed_at date,
start_date date,
trigger_hour integer DEFAULT 0,
created_at
```

### `cigarette_packs`
```sql
id, user_id,
brand text,
initial_sticks integer,
remaining_sticks integer,
is_active boolean DEFAULT true,
created_at
```

### `cigarette_logs`
```sql
id, pack_id (FK → cigarette_packs),
user_id,
smoked_at timestamptz DEFAULT now(),
log_type text CHECK ('self' | 'shared')
```
> ⚠️ Sistem rokok berbasis **pack** — bukan simple daily count.
> Log rokok = insert ke `cigarette_logs` + decrement `remaining_sticks` di `cigarette_packs`.

### `tasks`
```sql
id, user_id,
course_id uuid (FK → courses, nullable),
title text,
due_date timestamptz,
description text,
is_completed boolean DEFAULT false,
completed_at timestamptz,
status text DEFAULT 'pending',
created_at
```

### `notes`
```sql
id, user_id,
course_id uuid (FK → courses, nullable),
title text, content text,
created_at
```

### `user_preferences`
```sql
id (FK → auth.users),
user_name text,
pomodoro_focus_time integer DEFAULT 25,
pomodoro_break_time integer DEFAULT 5,
hide_financial_balance boolean DEFAULT false,
created_at
```
> ⚠️ Tidak ada `daily_cigarette_target` atau `monthly_budget` di schema ini.
> Jika butuh preferensi baru, buat migration ALTER TABLE terlebih dahulu.

### `pomodoro_sessions`
```sql
id, user_id,
duration_minutes integer,
mode text CHECK ('work' | 'break'),
task_id uuid (FK → tasks, nullable),
created_at
```

### `push_subscriptions`
```sql
id, user_id,
endpoint text UNIQUE,
p256dh text, auth text,
user_agent text,
created_at, last_seen_at
```

### `daily_snapshots`
```sql
id, user_id, date date,
balance, income, expense, net (bigint),
cigarettes integer,
tasks_total, tasks_done, tasks_pending integer,
focus_minutes, focus_sessions integer,
created_at
```

### Tabel lain
| Tabel | Kegunaan |
|---|---|
| `courses` | Mata kuliah (name, credits) |
| `schedule` | Jadwal kuliah (subject, day, start_time, end_time, room) |
| `inventories` | Inventaris (item_name, status[Available/Borrowed/Broken], quantity, location) |
| `subscriptions` | Langganan (name, amount, billing_day, wallet_name) |
| `trip_templates` + `template_items` | Trip checklist dengan template |
| `threads` + `comments` + `likes` | Forum |
| `learning_logs` | Learning log (title, content, tags[]) |

---

## 🤖 AI INTEGRATION

**Provider:** Google Gemini (`gemini-2.0-flash`) — free tier
**File:** `src/app/api/ai-chat/route.ts`

**Kemampuan yang sudah ada:**
- Read semua data user sebagai context
- Function calling: input transaksi, log rokok, tambah task
- Voice input (Web Speech API) + Text-to-speech
- Natural language → data (contoh: "kopi 25k cash" → insert ke `transactions`)

**Penting saat update AI function calling:**
- `type` transaksi harus `'income'` atau `'expense'` — bukan `'plus'`/`'minus'`
- Log rokok = insert `cigarette_logs` + update `remaining_sticks` di pack aktif
- Selalu query pack aktif dulu: `cigarette_packs.is_active = true`

---

## 🚀 DEPLOYMENT

- **Hosting:** Vercel Hobby (1 cron job max)
- **Cron:** `vercel.json` → jam 17:00 UTC = 00:00 WIB
- **Env vars wajib:**
```
GEMINI_API_KEY
WEBHOOK_SECRET
CRON_SECRET
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

---

## ✅ CHECKLIST SEBELUM SELESAI

- [ ] Tidak ada TypeScript error
- [ ] Import path pakai alias `@/` bukan relative `../../`
- [ ] `type` di `transactions` menggunakan `'income'` atau `'expense'`
- [ ] Log rokok mengupdate `remaining_sticks` di `cigarette_packs`
- [ ] Dropdown menggunakan `AnimatedSelect` dengan `createPortal`
- [ ] Tidak ada `backdrop-filter` di form container
- [ ] Padding bottom `calc(88px + 32px)` di semua halaman
- [ ] Tidak ada `console.log` tertinggal
- [ ] Error handling di semua API route