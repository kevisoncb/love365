export function computeCreateProgress(
  step: number,
  fields: {
    names: string;
    startDate: string;
    photosCount: number;
    maxPhotos: number;
    whatsapp: string;
    email: string;
  }
): number {
  const stepWeight = 25;
  let completed = (step - 1) * stepWeight;

  let partial = 0;
  switch (step) {
    case 1:
      partial = 1;
      break;
    case 2:
      partial = (fields.names.trim() ? 0.5 : 0) + (fields.startDate ? 0.5 : 0);
      break;
    case 3:
      partial = fields.maxPhotos > 0 ? Math.max(0.2, fields.photosCount / fields.maxPhotos) : 0;
      break;
    case 4:
      partial = (fields.whatsapp.length >= 10 ? 0.5 : 0) + (fields.email.includes("@") ? 0.5 : 0);
      break;
    default:
      partial = 0;
  }

  return Math.min(100, completed + partial * stepWeight);
}

export function canAdvanceStep(
  step: number,
  fields: { names: string; startDate: string; whatsapp: string; email: string }
): boolean {
  switch (step) {
    case 1:
      return true;
    case 2:
      return Boolean(fields.names.trim() && fields.startDate);
    case 3:
      return true;
    case 4:
      return fields.whatsapp.length >= 10 && fields.email.includes("@");
    default:
      return false;
  }
}
