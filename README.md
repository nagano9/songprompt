# Anti-Slop Music Prompt Builder

Form terstruktur → prompt siap tempel untuk **Suno**, **Udio**, atau generator musik AI lain — dirancang untuk melawan hasil "AI slop" (lagu generik, mix glossy, lirik klise).

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Radix) · Zustand · localStorage. Tanpa backend, tanpa API eksternal.

---

## Cara menjalankan

Prasyarat: **Node.js 18.18+** (disarankan 20 atau 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm run build` | Build produksi (sekaligus type-check) |
| `npm start` | Jalankan hasil build |
| `npm run typecheck` | Type-check saja |
| `npm run smoke` | Cetak output generator untuk template + input buruk ke terminal — cara cepat memeriksa perubahan logika tanpa membuka browser |

Deploy: karena 100% statis di sisi klien, bisa langsung ke Vercel/Netlify tanpa konfigurasi tambahan.

Menambah komponen shadcn lain: `npx shadcn@latest add dialog` — token warna sudah memakai nama standar shadcn, jadi komponen baru langsung menyatu.

---

## Arsitektur

```
src/
├── app/
│   ├── layout.tsx              # Shell HTML, metadata
│   ├── page.tsx                # Server component → render <PromptBuilder />
│   └── globals.css             # Tailwind v4 + token tema (light/dark otomatis)
│
├── lib/                        # DOMAIN LAYER — TypeScript murni, tanpa React
│   ├── types.ts                # Kontrak data: PromptInput, GeneratedPrompt, Suggestion…
│   ├── utils.ts                # cn(), clean(), uniq(), uid()
│   └── prompt/
│       ├── generator.ts        # ★ Inti: PromptInput → field per platform × varian
│       ├── negatives.ts        # Negatif dasar + genre-aware + filter konflik
│       ├── suggestions.ts      # Mesin saran + skor spesifisitas + detektor klise
│       ├── templates.ts        # 8 template anti-slop siap pakai
│       ├── defaults.ts         # Input default, preset struktur, chip saran
│       └── platforms.ts        # Info & batas karakter per platform
│
├── store/
│   ├── builder-store.ts        # State form (Zustand) + autosave draft
│   └── history-store.ts        # Riwayat prompt (maks 50, dedupe)
│
├── components/
│   ├── prompt-builder.tsx      # Root client: layout 2 kolom, memoized generate
│   ├── builder/                # Form: kartu section, tag input, editor struktur, galeri template
│   ├── output/                 # Preview per field, copy button, panel saran + skor
│   ├── history/                # Panel riwayat (copy, muat ulang, hapus)
│   └── ui/                     # Primitif shadcn/ui
│
scripts/smoke.ts                # Uji cepat generator di terminal
```

**Prinsip utama:** semua logika prompt ada di `lib/prompt/` sebagai fungsi murni (`input → output`). UI hanya membaca store dan memanggil fungsi itu. Konsekuensinya: logika bisa diuji tanpa browser (`npm run smoke`), dan menambah platform baru = menambah satu fungsi renderer, tanpa menyentuh komponen.

Alur data:

```
Form ──setField──▶ builder-store ──useDeferredValue──▶ generatePrompt() ──▶ OutputPanel
                         │                         └──▶ buildSuggestions() ─▶ SuggestionsPanel
                         └── persist (localStorage: aspb-draft)
Copy / Simpan ──▶ history-store ── persist (localStorage: aspb-history)
```

---

## Keputusan desain anti-slop (dan alasannya)

**1. Negatif dipisah dari style, bukan ditulis "no X" di prompt.**
Menyebut sesuatu di kolom style — meski dengan kata "no" — cenderung *memancing* model ke arah itu. Karena itu output Suno memisahkan **Style of Music** (hanya deskriptor positif) dan **Exclude Styles** (daftar negatif). Untuk Udio, negatif diletakkan di field terpisah. Format Generic tetap memakai `AVOID:` karena ditujukan ke sistem/LLM yang memahami instruksi.

**2. Negatif genre-aware dengan filter konflik.**
Setiap negatif punya *conflict keys*. Jika kamu sengaja meminta "autotune hyperpop vocal", maka "heavy autotune" otomatis dikeluarkan dari daftar negatif. Negatif genre (mis. folk → buang 808 dan synth pad) hanya aktif bila genrenya cocok.

**3. Catatan aransemen masuk ke tag lirik, bukan ke style.**
`[Verse 1]` diikuti baris `[guitar and close-mic vocal only]`. Ini menciptakan kontras dinamika antar-section — obat utama lagu yang datar — tanpa menghabiskan anggaran karakter kolom style. Tanda kurung `( )` sengaja dihindari karena Suno cenderung menyanyikannya sebagai backing vocal.

**4. Lirik pengguna tidak pernah dibuang.**
Paragraf (dipisah baris kosong) dipetakan ke section berlirik secara berurutan; chorus yang berulang memakai ulang teks chorus pertama; sisa paragraf ditempel ke section terakhir. Jika lirik sudah bertag `[ … ]`, dipakai apa adanya. Menerapkan template juga tidak menghapus lirik.

**5. Tiga varian dengan peran berbeda.**
- **Ringkas** — hanya sinyal terkuat (genre, 2 mood, tempo, vokal, 3 instrumen). Untuk eksperimen cepat.
- **Standar** — semua deskriptor sebagai tag + 3 arahan anti-slop positif. Default yang disarankan.
- **Detail** — kalimat deskriptif; di Generic termasuk catatan aransemen lengkap.

**6. Skor spesifisitas (0–100).**
Proksi untuk "seberapa sedikit yang harus ditebak model". Bukan jaminan kualitas — tapi model mengisi celah dengan rata-rata, dan rata-rata adalah slop. Mood generik ("sad", "happy", "galau") dan lirik klise mengurangi skor.

**7. Referensi artis tidak dikirim ke Suno/Udio.**
Platform-platform itu umumnya menolak nama artis. Field Referensi hanya masuk ke format Generic; untuk Suno/Udio, aplikasi menyarankan menerjemahkannya ke deskriptor era/instrumen/mixing.

### Mesin saran
Aturan di `suggestions.ts`, diurutkan peringatan → tips → info. Beberapa saran punya tombol aksi satu klik (mis. ganti "sad" → "bittersweet resignation", hapus konflik instrumen, sisakan 2 subgenre). Yang dideteksi: genre kosong, subgenre > 2, mood generik (EN + ID), tempo kosong, lirik kosong, frasa klise di lirik (EN + ID), konflik instrumen pakai/hindari, instrumen terlalu sedikit/banyak, vokal kurang detail, section tanpa catatan, panjang melebihi batas, plus tips spesifik genre.

---

## Kustomisasi

| Ingin… | Ubah |
|---|---|
| Menambah template | Tambah objek ke `TEMPLATES` di `lib/prompt/templates.ts` |
| Mengubah negatif bawaan | `BASE_NEGATIVES` / `GENRE_NEGATIVES` di `lib/prompt/negatives.ts` |
| Menambah frasa klise atau mood generik | `LYRIC_CLICHES` / `GENERIC_MOODS` di `lib/prompt/suggestions.ts` |
| Menyesuaikan batas karakter | `PLATFORMS` di `lib/prompt/platforms.ts` |
| Menambah platform (mis. Stable Audio) | Tambah ke tipe `Platform`, `PLATFORMS`, dan satu fungsi `renderX()` di `generator.ts` |

> **Catatan batas karakter:** batas Suno di `platforms.ts` (style 1000, lyrics 5000) mengikuti versi model terbaru yang saya ketahui dan bisa berubah. Aplikasi hanya memberi peringatan, tidak memotong teks. Verifikasi di versi yang kamu pakai.

## Penyimpanan

Semua data tersimpan di `localStorage` browser:
- `aspb-draft` — isi form terakhir (autosave; refresh tidak menghilangkan pekerjaan).
- `aspb-history` — maksimal 50 prompt terakhir. Prompt disimpan otomatis saat Copy, atau manual via tombol Simpan. Prompt identik berturut-turut tidak disimpan dua kali.

Data tidak pernah keluar dari browser. Menghapus data situs di browser akan menghapus riwayat.
