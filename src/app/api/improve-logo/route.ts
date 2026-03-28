import { NextRequest, NextResponse } from "next/server";
import ai from "@/lib/gemini";
import { IMPROVE_LOGO_PROMPT } from "@/lib/prompts";
import type { StyleLock } from "@/types/campaign";

export async function POST(req: NextRequest) {
  try {
    const { logoBase64, improvement, styleLock } = (await req.json()) as {
      logoBase64: string;
      improvement: string;
      styleLock?: StyleLock;
    };

    const prompt = IMPROVE_LOGO_PROMPT(improvement, styleLock?.style);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-image-generation",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: logoBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

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
    console.error("improve-logo error:", error);
    return NextResponse.json(
      { error: "Failed to improve logo" },
      { status: 500 }
    );
  }
}
