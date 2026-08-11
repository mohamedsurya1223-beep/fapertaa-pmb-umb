function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // 1. GANTI DENGAN ID FOLDER GOOGLE DRIVE ANDA
    const FOLDER_ID = "1ccUD3X9kb1_hBx5zSoFOeHfTQPgnjbqb"; 
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Pendaftaran') || ss.insertSheet('Pendaftaran');

    // Menerima payload JSON dari website
    const payload = JSON.parse(e.postData.contents);
    const applicant = payload.applicant || {};
    const docs = payload.documents || {};

    // Buat Header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Waktu Submit',
        'Nama Lengkap',
        'NIK',
        'Tempat Lahir',
        'Tanggal Lahir',
        'Jenis Kelamin',
        'WhatsApp',
        'Email',
        'Program Studi',
        'Asal Sekolah',
        'Tahun Lulus',
        'Alamat',
        'Link Pasfoto',
        'Link KTP',
        'Link SKL/Ijazah',
        'Link Kartu Keluarga'
      ]);
    }

    // Fungsi Pembantu Upload File ke Drive
    function uploadToDrive(fileItem, defaultPrefix) {
      if (!fileItem || !fileItem.base64) return "Tidak diunggah";
      try {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        const decoded = Utilities.base64Decode(fileItem.base64);
        const blob = Utilities.newBlob(decoded, fileItem.mimeType, defaultPrefix + "_" + applicant.namaLengkap + "_" + fileItem.fileName);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return file.getUrl();
      } catch (err) {
        return "Gagal Upload: " + err.toString();
      }
    }

    // Simpan masing-masing berkas ke Google Drive
    const pasfotoUrl = uploadToDrive(docs.pasfoto, "Pasfoto");
    const ktpUrl = uploadToDrive(docs.ktp, "KTP");
    const sklUrl = uploadToDrive(docs.sklIjazah, "SKL");
    const kkUrl = uploadToDrive(docs.kartuKeluarga, "KK");

    // Catat Baris Baru ke Google Sheets
    sheet.appendRow([
      new Date(),
      applicant.namaLengkap || '',
      applicant.nik || '',
      applicant.tempatLahir || '',
      applicant.tanggalLahir || '',
      applicant.jenisKelamin || '',
      applicant.whatsapp || '',
      applicant.email || '',
      applicant.programStudi || '',
      applicant.asalSekolah || '',
      applicant.tahunLulus || '',
      applicant.alamat || '',
      pasfotoUrl,
      ktpUrl,
      sklUrl,
      kkUrl
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Pendaftaran berhasil!' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
