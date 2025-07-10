import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const hasPublicKey = !!process.env.NEXT_PUBLIC_API_KEY;
    
    return NextResponse.json({ 
      geminiKeyAvailable: hasGeminiKey,
      publicKeyAvailable: hasPublicKey,
      message: hasGeminiKey ? "API keys are configured" : "GEMINI_API_KEY not found"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check environment" },
      { status: 500 }
    );
  }
}
