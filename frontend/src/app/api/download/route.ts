import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    let resumeJson = "";
    let format = "pdf";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      resumeJson = (formData.get("resume_json") as string) || "";
      format = (formData.get("format") as string) || "pdf";
    } else {
      const json = await req.json();
      resumeJson = typeof json.resume === "object" ? JSON.stringify(json.resume) : (json.resume_json || "");
      format = json.format || "pdf";
    }

    if (!resumeJson) {
      return new NextResponse("Missing resume data", { status: 400 });
    }

    // Forward to FastAPI backend
    const backendFormData = new URLSearchParams();
    backendFormData.append("resume_json", resumeJson);
    backendFormData.append("format", format);

    const backendRes = await fetch(`${BACKEND_URL}/api/export/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: backendFormData.toString(),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return new NextResponse(errText || "Export failed on backend", { status: backendRes.status });
    }

    const disposition = backendRes.headers.get("Content-Disposition");
    const mimeType = backendRes.headers.get("Content-Type") || "application/octet-stream";
    const arrayBuffer = await backendRes.arrayBuffer();

    const headers = new Headers();
    if (disposition) {
      headers.set("Content-Disposition", disposition);
    }
    headers.set("Content-Type", mimeType);
    headers.set("Content-Length", String(arrayBuffer.byteLength));
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new NextResponse(err?.message || "Internal server error during download", { status: 500 });
  }
}
