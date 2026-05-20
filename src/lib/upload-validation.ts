const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES_BASIC = 3;
const MAX_FILES_PREMIUM = 5;

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateImageFile(
  file: File
): UploadValidationResult {
  if (!file.name || file.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: "Cada foto deve ter no máximo 5 MB.",
    };
  }

  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return {
      ok: false,
      error: "Formato inválido. Use JPG, PNG ou WebP.",
    };
  }

  return { ok: true };
}

export function validatePhotoBatch(
  files: File[],
  plan: string
): UploadValidationResult {
  const max =
    plan === "PREMIUM"
      ? MAX_FILES_PREMIUM
      : MAX_FILES_BASIC;

  const validFiles = files.filter(
    (f) => f.name && f.size > 0
  );

  if (validFiles.length === 0) {
    return {
      ok: false,
      error: "Envie pelo menos uma foto.",
    };
  }

  if (validFiles.length > max) {
    return {
      ok: false,
      error: `Máximo de ${max} fotos para este plano.`,
    };
  }

  let totalBytes = 0;
  for (const file of validFiles) {
    const check = validateImageFile(file);
    if (!check.ok) return check;
    totalBytes += file.size;
  }

  if (totalBytes > 18 * 1024 * 1024) {
    return {
      ok: false,
      error: "Tamanho total das fotos excede 18 MB.",
    };
  }

  return { ok: true };
}
