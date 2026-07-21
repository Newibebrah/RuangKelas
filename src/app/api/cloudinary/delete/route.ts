import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { publicId } = await req.json();
  if (!publicId) {
    return NextResponse.json({ error: "publicId required" }, { status: 400 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = await crypto.subtle
    .digest("SHA-1", new TextEncoder().encode(signaturePayload))
    .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""));

  const formData = new URLSearchParams();
  formData.append("public_id", publicId);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body: formData }
  );

  const data = await res.json();
  if (data.result === "ok") {
    return NextResponse.json({ ok: true });
  }

  // try raw delete
  const resRaw = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/destroy`,
    { method: "POST", body: formData }
  );
  const dataRaw = await resRaw.json();

  return NextResponse.json({ ok: dataRaw.result === "ok" });
}
