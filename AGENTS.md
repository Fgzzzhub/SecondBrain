# AGENTS.md
> Panduan untuk AI agent yang bekerja secara autonomous (multi-step, agentic) di project ini.
> Dibaca bersama CLAUDE.md — AGENTS.md fokus ke workflow dan decision-making, CLAUDE.md fokus ke rules teknis.

---

## 🎯 PRINSIP UTAMA

**App ini milik satu orang, untuk dipakai sehari-hari.** Setiap keputusan teknis harus mempertimbangkan: *"apakah ini akan terasa lebih baik saat dipakai di iPhone jam 7 pagi?"* — bukan *"apakah ini impressive secara teknis?"*

**Tiga pilar utama yang paling sering dipakai:**
1. **Finance** — catat transaksi, lihat saldo, automasi
2. **Rokok** — log harian, tracking progress
3. **Tasks** — tambah, cek, selesaikan

Fitur lain penting tapi ketiga pilar ini harus selalu bekerja sempurna.

---

## 🔍 SEBELUM MULAI CODING

### Step 1: Pahami scope
Baca instruksi user dengan teliti. Identifikasi:
- File mana yang perlu diubah
- Apakah ada dependency ke file lain
- Apakah ada risiko breaking existing feature

### Step 2: Cek file yang relevan
Sebelum menulis kode baru, **baca file yang akan diubah terlebih dahulu**. Jangan asumsikan isi file berdasarkan nama — baca aktual kontennya.

File yang sering relevan:
- `src/app/page.tsx` — home dashboard, banyak logic di sini
- `src/app/components/navigation/liquid-glass.css` — perubahan kecil bisa break navbar
- `src/app/api/ai-chat/route.ts` — AI integration, jangan break function calling
- `supabase/migrations/` — baca migration terakhir sebelum tambah kolom baru

### Step 3: Cek CLAUDE.md
Pastikan approach yang dipilih tidak melanggar aturan di CLAUDE.md — terutama soal iOS PWA quirks dan design system.

---

## 🏗️ CARA MEMBUAT FITUR BARU

### Komponen UI baru
1. Buat di `src/app/components/` (komponen shared) atau di folder page yang relevan
2. Ikuti pattern yang sudah ada — lihat `GlassCard.tsx` atau `StatCard.tsx` sebagai referensi
3. Style menggunakan inline style untuk nilai spesifik, Tailwind untuk layout utility
4. Jangan buat CSS file baru kecuali benar-benar diperlukan (sudah ada `liquid-glass.css` dan `globals.css`)

### API Route baru
1. Buat di `src/app/api/nama-endpoint/route.ts`
2. Wajib: validasi secret, try-catch, return NextResponse.json
3. Gunakan `createClient` dari `@/lib/supabase/server`
4. Tambahkan env var yang diperlukan ke `.env.local` dan dokumentasikan

### Tabel Supabase baru
1. Buat migration baru di `supabase/migrations/YYYYMMDDHHMMSS_nama.sql`
2. **Jangan edit migration yang sudah ada**
3. Selalu tambahkan RLS policy di migration yang sama
4. Format: `ALTER TABLE` untuk tambah kolom, `CREATE TABLE` untuk tabel baru

### Fitur yang butuh cron
- Vercel Hobby hanya punya **1 cron job** — sudah dipakai di `/api/cron/daily`
- Tambahkan logic baru ke dalam `/api/cron/daily/route.ts` yang sudah ada
- Jika butuh jadwal berbeda (misal weekly), gunakan Supabase pg_cron sebagai alternatif gratis

---

## 🐛 DEBUGGING APPROACH

### iOS PWA bug
**Gejala:** Elemen terlihat menembus/di belakang elemen lain, dropdown tidak muncul dengan benar
**Cek:** Apakah ada `transform` atau `backdrop-filter` di ancestor element?
**Fix:** Gunakan `createPortal` untuk dropdown, hapus `transform: translateX` dari fixed elements

**Gejala:** `position: fixed` tidak bersikap seperti yang diharapkan
**Cek:** Apakah ada parent dengan `transform`, `filter`, atau `will-change`?
**Fix:** Pastikan fixed elements tidak punya transformed ancestor

**Gejala:** `backdrop-filter` tidak bekerja
**Cek:** Apakah sudah ada `-webkit-backdrop-filter`?
**Fix:** Selalu tulis keduanya berpasangan

### Supabase error
**Gejala:** Query return null padahal data ada
**Cek:** RLS policy — apakah user sudah authenticated dan policy sudah benar?

**Gejala:** `.single()` throw error
**Cek:** Kemungkinan row tidak ada — gunakan `.maybeSingle()` jika data opsional

**Gejala:** Real-time tidak trigger
**Cek:** Apakah tabel sudah enable replication di Supabase dashboard?

### AI Chat bug
**Gejala:** Function calling tidak trigger
**Cek:** Apakah function declaration di Gemini sudah benar? Parameter required sudah sesuai?

**Gejala:** Context terlalu panjang
**Fix:** Batasi data yang di-inject — gunakan summary/aggregate bukan raw rows

---

## 📐 DECISION FRAMEWORK

### Kapan buat komponen baru vs extend yang ada?
- **Extend** jika logic serupa dan bisa di-prop-ify tanpa membuat komponen terlalu complex
- **Buat baru** jika visual atau behavior sangat berbeda, atau jika extend akan membuat file > 300 baris

### Kapan pakai inline style vs Tailwind?
- **Inline style:** nilai spesifik yang tidak ada di Tailwind (rgba colors, calc(), custom px values)
- **Tailwind:** layout (flex, grid, gap, padding standar), positioning (relative, absolute, fixed)
- **Jangan mix** keduanya untuk property yang sama pada elemen yang sama

### Kapan pakai `useEffect` vs server-side fetch?
- **Server component + fetch:** data yang tidak perlu realtime, halaman yang bisa di-cache
- **`useEffect` + Supabase client:** data realtime, data yang bergantung pada user interaction
- **`useRealtimeSync`:** gunakan hook yang sudah ada untuk realtime subscription

### Kapan tambah dependency baru?
- **Tanya dulu** apakah ada cara native atau dengan library yang sudah ada
- Library yang sudah terinstall: `lucide-react`, `framer-motion` (cek package.json untuk list lengkap)
- Hindari library besar untuk fungsi kecil — Vercel Hobby punya bundle size consideration

---

## 🚫 JANGAN LAKUKAN INI

- ❌ Jangan gunakan `<form>` HTML tag — gunakan button dengan onClick handler
- ❌ Jangan gunakan `localStorage` atau `sessionStorage` untuk data penting — pakai Supabase
- ❌ Jangan hardcode user ID — selalu ambil dari `supabase.auth.getUser()`
- ❌ Jangan buat halaman baru tanpa menambahkannya ke `MoreSheet.tsx` dan `PAGE_META` di `MobileHeader.tsx`
- ❌ Jangan gunakan `alert()`, `confirm()`, atau `prompt()` — buat UI component yang proper
- ❌ Jangan install library untuk animasi sederhana — CSS transition + cubic-bezier sudah cukup
- ❌ Jangan tambahkan warna baru yang tidak ada di design system tanpa alasan kuat
- ❌ Jangan buat file CSS baru — extend `globals.css` atau `liquid-glass.css`
- ❌ Jangan gunakan `any` type di TypeScript kecuali benar-benar tidak ada pilihan lain
- ❌ Jangan commit API key atau secret apapun ke kode

---

## ✅ PATTERN YANG DIANJURKAN

### Fetch data di page component
```tsx
// Di page.tsx — server component
import { createClient } from '@/lib/supabase/server'

export default async function FinancePage() {
  const supabase = createClient()
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return <FinanceView transactions={transactions ?? []} />
}
```

### Haptic feedback saat user action
```tsx
import { triggerHaptic } from '@/lib/haptic'

const handleSave = async () => {
  triggerHaptic('medium') // gunakan lib yang sudah ada
  await saveData()
}
```

### Toast/feedback setelah aksi
Jangan buat toast library baru. Gunakan state lokal dengan animasi CSS sederhana, atau extend pattern yang sudah ada di komponen lain.

### Format Rupiah
```tsx
// Selalu format dengan locale id-ID
const formatted = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(amount)
// Output: Rp 130.000
```

### Conditional rendering yang aman
```tsx
// Gunakan ini agar tidak ada "0" yang ter-render
{count > 0 && <Badge>{count}</Badge>}

// Bukan ini
{count && <Badge>{count}</Badge>} // ← bisa render "0"
```

---

## 📋 WORKFLOW UNTUK TASK KOMPLEKS

Untuk task yang melibatkan banyak file atau fitur besar:

1. **Breakdown** — list semua file yang perlu diubah sebelum mulai
2. **Migration dulu** — jika butuh schema baru, buat migration SQL terlebih dahulu
3. **API route** — buat/update backend sebelum frontend
4. **Komponen** — buat komponen dari yang paling dalam (child) ke luar (parent)
5. **Integrasi** — sambungkan ke page/layout
6. **Checklist CLAUDE.md** — verifikasi semua aturan terpenuhi

---

## 🔄 SAAT ADA KONFLIK ATAU AMBIGUITAS

1. **Prioritaskan:** tidak break existing > fitur baru berjalan sempurna
2. **Tanya jika:** instruksi ambigu soal nama tabel, nama kolom, atau behavior yang tidak jelas
3. **Default ke:** pattern yang sudah ada di codebase, bukan pattern "ideal" dari luar
4. **Jangan asumsikan** nama tabel atau kolom — cek migrations untuk yang paling akurat