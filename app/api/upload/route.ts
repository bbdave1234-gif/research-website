import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { addPaper } from "@/lib/blob-store";

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {};

        if (!payload.password || payload.password !== process.env.UPLOAD_PASSWORD) {
          throw new Error("Incorrect upload password.");
        }
        if (!payload.title || !payload.year) {
          throw new Error("Title and year are required.");
        }

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            title: payload.title,
            year: Number(payload.year),
            fileType: payload.fileType || "",
            doi: payload.doi || "",
            journal: payload.journal || "",
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { title, year, fileType, doi, journal } = tokenPayload
          ? JSON.parse(tokenPayload)
          : { title: "Untitled", year: new Date().getFullYear(), fileType: "", doi: "", journal: "" };

        await addPaper({
          id: crypto.randomUUID(),
          title,
          year,
          url: blob.url,
          filename: blob.pathname,
          fileType,
          uploadedAt: new Date().toISOString(),
          doi: doi || undefined,
          journal: journal || undefined,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
