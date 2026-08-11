const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx1lz_P-SsQlz8VaiYIky7HDGFgexJ1JSKBngngtRXhiQjQneBwTv82Wp8f-D7PsUzcWw/exec";

const form = document.getElementById("registrationForm");
const submitButton = document.getElementById("submitButton");
const submitButtonText = document.getElementById("submitButtonText");
const statusText = document.getElementById("statusText");
const alertBox = document.getElementById("alertBox");

function showAlert(type, message) {
  alertBox.className = "mb-6 rounded-2xl border px-4 py-3 text-sm font-medium";
  alertBox.classList.add(type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800");
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
}

function hideAlert() {
  alertBox.classList.add("hidden");
  alertBox.textContent = "";
}

function setSubmitting(isSubmitting, message) {
  submitButton.disabled = isSubmitting;
  submitButtonText.textContent = isSubmitting ? "Memproses..." : "Kirim Pendaftaran";
  statusText.textContent = message;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function serializeFile(fileInputId) {
  const input = document.getElementById(fileInputId);
  if (!input || !input.files || !input.files[0]) return null;
  const file = input.files[0];

  const dataUrl = await readFileAsDataURL(file);
  const base64 = String(dataUrl).split(",")[1];

  return {
    fieldName: input.name,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    base64,
  };
}

async function buildPayload() {
  const formData = new FormData(form);
  const uploadedFiles = await Promise.all([
    serializeFile("pasfoto"),
    serializeFile("ktp"),
    serializeFile("sklIjazah"),
    serializeFile("kartuKeluarga"),
  ]);

  const documents = {};
  uploadedFiles.forEach(fileItem => {
    if (fileItem) documents[fileItem.fieldName] = fileItem;
  });

  return {
    submittedAt: new Date().toISOString(),
    applicant: {
      namaLengkap: formData.get("namaLengkap"),
      nik: formData.get("nik"),
      tempatLahir: formData.get("tempatLahir"),
      tanggalLahir: formData.get("tanggalLahir"),
      jenisKelamin: formData.get("jenisKelamin"),
      whatsapp: formData.get("whatsapp"),
      email: formData.get("email"),
      programStudi: formData.get("programStudi"),
      asalSekolah: formData.get("asalSekolah"),
      tahunLulus: formData.get("tahunLulus"),
      alamat: formData.get("alamat"),
    },
    documents,
  };
}

form.addEventListener("submit", async function(event) {
  event.preventDefault();
  hideAlert();

  try {
    setSubmitting(true, "Sedang menyiapkan data dan berkas...");
    const payload = await buildPayload();

    statusText.textContent = "Mengirim data ke Google Sheets & Drive...";

    // Menggunakan mode no-cors agar tidak diblokir browser
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    form.reset();
    showAlert("success", "Pendaftaran berhasil dikirim! Silakan cek Google Sheet & Drive Anda.");
    statusText.textContent = "Pengiriman selesai.";
  } catch (error) {
    showAlert("error", "Terjadi kesalahan koneksi. Silakan coba lagi.");
    statusText.textContent = "Pengiriman gagal.";
  } finally {
    setSubmitting(false, statusText.textContent);
  }
});
