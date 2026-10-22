/**
 * Google Apps Script — penerima data WEB BPJS KETENAGAKERJAAN (form koreksi data peserta)
 *  - Data teks   -> Google Spreadsheet (sheet "Respon"), urutan kolom sama dengan template Excel
 *  - File KTP    -> Google Drive (1 folder), link file ditulis di kolom "UPLOAD KTP"
 *
 * Cara pakai:
 * 1. Buka Spreadsheet > Extensions (Ekstensi) > Apps Script > tempel kode ini > simpan.
 * 2. Pilih fungsi "authorize" di toolbar > Jalankan > izinkan akses (Spreadsheet + Drive).
 * 3. Deploy (Terapkan) > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * 4. Salin URL "/exec" ke GAS_URL di index.html.
 * Setelah mengubah kode: Deploy > Manage deployments > pensil > New version > Deploy.
 */

const SHEET_NAME       = 'Respon';                    // nama sheet tujuan (dibuat otomatis)
const SPREADSHEET_ID   = '';                          // kosongkan bila script dibuat dari dalam Spreadsheet
const DRIVE_FOLDER_ID  = '';                          // ID folder tujuan upload (opsional)
const ROOT_FOLDER_NAME = 'Upload KTP BPJS TK';        // dipakai bila DRIVE_FOLDER_ID kosong; "" = simpan di My Drive
const TZ               = 'Asia/Jakarta';

// Urutan kolom = template Excel (Template_Koreksi_bpjstk_JST.xlsx) + 2 kolom tambahan di akhir
const HEADERS = [
  'Timestamp',
  'NPP', 'NAMA', 'NO. PESERTA', 'NIK KTP', 'NO. HP', 'EMAIL', 'COU TEMPAT KERJA',
  'TERTULIS NAMA', 'SEHARUSNYA NAMA',
  'TERTULIS KTP', 'SEHARUSNYA KTP',
  'TERTULIS TEMPAT TANGGAL LAHIR', 'SEHARUSNYA TEMPAT TANGGAL LAHIR',
  'TERTULIS TANGGAL LAHIR', 'SEHARUSNYA TANGGAL LAHIR',
  'TERTULIS IBU KANDUNG', 'SEHARUSNYA IBU KANDUNG',
  'JENIS KOREKSI', 'UPLOAD KTP'
];
const REQUIRED = ['NPP', 'NAMA', 'NO. PESERTA', 'NIK KTP', 'NO. HP', 'EMAIL', 'COU TEMPAT KERJA'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const body = parseBody_(e);
    if (body._hp) return out_({ ok: true });                       // honeypot anti-bot

    const data = Object.assign({}, body.fields || {});
    const kosong = REQUIRED.filter(k => !String(data[k] || '').trim());
    if (kosong.length) return out_({ ok: false, error: 'Kolom wajib kosong: ' + kosong.join(', ') });

    // ---- simpan KTP ke Drive (bila gagal, data teks tetap masuk dan sebabnya dicatat) ----
    const files = body.files || [];
    if (files.length) {
      try {
        const folder = targetFolder_();
        const stamp  = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss');
        files.forEach(f => {
          const ext  = (String(f.filename).match(/\.[A-Za-z0-9]+$/) || [''])[0];
          const name = safe_(data['NPP'] + ' - ' + data['NAMA'] + ' - ' + String(f.field).replace(/^Upload\s+/i, '') + ' - ' + stamp) + ext;
          const blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.mime || 'application/octet-stream', name);
          data[f.field] = folder.createFile(blob).getUrl();
        });
      } catch (fileErr) {
        data['CATATAN ERROR'] = 'Upload file gagal: ' + String(fileErr);
      }
    }

    // ---- tulis ke Spreadsheet ----
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    let headers = [];
    if (sheet.getLastRow() === 0) {
      headers = HEADERS.slice();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e2f4ea');
      sheet.setFrozenRows(1);
    } else {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      while (headers.length && headers[headers.length - 1] === '') headers.pop();
    }
    Object.keys(data).forEach(k => {                               // kolom baru (mis. CATATAN ERROR) ditambah di kanan
      if (headers.indexOf(k) === -1) {
        headers.push(k);
        sheet.getRange(1, headers.length).setValue(k).setFontWeight('bold').setBackground('#e2f4ea');
      }
    });

    const row = headers.map(h => h === 'Timestamp'
      ? Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss')
      : (data[h] !== undefined ? data[h] : ''));

    // Format teks ('@') agar NIK 16 digit, No. HP berawalan 0, dan No. Peserta tidak diubah Sheets menjadi angka
    sheet.getRange(nextRow_(sheet), 1, 1, headers.length).setNumberFormat('@').setValues([row]);
    SpreadsheetApp.flush();

    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Tes cepat: buka URL /exec di browser -> {"ok":true,...}
function doGet() {
  let info = '';
  try {
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    info = ss ? ('Terhubung ke Spreadsheet: ' + ss.getName()) : 'TIDAK terhubung ke Spreadsheet (isi SPREADSHEET_ID)';
  } catch (err) { info = 'Error Spreadsheet: ' + err; }
  return out_({ ok: true, message: 'Web app aktif', spreadsheet: info });
}

// Jalankan dari editor untuk tes tulis ke Spreadsheet (tanpa form)
function tesTulis() {
  const r = doPost({ postData: { contents: JSON.stringify({ fields: {
    'NPP': 'J00000', 'NAMA': 'TES', 'NO. PESERTA': '26000000000', 'NIK KTP': '1234567890123456',
    'NO. HP': '081234567890', 'EMAIL': 'tes@example.com', 'COU TEMPAT KERJA': 'Tes',
    'JENIS KOREKSI': 'Nama', 'TERTULIS NAMA': 'TES SALAH', 'SEHARUSNYA NAMA': 'TES BENAR'
  }, files: [] }) } });
  Logger.log(r.getContent());
}

// Jalankan SEKALI dari editor untuk memberi izin Spreadsheet + Drive.
function authorize() {
  const f = DriveApp.createFolder('tes-izin-hapus-saja');
  f.setTrashed(true);
  if (SPREADSHEET_ID) SpreadsheetApp.openById(SPREADSHEET_ID); else SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('Izin Drive + Spreadsheet sudah aktif.');
}

/* ---------- helper ---------- */

// Cari baris kosong pertama di kolom A (Timestamp), tanpa bergantung pada getLastRow()
function nextRow_(sheet) {
  const max = sheet.getMaxRows();
  if (max < 2) { sheet.insertRowsAfter(max, 1); return 2; }
  const colA = sheet.getRange(2, 1, max - 1, 1).getValues();
  for (let i = 0; i < colA.length; i++) if (colA[i][0] === '') return i + 2;
  sheet.insertRowsAfter(max, 1);
  return max + 1;
}

function parseBody_(e) {
  const txt = e && e.postData && e.postData.contents;
  if (txt) { try { return JSON.parse(txt); } catch (x) {} }
  const fields = {}; const p = (e && e.parameter) || {};
  Object.keys(p).forEach(k => { if (k !== '_hp') fields[k] = p[k]; });
  return { fields: fields, files: [], _hp: p._hp };
}

function targetFolder_() {
  if (DRIVE_FOLDER_ID) return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  if (!ROOT_FOLDER_NAME) return DriveApp.getRootFolder();
  const it = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function safe_(s) { return String(s).replace(/[\\\/:*?"<>|]+/g, '_').trim().slice(0, 100); }

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
