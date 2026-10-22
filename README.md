# WEB BPJS KETENAGAKERJAAN

Form web untuk **koreksi data peserta BPJS Ketenagakerjaan**. Jawaban masuk ke **Google Spreadsheet**, dan foto/scan KTP tersimpan di **Google Drive**. Tampilannya bernuansa hijau, dengan kartu ringkasan yang ikut terisi saat Anda mengisi form.

Dirancang dari template `Template_Koreksi_bpjstk_JST.xlsx`: urutan dan nama kolom di Spreadsheet sama dengan template tersebut.

---

## Isi paket

| File | Fungsi |
|---|---|
| `index.html` | Halaman form (satu file, banner sudah tertanam, tidak perlu server) |
| `Code.gs` | Kode Google Apps Script: penerima data, penyimpan ke Spreadsheet dan Drive |
| `README.md` | Panduan ini |

---

## Alur form

**Langkah 1 — Data peserta** (semua wajib diisi)

| Kolom | Aturan |
|---|---|
| NPP | Otomatis huruf besar |
| Nama | Teks |
| No. Peserta | Teks (boleh ada huruf) |
| NIK KTP | Tepat **16 digit angka** |
| No. HP | Angka, 8–20 karakter |
| Email | Format email valid |
| COU Tempat Kerja | Teks dengan saran dari daftar COU di template (boleh ketik sendiri) |

**Langkah 2 — Koreksi data** (semua wajib diisi)

1. Pilih **satu** data yang mau diubah: *Nama, No. KTP, Tempat Tanggal Lahir, Tanggal Lahir,* atau *Ibu Kandung*.
2. Isi dua kolom yang muncul sesuai pilihan. Pola labelnya sama untuk semua pilihan:
   - **Yang Tertulis *[pilihan]* di JMO**
   - **Yang Seharusnya Tertulis *[pilihan]* di JMO**

   Contoh, pilih **Nama** → isi **Yang Tertulis Nama di JMO** dan **Yang Seharusnya Tertulis Nama di JMO**. Pilihan lain tidak ikut diisi.
3. Upload **KTP** (wajib): PDF atau gambar, maksimal 10 MB. Foto di atas ±0,9 MB dikompres otomatis di browser sebelum dikirim.

Aturan tambahan:
- *Seharusnya* tidak boleh sama dengan *Tertulis*.
- Pada pilihan **No. KTP**, *Seharusnya* harus 16 digit; *Tertulis* 10–20 digit.
- Pada pilihan **Tanggal Lahir**, tanggal dipilih lewat kalender dan disimpan seperti di template, contoh `06 Maret 2002`.
- Satu pengiriman hanya untuk satu jenis koreksi. Untuk koreksi lain, klik **Koreksi data lain (peserta sama)** setelah terkirim: data peserta dan KTP tetap terisi, tinggal pilih jenis koreksi berikutnya.

---

## Kolom di Spreadsheet

Sheet **Respon** dibuat otomatis saat data pertama masuk, dengan kolom berikut (urut dari kiri):

`Timestamp` · `NPP` · `NAMA` · `NO. PESERTA` · `NIK KTP` · `NO. HP` · `EMAIL` · `COU TEMPAT KERJA` · `TERTULIS NAMA` · `SEHARUSNYA NAMA` · `TERTULIS KTP` · `SEHARUSNYA KTP` · `TERTULIS TEMPAT TANGGAL LAHIR` · `SEHARUSNYA TEMPAT TANGGAL LAHIR` · `TERTULIS TANGGAL LAHIR` · `SEHARUSNYA TANGGAL LAHIR` · `TERTULIS IBU KANDUNG` · `SEHARUSNYA IBU KANDUNG` · `JENIS KOREKSI` · `UPLOAD KTP`

- Hanya pasangan kolom `TERTULIS ...` / `SEHARUSNYA ...` yang dipilih peserta yang terisi, sisanya kosong.
- `JENIS KOREKSI` dan `UPLOAD KTP` adalah kolom tambahan di luar template. `UPLOAD KTP` berisi link file di Drive.
- Jika upload ke Drive gagal, data teks tetap masuk dan kolom `CATATAN ERROR` (muncul otomatis di sisi kanan) berisi penyebabnya.
- Semua kolom disimpan sebagai **teks**, sehingga NIK 16 digit tidak berubah jadi angka ilmiah dan No. HP berawalan 0 tidak kehilangan angka nol.

---

## Pemasangan dari awal

### A. Siapkan Spreadsheet dan Apps Script

1. Buka [sheets.google.com](https://sheets.google.com), buat Spreadsheet **baru** (misalnya "Database Koreksi BPJS TK").
2. Klik menu **Ekstensi → Apps Script**.
3. Hapus semua kode bawaan, tempel seluruh isi `Code.gs`, lalu simpan (Ctrl+S).
4. **Beri izin Drive dan Spreadsheet:** pilih fungsi **`authorize`** di dropdown atas editor, klik **Jalankan**, lalu klik **Tinjau izin** → pilih akun → **Lanjutan / Advanced** → **Buka ... (tidak aman) / Go to ... (unsafe)** → **Izinkan**. Peringatan "Google belum memverifikasi aplikasi" normal untuk script buatan sendiri.
5. Klik **Terapkan → Deployment baru**, klik ikon roda gigi, pilih **Aplikasi web**.
   - **Jalankan sebagai:** *Saya (Me)*
   - **Siapa yang memiliki akses:** *Siapa saja (Anyone)*
6. Klik **Terapkan**, lalu salin **URL aplikasi web** yang berakhiran **`/exec`**.

### B. Hubungkan form ke Apps Script

1. Buka `index.html` dengan Notepad atau VS Code.
2. Cari baris berikut di bagian `<script>` dan ganti dengan URL `/exec` tadi, lalu simpan:

   ```js
   const GAS_URL = "PASTE_URL_WEB_APP_GAS_DI_SINI";
   ```

### C. Jalankan di komputer (lokal)

Cara termudah: **klik dua kali `index.html`** sampai terbuka di browser (alamatnya `file:///...`). Karena pengiriman memakai teknik anti-CORS, form tetap bisa mengirim data dari file lokal tanpa server.

Alternatif lewat `localhost`:
- **VS Code:** pasang ekstensi *Live Server*, klik kanan `index.html` → *Open with Live Server*.
- **Python:** jalankan `python -m http.server 8000` di folder file, lalu buka `http://localhost:8000`.

> Font (Sora dan Plus Jakarta Sans) dimuat dari Google Fonts. Tanpa internet, form tetap berfungsi dengan font bawaan perangkat.

### D. Tes

1. Buka URL `/exec` di browser. Hasil yang benar: `{"ok":true,"message":"Web app aktif","spreadsheet":"Terhubung ke Spreadsheet: ..."}`.
2. *(Opsional)* Di editor Apps Script, jalankan fungsi **`tesTulis`**. Satu baris contoh bernama "TES" muncul di sheet **Respon**. Hapus baris itu setelahnya.
3. Isi form sampai selesai dan klik **Kirim**. Tunggu sampai layar "Terima kasih" dan cap **TERKIRIM** muncul.
4. Cek Spreadsheet (baris baru) dan Drive (folder **Upload KTP BPJS TK** berisi file KTP).

> Halaman form menampilkan layar sukses begitu request terkirim, karena browser tidak bisa membaca balasan dari Apps Script pada mode anti-CORS. Karena itu, **selalu cek Spreadsheet** untuk memastikan data benar-benar masuk.

---

## Pengaturan

### Di `index.html` (bagian `PENGATURAN`)

| Variabel | Fungsi |
|---|---|
| `GAS_URL` | URL web app Apps Script (berakhiran `/exec`) |
| `MAX_FILE_MB` | Batas ukuran file KTP (default 10) |
| `COU_LIST` | Daftar saran COU (diambil dari template Excel) |
| `COU_STRICT` | `true` = COU wajib salah satu dari daftar; `false` = boleh ketik bebas |
| `DONE_HTML` | Teks pada layar setelah berhasil kirim. Tambahkan nomor telepon atau email PIC di sini |
| `BASE` / `KOR` | Definisi kolom data peserta dan pilihan jenis koreksi |

### Di `Code.gs` (bagian atas file)

| Variabel | Fungsi |
|---|---|
| `SHEET_NAME` | Nama sheet tujuan (default `Respon`) |
| `SPREADSHEET_ID` | Isi jika script dibuat di luar Spreadsheet (ID ada di URL, antara `/d/` dan `/edit`) |
| `ROOT_FOLDER_NAME` | Nama folder Drive untuk file KTP. Kosongkan (`""`) untuk menyimpan langsung di My Drive |
| `DRIVE_FOLDER_ID` | Isi bila ingin memakai folder Drive tertentu (ID dari URL folder) |
| `TZ` | Zona waktu Timestamp (default `Asia/Jakarta`) |

### Setelah mengubah `Code.gs`

Deploy ulang agar perubahan aktif: **Terapkan → Kelola deployment → ikon pensil → Versi: Versi baru → Terapkan**. URL `/exec` tidak berubah. Tanpa langkah ini, URL lama masih menjalankan kode lama.

---

## Pemecahan masalah

| Gejala | Penyebab dan solusi |
|---|---|
| Muncul pesan "GAS_URL belum diisi" | Baris `GAS_URL` di `index.html` masih placeholder atau belum disimpan |
| Layar sukses muncul, tetapi Spreadsheet kosong | Pastikan URL berakhiran `/exec` (bukan `/dev`), akses deployment **Siapa saja**, dan sudah deploy **versi baru** setelah mengubah kode. Cek juga halaman **Eksekusi** di Apps Script untuk melihat pesan error |
| Kolom `CATATAN ERROR` berisi "tidak memiliki izin ... DriveApp" | Jalankan fungsi `authorize` dan beri izin Drive, lalu deploy versi baru |
| URL `/exec` menampilkan "TIDAK terhubung ke Spreadsheet" | Script dibuat dari script.google.com, bukan dari dalam Spreadsheet. Isi `SPREADSHEET_ID` di `Code.gs` |
| Data masuk di baris yang jauh di bawah | Sheet memakai fitur **Tabel**. Kode ini sudah menulis ke baris kosong pertama, jadi pastikan memakai `Code.gs` terbaru |
| Pengiriman gagal untuk file besar | Total kiriman terlalu besar. Perkecil file atau gunakan foto (otomatis dikompres) |

---

## Catatan keamanan dan privasi

- KTP dan NIK adalah **data pribadi**. File di Drive bersifat **privat** (hanya pemilik akun script). Bagikan folder hanya ke petugas yang berwenang.
- Spreadsheet dan folder Drive sebaiknya tidak dibagikan sebagai "siapa saja yang memiliki link".
- Siapa pun yang memiliki URL `/exec` bisa mengirim data ke Spreadsheet. Sebarkan link halaman form hanya ke pengguna yang dituju, dan pantau Spreadsheet secara berkala. Form sudah memakai perangkap anti-bot (honeypot) dan validasi kolom wajib di sisi server.
- Setelah data selesai diproses, pertimbangkan menghapus file KTP dan baris data yang tidak lagi diperlukan.
