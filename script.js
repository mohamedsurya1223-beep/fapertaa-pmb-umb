const SCRIPT_URL = "URL_GOOGLE_APPS_SCRIPT_ANDA";

const form = document.getElementById("registrationForm");
const submitButton = document.getElementById("submitButton");
const submitButtonText = document.getElementById("submitButtonText");
const statusText = document.getElementById("statusText");
const alertBox = document.getElementById("alertBox");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileMenu = document.getElementById("mobileMenu");
const mobileLinks = document.querySelectorAll(".mobile-link");
const siteLogo = document.getElementById("siteLogo");
const siteLogoFallback = document.getElementById("siteLogoFallback");
const heroImage = document.getElementById("heroImage");
const heroImageFallback = document.getElementById("heroImageFallback");

function toggleMobileMenu() {
  const isHidden = mobileMenu.classList.contains("hidden");
  mobileMenu.classList.toggle("hidden");
  mobileMenuButton.setAttribute("aria-expanded", String(isHidden));
}

function closeMobileMenu() {
  mobileMenu.classList.add("hidden");
  mobileMenuButton.setAttribute("aria-expanded", "false");
}

function showAlert(type, message) {
  alertBox.className = "rounded-2xl border px-4 py-3 text-sm font-medium";
  alertBox.classList.add(type === "success" ? "alert-success" : "alert-error");
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
  submitButton.classList.toggle("loading", isSubmitting);
  statusText.textContent = message;
}

function setupImageFallback(imageElement, fallbackElement, options = {}) {
  if (!imageElement || !fallbackElement) {
    return;
  }

  const { onMissing } = options;

  function showFallback() {
    imageElement.classList.add("hidden");
    fallbackElement.classList.remove("hidden");
    if (typeof onMissing === "function") {
      onMissing();
    }
  }

  imageElement.addEventListener("error", showFallback);

  if (imageElement.complete && imageElement.naturalWidth === 0) {
    showFallback();
  }
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
  const file = input.files[0];

  if (!file) {
    throw new Error(`File untuk ${input.name} belum dipilih.`);
  }

  const dataUrl = await readFileAsDataURL(file);
  const base64 = String(dataUrl).split(",")[1];

  return {
    fieldName: input.name,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    dataUrl,
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

  const documents = uploadedFiles.reduce((accumulator, fileItem) => {
    accumulator[fileItem.fieldName] = fileItem;
    return accumulator;
  }, {});

  return {
    source: "Website PMB Fakultas Pertanian UM Berau",
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

async function submitRegistration(event) {
  event.preventDefault();
  hideAlert();

  if (SCRIPT_URL === "URL_GOOGLE_APPS_SCRIPT_ANDA") {
    showAlert("error", "Silakan isi variabel SCRIPT_URL di file script.js dengan URL Web App Google Apps Script Anda.");
    statusText.textContent = "Konfigurasi SCRIPT_URL belum diisi.";
    return;
  }

  try {
    setSubmitting(true, "Sedang menyiapkan data dan mengunggah berkas...");
    const payload = await buildPayload();

    statusText.textContent = "Mengirim data ke server Google Apps Script...";

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      result = { rawResponse: responseText };
    }

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Terjadi kegagalan saat mengirim data pendaftaran.");
    }

    form.reset();
    showAlert("success", "Pendaftaran berhasil dikirim. Panitia akan memverifikasi data Anda secepatnya.");
    statusText.textContent = "Pengiriman berhasil.";
  } catch (error) {
    showAlert("error", error.message || "Terjadi kesalahan yang tidak diketahui.");
    statusText.textContent = "Pengiriman gagal. Silakan cek koneksi atau konfigurasi Apps Script.";
  } finally {
    setSubmitting(false, statusText.textContent);
  }
}

mobileMenuButton.addEventListener("click", toggleMobileMenu);
mobileLinks.forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

setupImageFallback(siteLogo, siteLogoFallback);
setupImageFallback(heroImage, heroImageFallback, {
  onMissing: () => {
    const heroMedia = heroImage.closest(".hero-media");
    if (heroMedia) {
      heroMedia.classList.add("image-missing");
    }
  },
});

form.addEventListener("submit", submitRegistration);
