# Alumni D1 Android

Aplikasi Android ringan untuk membuka Web App Alumni D1 yang terintegrasi dengan Google Sheets / Apps Script.

## URL Web App

URL sudah ditanam di `MainActivity.kt`:

`https://script.google.com/macros/s/AKfycbzc59_MuGVdiqhhBgFGYDZuR8sbDdYbZ2M5EknL4sDmEOd7jo0jdzY_dWfXJnC2juhC/exec`

## Build APK tanpa Android Studio

Project ini sudah dilengkapi GitHub Actions.

1. Upload seluruh isi project ke repository GitHub.
2. Pastikan branch utama bernama `main`.
3. Buka tab **Actions**.
4. Pilih workflow **Build Alumni D1 APK**.
5. Klik **Run workflow**.
6. Setelah selesai, buka hasil workflow dan bagian **Artifacts**.
7. Download `AlumniD1-debug-apk.zip`, extract, lalu ambil `app-debug.apk`.

Workflow juga otomatis berjalan setiap kali ada push ke branch `main`.

## Arsitektur

Android App → WebView → Apps Script Web App → Google Sheets

Spreadsheet Master D1 tetap menjadi sumber data. APK ini hanya menjadi aplikasi pembuka Web App.
