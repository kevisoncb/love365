/** Client-side JPEG compression before upload (unchanged behavior). */
export async function compressImageToJpeg(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<File> {
  const maxWidth = opts?.maxWidth ?? 1080;
  const quality = opts?.quality ?? 0.8;

  if (!file.type.startsWith("image/")) return file;

  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = blobUrl;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const targetW = Math.min(maxWidth, w);
    const targetH = Math.round((h * targetW) / w);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const outBlob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality);
    });

    const safeName = file.name.replace(/\.[^/.]+$/, "");
    return new File([outBlob], `${safeName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
