# Anti-Slop Music Prompt Builder

Form terstruktur → prompt siap tempel untuk **Suno**, **Udio**, atau generator musik AI lain — dirancang untuk melawan hasil "AI slop" (lagu generik, mix glossy, lirik klise). Rating atas lagu yang dihasilkan diolah menjadi insight, sehingga aturan anti-slop berangsur digantikan bukti dari hasilmu sendiri.

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Radix) · Zustand · localStorage. Tanpa backend. Satu-satunya panggilan jaringan adalah asisten AI opsional yang memakai API key milik pengguna, dan dimatikan secara default.

[![CI](https://github.com/nagano9/songprompt/actions/workflows/ci.yml/badge.svg)](https://github.com/nagano9/songprompt/actions/workflows/ci.yml)

---

## Cara menjalankan

Prasyarat: **Node.js 18.18+** (disarankan 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Perintah | Fungsi |
|---|---|
| `npm run build` / `npm start` | Build produksi / jalankan hasilnya |
| `npm run lint` | ESLint (flat config, typescript-eslint, react-hooks) |
| `npm run typecheck` | Type-check |
| `npm test` | 74 unit test (Vitest) untuk semua logika domain |
| `npm run e2e` | 11 test end-to-end (Playwright) terhadap build produksi — butuh `npm run build` dan `npx playwright install chromium` sekali |
| `npm run check` | lint + typecheck + test + build sekaligus |
| `npm run smoke` | Cetak output generator ke terminal untuk cek cepat |

CI (`.github/workflows/ci.yml`) menjalankan lint → typecheck → test → build → e2e di setiap push dan PR. Trace Playwright diunggah sebagai artifact bila gagal.

Deploy: 100% statis di sisi klien, bisa langsung ke Vercel/Netlify.

---

## Fitur

| | Fitur | Inti idenya |
|---|---|---|
| **Inti** | Form 10 bagian, 8 template, preview per kolom, Copy, varian Ringkas/Standar/Detail | Negatif dipisah dari style agar tidak "memancing" model |
| **Feedback loop** | Rating 1–5★ + tag masalah per prompt di Riwayat → tab **Insight** | Deskriptor dengan *lift* positif/negatif dari rating-mu sendiri; deskriptor yang terbukti gagal muncul sebagai peringatan teratas di Saran |
| **Eksperimen A/B** | Tab **A/B**: 3 take yang hanya berbeda di satu variabel (era, delivery vokal, kepadatan, tempo, ruang mix) | Satu variabel per eksperimen membuat hasil rating bisa dibaca; Insight menandai pemenangnya |
| **Budget negatif** | Slider batas exclusion (default 10), negatif otomatis diberi prioritas | Daftar panjang melemahkan tiap item; negatif yang ditulis user selalu dikirim |
| **Profil platform berversi** | Pilih versi model (Suno v4.5–v6, v4 ke bawah, Udio), batas bisa diubah di Pengaturan, tanggal verifikasi + tanda usang (>90 hari) | Batas Suno tidak dipublikasikan resmi — jadi diperlakukan sebagai data yang bisa diperbarui user |
| **Lirik workshop** | Suku kata per baris, skema rima, baris menyimpang, deteksi hook, klise (EN+ID, per kata utuh) | Suku kata bahasa Indonesia akurat karena polanya teratur |
| **Penerjemah referensi** | "mirip Iwan Fals" → deskriptor era/instrumen/vokal/produksi, sekali klik isi ke form | 37 artis & skena (14 Indonesia); hanya mengisi field kosong |
| **Mode cepat + glosarium** | 3 kartu (genre, perasaan, cerita), istilah Indonesia ("serak", "mendayu", "galau") diterjemahkan otomatis | 82 entri glosarium, frasa terpanjang menang |
| **Riwayat** | Cari, filter, pin, tag, ekspor/impor JSON, **link share** | Link menyimpan isi form di hash URL (terkompresi) — tidak pernah dikirim ke server |
| **Asisten AI (opsional)** | "Kritik lirikku" dan "Tulis ulang baris klise" via Claude | Pakai API key sendiri, langsung dari browser; key tidak disimpan kecuali dicentang |

---

## Arsitektur

```
src/
├── app/                        # layout, page, globals.css, icon.svg
├── lib/                        # DOMAIN LAYER — TypeScript murni, tanpa React, semuanya diuji
│   ├── types.ts                # Kontrak data (PromptInput, HistoryEntry, Rating, ExperimentRef…)
│   ├── prompt/
│   │   ├── generator.ts        # ★ PromptInput × platform × varian × profil → field siap tempel
│   │   ├── negatives.ts        # Aturan negatif berprioritas, filter konflik, budget
│   │   ├── platforms.ts        # Profil platform berversi + override user
│   │   ├── suggestions.ts      # Mesin saran + skor spesifisitas
│   │   ├── experiments.ts      # Take A/B/C satu-variabel
│   │   ├── templates.ts, defaults.ts
│   ├── lyrics/analyze.ts       # Suku kata, rima, hook, klise
│   ├── references/             # Kamus artis/skena → deskriptor + penerjemah
│   ├── glossary/id-en.ts       # Glosarium Indonesia → Inggris
│   ├── insights.ts             # Rating → lift deskriptor, pemenang eksperimen
│   ├── share.ts                # Encode/decode link share (deflate-raw + base64url)
│   └── llm/anthropic.ts        # Klien Claude opsional (browser-direct)
├── store/                      # Zustand + persist: builder (draft), history, settings
├── hooks/use-derived.ts        # Profil aktif & insight (memoized)
└── components/
    ├── prompt-builder.tsx      # Root: header, share-link loader, 5 tab
    ├── settings-dialog.tsx     # Profil platform + asisten AI
    ├── builder/                # Form lengkap & cepat, workshop, penerjemah referensi, glosarium
    ├── output/                 # Preview, A/B, Saran, Insight
    ├── history/                # Riwayat + editor rating
    └── ui/                     # Primitif shadcn/ui
e2e/                            # Playwright (desktop + mobile)
```

**Prinsip:** semua logika ada di `lib/` sebagai fungsi murni dan diuji tanpa browser. UI hanya membaca store dan memanggil fungsi itu.

```
Form ─▶ builder-store ─▶ generatePrompt(input, platform, variant, profile) ─▶ Preview / A/B
                    └──▶ buildSuggestions(input, platform, { profile, insights }) ─▶ Saran
Copy ─▶ history-store ─▶ rating ─▶ computeInsights() ─┬▶ Insight
                                                      └▶ Saran (deskriptor yang terbukti gagal)
```

---

## Keputusan desain (dan alasannya)

1. **Negatif tidak pernah ditulis di style.** Menyebut sesuatu, meski dengan "no", cenderung memancing model. Suno memakai kolom Exclude terpisah.
2. **Negatif dibatasi dan diprioritaskan.** Negatif spesifik genre (prioritas 5) mengalahkan negatif umum. Negatif yang ditulis user selalu lolos, dan yang dipangkas tetap ditampilkan (dicoret) supaya transparan.
3. **Batas platform adalah data, bukan kode.** Suno tidak mempublikasikan batasnya. Angka saat ini diambil dari pengukuran komunitas (style 1000 / exclude 1000 / lirik 5000 untuk v4.5–v6; style 200 / lirik 3000 untuk v4 ke bawah), lengkap dengan tanggal verifikasi. Batas hanya memicu peringatan, tidak pernah memotong teks.
4. **Bukti mengalahkan heuristik.** Begitu ada ≥5 rating, deskriptor yang dipakai di ≥3 lagu dengan lift ≤ −1★ menjadi peringatan teratas di Saran. Sebelum itu, insight ditandai "data masih tipis".
5. **Eksperimen mengubah tepat satu variabel.** Take A selalu identik dengan baseline, dan setiap take menampilkan apa yang berubah.
6. **Catatan aransemen masuk ke tag lirik**, bukan ke style. Tanda kurung dihindari karena Suno cenderung menyanyikannya.
7. **Lirik pengguna tidak pernah dibuang**, kecuali saat lagu disetel instrumental (lirik di form diabaikan agar tidak dinyanyikan).
8. **Referensi menerjemahkan gaya, bukan meniru suara.** Nama artis tidak pernah dikirim ke Suno/Udio.
9. **Asisten AI opt-in dan tanpa perantara.** Request langsung dari browser ke `api.anthropic.com` memakai header `anthropic-dangerous-direct-browser-access`. API key hanya ada di memori, kecuali pengguna mencentang "Ingat key".

---

## Kustomisasi

| Ingin… | Ubah |
|---|---|
| Menambah template | `TEMPLATES` di `lib/prompt/templates.ts` (test memastikan muat di batas Suno & skor ≥80) |
| Mengubah negatif / prioritasnya | `BASE_NEGATIVES`, `GENRE_NEGATIVES`, `STRONG_NEGATIVES` di `lib/prompt/negatives.ts` |
| Menambah versi model | Entri baru di `PLATFORM_PROFILES` (`lib/prompt/platforms.ts`) |
| Menambah artis/skena | `REFERENCES` di `lib/references/dictionary.ts` |
| Menambah istilah Indonesia | `GLOSSARY` di `lib/glossary/id-en.ts` |
| Menambah klise | `LYRIC_CLICHES` di `lib/lyrics/analyze.ts` |
| Menambah variabel eksperimen | `ExperimentAxis` di `types.ts` + kasus di `generateTakes()` |

## Penyimpanan & privasi

Semua data ada di `localStorage` browser: `aspb-draft` (form), `aspb-history` (riwayat; yang dirating dan dipin tidak pernah tergusur, sisanya maksimal 100), dan `aspb-settings`. Link share menyimpan isi form di bagian `#` URL, yang tidak pernah dikirim browser ke server. Gunakan Ekspor JSON untuk backup atau memindahkan riwayat antar-perangkat.
