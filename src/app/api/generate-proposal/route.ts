import { NextRequest, NextResponse } from "next/server";
import ai from "@/lib/gemini";
import { GENERATE_PROPOSAL_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const {
      brandName,
      industry,
      location,
      styleLock,
      competitorAnalysis,
      logoDescription,
      revisionFeedback,
    } = await req.json();

    const prompt = GENERATE_PROPOSAL_PROMPT(
      brandName || "My Brand",
      industry || "general",
      location || "",
      styleLock?.colors || ["#808080"],
      styleLock?.style || "modern, clean",
      competitorAnalysis ? JSON.stringify(competitorAnalysis) : "None provided",
      logoDescription || "",
      revisionFeedback
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const proposal = JSON.parse(text);

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("generate-proposal error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
