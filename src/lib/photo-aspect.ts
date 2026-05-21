/** Modo de exibição adaptativo por aspect ratio da foto original */

export type PhotoLayoutMode =
  | "portrait-cover"
  | "landscape-contain"
  | "square-cover";

const LANDSCAPE_RATIO = 1.12;
const PORTRAIT_RATIO = 0.92;

export function getPhotoLayoutMode(
  width: number,
  height: number
): PhotoLayoutMode {
  if (width <= 0 || height <= 0) {
    return "square-cover";
  }

  const ratio = width / height;

  if (ratio >= LANDSCAPE_RATIO) {
    return "landscape-contain";
  }
  if (ratio <= PORTRAIT_RATIO) {
    return "portrait-cover";
  }
  return "square-cover";
}

export function isLandscapeMode(mode: PhotoLayoutMode): boolean {
  return mode === "landscape-contain";
}

export function getPhotoObjectClasses(mode: PhotoLayoutMode): string {
  switch (mode) {
    case "landscape-contain":
      return "object-contain object-center";
    case "portrait-cover":
      return "object-cover object-[center_22%]";
    default:
      return "object-cover object-center";
  }
}
