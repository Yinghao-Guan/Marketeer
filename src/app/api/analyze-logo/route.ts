import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/gemini";
import {
  ANALYZE_LOGO_PROMPT,
  DESCRIBE_STYLE_PROMPT,
} from "@/lib/prompts";
import type { LogoRating } from "@/types/campaign";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Style-only mode: just describe the logo's visual style
    if (body.describeStyleOnly) {
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: body.logoBase64,
                },
              },
              { text: DESCRIBE_STYLE_PROMPT() },
            ],
          },
        ],
      });
      const style =
        response.text?.trim() || "modern, clean, professional";
      return NextResponse.json({ style });
    }

    // Full logo analysis mode
    const {
      logoBase64,
      competitorLogosBase64 = [],
      industry,
      location,
    } = body as {
      logoBase64: string;
      competitorLogosBase64: string[];
      industry: string;
      location: string;
    };

    // Build content parts: clearly label user logo vs competitor logos
    const parts: Array<
      { inlineData: { mimeType: string; data: string } } | { text: string }
    > = [
      { text: "THIS IS THE USER'S LOGO TO ANALYZE (Image 1):" },
      {
        inlineData: {
          mimeType: "image/png",
          data: logoBase64,
        },
      },
    ];

    if (competitorLogosBase64.length > 0) {
      parts.push({
        text: `THE FOLLOWING ${competitorLogosBase64.length} IMAGE(S) ARE COMPETITOR LOGOS — DO NOT analyze or improve these. Only use them for comparison:`,
      });
      for (const compLogo of competitorLogosBase64) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: compLogo,
          },
        });
      }
    }

    parts.push({
      text: ANALYZE_LOGO_PROMPT(industry, location),
    });

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = response.text || "{}";
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    // Fix invalid escape sequences that Gemini sometimes produces
    text = text.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    const rating: LogoRating = JSON.parse(text);

    return NextResponse.json(rating);
  } catch (error) {
    console.error("analyze-logo error:", error);
    return NextResponse.json(
      { error: "Failed to analyze logo" },
      { status: 500 }
    );
  }
}
