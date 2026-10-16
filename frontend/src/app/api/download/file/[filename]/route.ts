import { NextRequest, NextResponse } from "next/server";

const getBackendUrl = (): string => {
  if (process.env.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL.trim().replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "").replace(/\/api$/, "");
  }
  return "http://127.0.0.1:8000";
};

const BACKEND_URL = getBackendUrl();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const token = req.nextUrl.searchParams.get("token") || "";

    if (!token) {
      return new NextResponse("Missing download token", { status: 400 });
    }

    const backendUrl = `${BACKEND_URL}/api/export/file/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`;
    const backendRes = await fetch(backendUrl);

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return new NextResponse(errText || "File download link expired", { status: backendRes.status });
    }

    const disposition = backendRes.headers.get("Content-Disposition") || `attachment; filename="${filename}"`;
    const mimeType = backendRes.headers.get("Content-Type") || "application/octet-stream";
    const arrayBuffer = await backendRes.arrayBuffer();

    const headers = new Headers();
    headers.set("Content-Disposition", disposition);
    headers.set("Content-Type", mimeType);
    headers.set("Content-Length", String(arrayBuffer.byteLength));
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new NextResponse(err?.message || "Internal error during file download", { status: 500 });
  }
}
