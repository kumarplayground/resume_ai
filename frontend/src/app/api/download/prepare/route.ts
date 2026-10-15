import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const backendRes = await fetch(`${BACKEND_URL}/api/export/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return new NextResponse(errText || "Export preparation failed", { status: backendRes.status });
    }

    const data = await backendRes.json();
    return NextResponse.json({
      success: true,
      token: data.token,
      filename: data.filename,
      download_url: `/api/download/file/${encodeURIComponent(data.filename)}?token=${encodeURIComponent(data.token)}`,
    });
  } catch (err: any) {
    return new NextResponse(err?.message || "Internal error in download prepare", { status: 500 });
  }
}
