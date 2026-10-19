const CFG = {
  MASTER_ID: '1dFZc8wZcdcSw1IoSVXsM669SZjtphiY61HNx2Z2GczU',
  SPP_ID: '12K8bHPhPhe8RR4LHkIaf1SF4T8Lu3DH0jyZ4_ug6Ndo',
  BULETIN_ID: '1SbL5yUstYKAV8v8Jph7UKSKnipAaJx8A',
  KEHADIRAN_ID: '1AnvD2_p5GGD7Ljl3d3h3xQzELikAs1Je',
  MASTER_SHEET: 'MASTER ALUMNI',
  MAPPING_SPP_SHEET: 'MAPPING SPP INFAQ',
  // HANYA empat sheet ini yang menjadi sumber daftar alumni SPP/Infaq.
  // Rekap Kuitansi (SEP/OKT/dst) BUKAN sumber daftar alumni.
  SPP_SHEETS: ['Rekap SPP 25', 'Rekap SPP 26', 'Rekap SPP 27', 'Rekap Infaq 26'],
  INFAQ_SHEETS: ['Rekap Infaq 26']
};

// Mapping nama pendek SPP/Infaq -> ID D1 yang SUDAH DIKONFIRMASI pemilik data.
// Mengalahkan mapping lain. Hanya dipakai jika ID-nya memang ada di Master D1.
const CONFIRMED_SPP = {
  'AFRIL':  'SDA-KN1-00059',  // AFRILLA AYU NURHAYATI
  'FISA':   'SDA-KN1-00250',  // AISYAH NUR RAMADHANIA FISABILILLAH
  'AKBAR':  'SDA-KN3-00164',  // AKBAR NURRAZAQ
  'AKMAL':  'SDA-KN1-00247',  // AKMAL DWI PUTRA
  'ANISA':  'SDA-KN1-00061',  // ANISA WIHAYATI
  'CANDRA': 'SDA-KN3-00045',  // CANDRA RIAN HERMAWAN
  'DEWI':   'SDA-KN1-00252',  // SALSABILA IZZATI DEWI
  'DIANA':  'SDA-KN3-00169',  // DIANA EVITA SARI
  'RAGIL':  'SDA-AN2D-00153', // RAGIL
  'REVA':   'SDA-KN1-00175',  // REVA TAZKIYAH A. R.
  'RIZKI':  'SDA-KN1-00115'   // RIZKI SETIAWAN
};

const BULAN_ = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
const NON_PERSON_ = /^(TOTAL|JUMLAH|SUB TOTAL|SUBTOTAL|NAMA|NO)$/;

let _CACHE_MASTER = null; // satu kali baca Master per eksekusi

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Database Alumni D1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// =======================
// DASHBOARD
// =========================
function ctx_() {
  return {master: loadMaster_(), spp: loadSPP_(), bul: loadBuletin_(), keh: loadKehadiran_()};
}

function emptyKeh_() { return {participant: null, events: [], sm3: null, hadis: null}; }

// Detail satu alumni. id = ID D1 (kosong untuk nama SPP/Infaq yang belum terpetakan).
function buildDetail_(c, id, person) {
  const m = id ? c.master.byId[id] : null;
  const sppAll = id ? (c.spp.byId[id] || []) : (person ? person.sources : []);
  const k = (id && c.keh.byId[id]) || emptyKeh_();
  const bulRows = id ? (c.bul.byId[id] || []) : [];
  const profile = m ? {
    id: m.id, name: m.nama, kelas: m.kelas, sekolah: m.sekolah, tingkat: m.tingkat, fuppi: m.fuppi,
    namaPendek: m.namaPendek, namaBuletin: m.namaBuletin, namaKehadiran: m.namaKehadiran
  } : {
    id: '', name: person ? person.nama : '', kelas: '', sekolah: '', tingkat: '',
    fuppi: person ? (person.fuppi || '') : '',
    namaPendek: person ? person.namaSumber : '', namaBuletin: '', namaKehadiran: ''
  };
  return {
    profile,
    spp: sppAll.filter(r => r.paid),
    sppAll: sppAll,
    buletin: bulRows,
    kehadiran: {participant: k.participant, events: k.events, sm3: k.sm3, hadis: k.hadis}
  };
}

function getDashboard() {
  const c = ctx_();

  // Daftar alumni = nama yang ADA di Rekap SPP 25/26/27 + Rekap Infaq 26.
  // Master D1 hanya untuk menghubungkan nama ke ID D1 (tanpa menebak).
  // Detail tiap alumni ikut dikirim sekali, jadi klik nama langsung tampil.
  const alumni = c.spp.people.map(p => {
    const id = p.id || '';
    const m = id ? c.master.byId[id] : null;
    const d = buildDetail_(c, id, p);
    let sppBulan = 0, infaqKali = 0, infaqTotal = 0;
    d.sppAll.forEach(r => {
      sppBulan += r.sppBulan || 0;
      infaqKali += r.infaqKali || 0;
      infaqTotal += r.total || 0;
    });
    return {
      key: id || ('NAMA:' + p.nama),
      id,
      terpetakan: !!id,
      nama: p.nama,
      namaSumber: p.namaSumber,
      kelas: m ? m.kelas : '',
      sekolah: m ? m.sekolah : '',
      tingkat: m ? m.tingkat : '',
      fuppi: p.fuppi || (m ? m.fuppi : ''),
      status: m ? m.status : (id ? '' : 'Belum terpetakan ke Master D1'),
      sppCount: d.spp.length,
      sppBulan, infaqKali, infaqTotal,
      buletinCount: d.buletin.length,
      kehadiranCount: d.kehadiran.events.length,
      detail: d
    };
  });

  return {
    alumni,
    counts: {
      alumni: alumni.length,
      spp: alumni.filter(x => x.sppCount > 0).length,
      buletin: alumni.filter(x => x.buletinCount > 0).length,
      kehadiran: alumni.filter(x => x.kehadiranCount > 0).length,
      sppTransaksi: alumni.reduce((a, x) => a + x.sppBulan + x.infaqKali, 0),
      infaqTotal: alumni.reduce((a, x) => a + x.infaqTotal, 0),
      kehadiranEvent: alumni.reduce((a, x) => a + x.kehadiranCount, 0),
      belumTerpetakan: alumni.filter(x => !x.id).length
    },
    sourceStatus: {
      master: CFG.MASTER_ID,
      spp: CFG.SPP_ID,
      sppSheets: CFG.SPP_SHEETS,
      buletin: CFG.BULETIN_ID,
      kehadiran: CFG.KEHADIRAN_ID,
      belumTerpetakan: alumni.filter(x => !x.id).map(x => x.namaSumber),
      peringatan: c.master.warnings.concat(c.spp.warnings)
    }
  };
}

// ========================
// PROFILE (cadangan; UI memakai detail dari getDashboard)
// key = ID D1, atau 'NAMA:<nama sumber>' untuk nama yang belum punya ID
// =========================
function getProfile(key) {
  const c = ctx_();
  const k0 = String(key || '').trim();
  if (k0.indexOf('NAMA:') === 0) {
    const nk = normName_(k0.slice(5));
    const p = c.spp.people.find(x => !x.id && (normName_(x.nama) === nk || x.names.some(n => normName_(n) === nk)));
    if (!p) throw new Error('Nama tidak ditemukan di sumber SPP/Infaq: ' + k0.slice(5));
    return buildDetail_(c, '', p);
  }
  if (!c.master.byId[k0]) throw new Error('Alumni ID tidak ditemukan: ' + k0);
  return buildDetail_(c, k0, null);
}

// ========================
// MASTER
// =========================
function loadMaster_() {
  if (_CACHE_MASTER) return _CACHE_MASTER;
  const ssM = SpreadsheetApp.openById(CFG.MASTER_ID);
  const sh = ssM.getSheetByName(CFG.MASTER_SHEET);
  if (!sh) throw new Error('Sheet MASTER ALUMNI tidak ditemukan.');
  // Header Master = baris yang memuat "ID" dan "Nama D1" (baris 2 berisi teks 'nama' kecil, bukan header).
  const data = getData_(sh, ['ID', 'Nama D1']);
  const h = headerMap_(data.headers);
  const rows = [];
  const byId = {};
  const warnings = [];
  const aliasMaps = {spp: {}, bul: {}, keh: {}};

  data.rows.forEach(r => {
    const id = String(val_(r, h, 'ID') || '').trim();
    if (!id || id.toUpperCase() === 'ID') return;
    const m = {
      id: id,
      nama: val_(r, h, 'Nama D1'),
      kelas: val_(r, h, 'Kelas'),
      sekolah: val_(r, h, 'Sekolah'),
      tingkat: val_(r, h, 'Tingkat'),
      fuppi: val_(r, h, 'FUPPI Kehadiran') || val_(r, h, 'FUPPI Buletin'),
      status: val_(r, h, 'Status Kehadiran') || val_(r, h, 'Status Buletin'),
      namaPendek: val_(r, h, 'Nama Pendek SPP/Infaq'),
      namaBuletin: val_(r, h, 'Nama Buletin'),
      namaKehadiran: val_(r, h, 'Nama Kehadiran')
    };
    rows.push(m);
    byId[m.id] = m;
    addAlias_(aliasMaps.spp, m.namaPendek, m.id);
    addAlias_(aliasMaps.bul, m.namaBuletin, m.id);
    addAlias_(aliasMaps.keh, m.namaKehadiran, m.id);
  });

  // Mapping terkonfirmasi di sheet MAPPING SPP INFAQ (hanya status "Pasti" + ID valid di Master).
  const shMap = ssM.getSheetByName(CFG.MAPPING_SPP_SHEET);
  if (shMap) {
    const d2 = getData_(shMap, ['Nama Pendek SPP/Infaq', 'ID D1']);
    const h2 = headerMap_(d2.headers);
    d2.rows.forEach(r => {
      const alias = val_(r, h2, 'Nama Pendek SPP/Infaq');
      const id = String(val_(r, h2, 'ID D1') || '').trim();
      const status = norm_(val_(r, h2, 'Status'));
      if (!alias || !id || status !== 'pasti') return;
      if (byId[id]) addAlias_(aliasMaps.spp, alias, id);
    });
  }

  // Mapping yang dikonfirmasi pemilik: mengalahkan semua mapping lain.
  Object.keys(CONFIRMED_SPP).forEach(alias => {
    const id = CONFIRMED_SPP[alias];
    if (byId[id]) {
      aliasMaps.spp[normName_(alias)] = [id];
    } else {
      warnings.push('Mapping terkonfirmasi ' + alias + ' -> ' + id + ' dilewati: ID tidak ada di Master D1.');
    }
  });

  _CACHE_MASTER = {rows, byId, aliases: aliasMaps, warnings};
  return _CACHE_MASTER;
}

function addAlias_(map, alias, id) {
  const n = normName_(alias);
  if (!n) return;
  if (!map[n]) map[n] = [];
  if (map[n].indexOf(id) < 0) map[n].push(id);
}

// ========================
// SPP / INFAQ
// Sumber = Rekap SPP 25 / 26 / 27 + Rekap Infaq 26 (bukan Rekap Kuitansi).
// Satu baris sumber per nama per sheet. Nama -> ID lewat Master D1 saja (exact alias).
// Satu ID D1 = satu alumni (nama pendek berbeda yang mengarah ke ID sama digabung).
// ========================
function loadSPP_() {
  const master = loadMaster_();
  const ss = SpreadsheetApp.openById(CFG.SPP_ID);
  const byId = {};
  const peopleMap = {};
  const warnings = [];

  CFG.SPP_SHEETS.forEach(sheetName => {
    const sh = ss.getSheetByName(sheetName);
    if (!sh) { warnings.push('Sheet sumber tidak ditemukan: ' + sheetName); return; }

    const isInfaq = CFG.INFAQ_SHEETS.indexOf(sheetName) >= 0;
    const data = getData_(sh, ['NAMA']);
    const h = headerMap_(data.headers);
    let cNama = firstCol_(h, ['Nama 1', 'Nama', 'Nama Alumni']);
    if (cNama === null) cNama = 1;

    data.rows.forEach(r => {
      const nama = String(r[cNama] || '').trim();
      if (!nama || NON_PERSON_.test(normName_(nama))) return;

      const id = uniqueId_(master.aliases.spp, nama);
      const row = {
        sumber: sheetName,
        nama: nama,
        id: id,
        fuppi: getCol_(r, h, ['FUPPI', 'Fuppi', 'Asal Fuppi'])
      };
      if (isInfaq) fillInfaq_(row, r, data.headers, h, sheetName);
      else fillSpp_(row, r, data.headers, h, sheetName);

      const nk = normName_(nama);
      if (!peopleMap[nk]) peopleMap[nk] = {nama: nama, id: id, fuppi: row.fuppi, sources: []};
      const person = peopleMap[nk];
      if (!person.id && id) person.id = id;
      if (!person.fuppi && row.fuppi) person.fuppi = row.fuppi;
      person.sources.push(row);

      if (id) {
        if (!byId[id]) byId[id] = [];
        byId[id].push(row);
      }
    });
  });

  // Gabungkan nama-nama yang mengarah ke ID yang sama (ID = primary key).
  const merged = {};
  const order = [];
  Object.keys(peopleMap).forEach(nk => {
    const p = peopleMap[nk];
    const key = p.id ? 'ID:' + p.id : 'N:' + nk;
    if (!merged[key]) {
      merged[key] = {nama: p.nama, id: p.id, fuppi: p.fuppi, sources: [], names: []};
      order.push(key);
    }
    const g = merged[key];
    if (!g.fuppi && p.fuppi) g.fuppi = p.fuppi;
    g.names.push(p.nama);
    p.sources.forEach(s => g.sources.push(s));
  });
  const people = order.map(k => {
    const g = merged[k];
    g.namaSumber = g.names.join(' / ');
    if (g.names.length > 1) {
      warnings.push('Beberapa nama sumber digabung ke satu ID ' + g.id + ': ' + g.namaSumber);
    }
    return g;
  });

  return {byId, people, warnings};
}

function parseRp_(s) {
  let t = String(s == null ? '' : s).replace(/Rp/gi, '').replace(/\s/g, '');
  if (!t || /^-+$/.test(t)) return 0;
  t = t.replace(/,\d{1,2}$/, '').replace(/[^0-9]/g, '');
  return t ? parseInt(t, 10) : 0;
}

function fmtRp_(n) {
  return 'Rp ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function tahunDari_(sheetName) {
  const m = /(\d{2})\s*$/.exec(String(sheetName));
  return m ? '20' + m[1] : '';
}

// Rekap SPP: satu sel terisi pada kolom bulan = satu bulan SPP tercatat.
function fillSpp_(row, r, headers, h, sheetName) {
  const bulan = [];
  let n = 0;
  let lastDate = '';
  BULAN_.forEach(b => {
    const c = h[b];
    const v = c === undefined ? '' : String(r[c] || '').trim();
    bulan.push({bulan: b.charAt(0).toUpperCase() + b.slice(1), tanggal: v});
    if (v) { n++; lastDate = v; }
  });
  const terakhir = getCol_(r, h, ['SPP Terakhir']);
  row.tipe = 'SPP';
  row.tahun = tahunDari_(sheetName);
  row.bulanList = bulan;
  row.sppTerakhir = terakhir;
  row.paid = n > 0;
  row.jenisBayar = 'SPP';
  row.tanggal = lastDate;
  row.nama1 = row.nama;
  row.nama2 = '-';
  row.nominal = '';
  row.spp = n;
  row.infaq = 0;
  row.sppBulan = n;
  row.infaqKali = 0;
  row.total = 0;
  row.ket1 = n ? 'Bulan tercatat: ' + bulan.filter(x => x.tanggal).map(x => x.bulan).join(', ') : 'Belum ada pembayaran tercatat';
  row.ket2 = terakhir ? 'SPP terakhir: ' + terakhir : '';
}

// Rekap Infaq: nominal per program/bulan; TOTAL dipakai bila ada.
function fillInfaq_(row, r, headers, h, sheetName) {
  const skip = /^(no|nama|total|frek infaq)$/;
  const items = [];
  let sum = 0;
  headers.forEach((head, i) => {
    if (!head || skip.test(norm_(head))) return;
    const n = parseRp_(r[i]);
    if (n > 0) { items.push({nama: head.trim(), nominal: n}); sum += n; }
  });
  const totalCol = firstCol_(h, ['TOTAL']);
  const total = totalCol === null ? sum : (parseRp_(r[totalCol]) || sum);
  const frek = String(getCol_(r, h, ['Frek Infaq']) || '').trim();
  row.tipe = 'Infaq';
  row.tahun = tahunDari_(sheetName);
  row.items = items;
  row.frek = frek;
  row.paid = total > 0;
  row.jenisBayar = 'Infaq';
  row.tanggal = '';
  row.nama1 = row.nama;
  row.nama2 = '-';
  row.nominal = total > 0 ? fmtRp_(total) : '';
  row.spp = 0;
  row.infaq = items.length;
  row.sppBulan = 0;
  row.infaqKali = items.length;
  row.total = total;
  row.ket1 = items.length ? items.map(x => x.nama + ' ' + fmtRp_(x.nominal)).join('; ') : 'Belum ada infaq tercatat';
  row.ket2 = frek ? 'Frekuensi infaq: ' + frek : '';
}

// ========================
// BULETIN
// Sumber = Buku Kendali, satu baris per alumni. Hanya exact alias dari Master D1.
// ========================
function loadBuletin_() {
  const master = loadMaster_();
  const ss = SpreadsheetApp.openById(CFG.BULETIN_ID);
  const byId = {};
  let sh = ss.getSheetByName('Buku Kendali');
  if (!sh) {
    sh = ss.getSheets().find(s => {
      const d = getData_(s, ['Nama Alumni']);
      return firstCol_(headerMap_(d.headers), ['Nama Alumni']) !== null;
    });
  }
  if (!sh) return {byId};

  const data = getData_(sh, ['Nama Alumni']);
  const h = headerMap_(data.headers);
  const cNama = firstCol_(h, ['Nama Alumni']);
  if (cNama === null) return {byId};

  // Kolom edisi: header "1".."52" atau "Edisi 1".."Edisi 52" (bukan "Edisi Terakhir").
  const edisiCols = [];
  data.headers.forEach((hd, i) => {
    const mm = /^(?:edisi\s*)?(\d{1,2})$/i.exec(String(hd).trim());
    if (mm && +mm[1] >= 1 && +mm[1] <= 52) edisiCols.push({no: +mm[1], i: i});
  });

  data.rows.forEach(r => {
    const nama = String(r[cNama] || '').trim();
    const id = uniqueId_(master.aliases.bul, nama);
    if (!id) return;
    const edisi = edisiCols.map(e => ({no: e.no, nilai: String(r[e.i] == null ? '' : r[e.i]).trim()}));
    if (!byId[id]) byId[id] = [];
    byId[id].push({
      sumber: sh.getName(),
      nama: nama,
      fuppi: getCol_(r, h, ['FUPPI']),
      status: getCol_(r, h, ['Status Buletin']),
      petugas: getCol_(r, h, ['Petugas']),
      karir: getCol_(r, h, ['KARIR']),
      edisiTerakhir: getCol_(r, h, ['Edisi Terakhir']),
      edisi: edisi,
      edisiTerisi: edisi.filter(e => e.nilai && e.nilai !== '-').length
    });
  });
  return {byId};
}

// =========================
// KEHADIRAN
// Identitas peserta = Database_Peserta (BUKAN event).
// Event kehadiran = baris Database_SM.
// Ringkasan = Kehadiran_SM3 / Kehadiran_Hadis.
// =========================
function loadKehadiran_() {
  const master = loadMaster_();
  const ss = SpreadsheetApp.openById(CFG.KEHADIRAN_ID);
  const byId = {};
  const slot = id => byId[id] || (byId[id] = {participant: null, events: [], sm3: null, hadis: null});

  ss.getSheets().forEach(sh => {
    const name = sh.getName();
    if (['Database_Peserta', 'Database_SM', 'Kehadiran_SM3', 'Kehadiran_Hadis'].indexOf(name) < 0) return;
    const data = getData_(sh, ['Nama']);
    const h = headerMap_(data.headers);
    const cNama = firstCol_(h, ['Nama']);
    if (cNama === null) return;

    data.rows.forEach(r => {
      const nama = String(r[cNama] || '').trim();
      const id = uniqueId_(master.aliases.keh, nama);
      if (!id) return;
      const s = slot(id);

      if (name === 'Database_Peserta') {
        s.participant = {
          sumber: name, nama,
          fuppi: getCol_(r, h, ['Fuppi']),
          tingkat: getCol_(r, h, ['Tingkatan']),
          sekolah: getCol_(r, h, ['Asal Sekolah'])
        };
      } else if (name === 'Database_SM') {
        s.events.push({
          sumber: name,
          fuppi: getCol_(r, h, ['FUPPI', 'Fuppi']),
          nama,
          tingkat: getCol_(r, h, ['Tingkatan']),
          materi: getCol_(r, h, ['Materi']),
          pembahasan: getCol_(r, h, ['Pembahasan']),
          tm: getCol_(r, h, ['TM']),
          tanggal: getCol_(r, h, ['Tanggal']),
          program: getCol_(r, h, ['Program']),
          bulan: getCol_(r, h, ['Bulan'])
        });
      } else {
        const summary = {};
        data.headers.forEach((head, i) => { if (head) summary[head] = r[i]; });
        if (name === 'Kehadiran_SM3') s.sm3 = summary; else s.hadis = summary;
      }
    });
  });

  return {byId};
}

// =========================
// HELPERS
// ========================
// mustHave: daftar nama kolom yang harus ada bersama-sama di baris header.
function getData_(sh, mustHave) {
  const values = sh.getDataRange().getDisplayValues();
  if (!values.length) return {headers: [], rows: []};
  let headerRow = -1;
  const lim = Math.min(values.length, 10);
  if (mustHave && mustHave.length) {
    for (let i = 0; i < lim; i++) {
      const cells = values[i].map(x => norm_(x));
      if (mustHave.every(k => cells.indexOf(norm_(k)) >= 0)) { headerRow = i; break; }
    }
  }
  if (headerRow < 0) {
    headerRow = 0;
    for (let i = 0; i < lim; i++) {
      const row = values[i].map(x => String(x).trim());
      if (row.some(x => /^Nama Alumni$|^Nama$|^Tanggal$|^NO$|^No\.$/i.test(x))) { headerRow = i; break; }
    }
  }
  return {headers: values[headerRow].map(x => String(x).trim()), rows: values.slice(headerRow + 1)};
}

function headerMap_(headers) {
  const m = {};
  headers.forEach((x, i) => { if (x && m[norm_(x)] === undefined) m[norm_(x)] = i; });
  return m;
}

function firstCol_(map, keys) {
  for (const k of keys) { const n = norm_(k); if (map[n] !== undefined) return map[n]; }
  return null;
}

function val_(r, map, key) { const i = map[norm_(key)]; return i === undefined ? '' : r[i]; }
function getCol_(r, map, keys) { const i = firstCol_(map, keys); return i === null ? '' : r[i]; }

// Exact alias saja. Hanya mengembalikan ID bila alias menunjuk TEPAT satu ID;
// ambigu / tidak ada -> '' (tidak menebak).
function uniqueId_(aliasMap, name) {
  const n = normName_(name);
  if (!n) return '';
  const ids = aliasMap[n] || [];
  return ids.length === 1 ? ids[0] : '';
}

function normName_(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function norm_(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
