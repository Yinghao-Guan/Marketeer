import { NextRequest, NextResponse } from "next/server";
import ai from "@/lib/gemini";
import { GENERATE_LOGO_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const { industry, location, competitorAnalysis, brandDescription } =
      (await req.json()) as {
        industry: string;
        location: string;
        competitorAnalysis?: string;
        brandDescription?: string;
      };

    const prompt = GENERATE_LOGO_PROMPT(
      industry,
      location,
      competitorAnalysis || "",
      brandDescription
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: { aspectRatio: "1:1" },
      },
    });

    // Extract image and text from response parts
    let imageBase64 = "";
    let description = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data || "";
        }
        if (part.text) {
          description = part.text;
        }
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageBase64, description });
  } catch (error) {
    console.error("generate-logo error:", error);
    return NextResponse.json(
      { error: "Failed to generate logo" },
      { status: 500 }
    );
  }
}
