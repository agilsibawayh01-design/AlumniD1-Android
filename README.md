# Alumni D1 — Mobile App + GitHub APK Build

Versi ini disiapkan untuk **Alumni D1** dengan dua bagian:

- `apps-script/` — tampilan Dashboard Mobile-first yang tetap memakai backend Google Apps Script dan Google Sheets.
- Android project — aplikasi APK ringan yang membuka Web App Alumni D1.

## 1. Terapkan tampilan mobile

Di project Google Apps Script Alumni D1 yang sekarang, ganti `Index.html` dengan:

`apps-script/Index.html`

Gunakan `apps-script/Kode.gs` sebagai referensi backend yang sesuai dengan baseline saat ini, lalu **Deploy > Manage deployments > Edit > New version > Deploy**.

> Jangan mengubah ID spreadsheet, mapping D1, atau fungsi backend hanya untuk perubahan tampilan.

## 2. Build APK lewat GitHub

Upload seluruh isi repository ini ke GitHub, branch `main`.

Buka:

`Actions → Build Alumni D1 APK → Run workflow`

Workflow akan menghasilkan artifact:

`AlumniD1-debug-apk`

Di dalam artifact terdapat `app-debug.apk`.

## 3. URL Web App

APK sudah diarahkan ke Web App Alumni D1:

`https://script.google.com/macros/s/AKfycbzc59_MuGVdiqhhBgFGYDZuR8sbDdYbZ2M5EknL4sDmEOd7jo0jdzY_dWfXJnC2juhC/exec`

## Desain

Tampilan mobile memakai prinsip mobile-first: header ringkas, kartu statistik, pencarian yang mudah disentuh, detail alumni berbentuk kartu, navigasi bawah, filter compact, tabel yang tetap dapat digeser horizontal, dan safe-area untuk perangkat modern.

Ikon aplikasi menggunakan ikon custom Alumni D1.
