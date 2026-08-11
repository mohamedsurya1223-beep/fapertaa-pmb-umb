function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var applicant = data.applicant || {};
    var docs = data.documents || {};

    // ID Folder Google Drive tempat menyimpan berkas (Opsional/Sesuai Folder Anda)
    // Jika tidak ada folder khusus, file akan tersimpan di Drive Utama
    var folder;
    var FOLDER_ID = "1ccUD3X9kb1_hBx5zSoFOeHfTQPgnjbqb"; // Biarkan kosong jika tidak pakai
    
    if (FOLDER_ID && FOLDER_ID !== "1ccUD3X9kb1_hBx5zSoFOeHfTQPgnjbqb") {
      folder = DriveApp.getFolderById(FOLDER_ID);
    } else {
      folder = DriveApp.getRootFolder();
    }

    function saveFile(docObj) {
      if (!docObj || !docObj.base64) return "";
      var bytes = Utilities.base64Decode(docObj.base64);
      var blob = Utilities.newBlob(bytes, docObj.mimeType, docObj.fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    }

    var pasfotoUrl = saveFile(docs.pasfoto);
    var ktpUrl = saveFile(docs.ktp);
    var sklUrl = saveFile(docs.sklIjazah);
    var kkUrl = saveFile(docs.kartuKeluarga);

    // Masukkan data ke baris paling bawah di Google Sheets
    sheet.appendRow([
      new Date(),
      applicant.namaLengkap,
      "'" + applicant.nik,
      applicant.tempatLahir,
      applicant.tanggalLahir,
      applicant.jenisKelamin,
      "'" + applicant.whatsapp,
      applicant.email,
      applicant.programStudi,
      applicant.asalSekolah,
      applicant.tahunLulus,
      applicant.alamat,
      pasfotoUrl,
      ktpUrl,
      sklUrl,
      kkUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
