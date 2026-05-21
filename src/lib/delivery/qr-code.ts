import QRCode from "qrcode";

export type TributeQrAssets = {
  pngBuffer: Buffer;
  dataUrl: string;
};

/** QR premium que abre diretamente /p/[token] */
export async function generateTributeQr(
  pageUrl: string
): Promise<TributeQrAssets> {
  const pngBuffer = await QRCode.toBuffer(pageUrl, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 2,
    width: 520,
    color: {
      dark: "#18181b",
      light: "#fafafa",
    },
  });

  const dataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;

  return { pngBuffer, dataUrl };
}
