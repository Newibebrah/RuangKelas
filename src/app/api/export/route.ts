import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, type } = body;

    if (!roomId || !type) {
      return NextResponse.json(
        { success: false, message: "roomId dan type diperlukan" },
        { status: 400 }
      );
    }

    if (type !== "kas" && type !== "transactions") {
      return NextResponse.json(
        { success: false, message: "Type harus 'kas' atau 'transactions'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Fitur export akan diimplementasikan",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
