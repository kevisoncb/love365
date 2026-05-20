import { NextResponse } from "next/server";
import { s3Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { NO_STORE_HEADERS } from "@/lib/api-config";
import {
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { validateImageFile } from "@/lib/upload-validation";
import { createLogger } from "@/lib/logger";
import { captureServerErrorAsync } from "@/lib/error-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("UPLOAD");

export async function POST(req: Request) {
  try {
    const rate = await checkRateLimit(
      req,
      "upload",
      20,
      10 * 60 * 1000
    );
    if (!rate.ok) {
      return rateLimitResponse(rate.retryAfterSec);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    const check = validateImageFile(file);
    if (!check.ok) {
      return NextResponse.json(
        {
          error:
            "error" in check ? check.error : "Arquivo inválido",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );
    const fileExtension =
      file.name.split(".").pop() || "jpg";
    const fileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type || "image/jpeg",
    });

    await s3Client.send(command);

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;

    log.done("upload ok", { status: 200 });
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    captureServerErrorAsync(error, {
      scope: "UPLOAD",
      route: "/api/upload",
    });
    log.error("upload failed", { error });
    return NextResponse.json(
      { error: "Falha no upload das fotos" },
      { status: 500 }
    );
  }
}
