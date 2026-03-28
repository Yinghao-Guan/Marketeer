import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import client from "@/lib/gemini";
import {
  ANALYZE_LOGO_PROMPT,
  DESCRIBE_STYLE_PROMPT,
} from "@/lib/prompts";
import type { LogoRating } from "@/types/campaign";

/**
 * Composites a base64 image onto a dark background so that white/light
 * logos on transparent backgrounds are visible to AI analysis.
 * Returns a new base64 string (no data URL prefix).
 */
async function flattenOnDarkBg(base64: string): Promise<string> {
  const buf = Buffer.from(base64, "base64");
  const meta = await sharp(buf).metadata();

  const width = meta.width || 512;
  const height = meta.height || 512;

  const darkBg = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 255 },
    },
  }).png();

  const result = await darkBg
    .composite([{ input: buf, blend: "over" }])
    .png()
    .toBuffer();

  return result.toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Style-only mode: just describe the logo's visual style
    if (body.describeStyleOnly) {
      const flatLogo = await flattenOnDarkBg(body.logoBase64);
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: flatLogo,
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

    // Flatten all logos onto dark backgrounds so white/light content
    // on transparent backgrounds is visible to the AI
    const flatLogo = await flattenOnDarkBg(logoBase64);
    const flatCompetitors = await Promise.all(
      competitorLogosBase64.map((c: string) => flattenOnDarkBg(c))
    );

    // Build content parts: clearly label user logo vs competitor logos
    const parts: Array<
      { inlineData: { mimeType: string; data: string } } | { text: string }
    > = [
      { text: "THIS IS THE USER'S LOGO TO ANALYZE (Image 1):" },
      {
        inlineData: {
          mimeType: "image/png",
          data: flatLogo,
        },
      },
    ];

    if (flatCompetitors.length > 0) {
      parts.push({
        text: `THE FOLLOWING ${flatCompetitors.length} IMAGE(S) ARE COMPETITOR LOGOS — DO NOT analyze or improve these. Only use them for comparison:`,
      });
      for (const compLogo of flatCompetitors) {
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
