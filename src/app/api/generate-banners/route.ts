import { GoogleGenAI } from "@google/genai";
import { BANNER_PROMPT } from "@/lib/prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const ASPECT_RATIOS = ["1:1", "16:9", "9:16"] as const;

export async function POST(req: Request) {
    try {
        const { bannerConcept, styleLock, logoBase64, brandName } = await req.json();

        const results = await Promise.all(
            ASPECT_RATIOS.map((aspectRatio) =>
                ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-image-generation",
                    contents: [
                        {
                            role: "user",
                            parts: [
                                ...(logoBase64
                                    ? [{ inlineData: { mimeType: "image/png", data: logoBase64 } }]
                                    : []),
                                {
                                    text: BANNER_PROMPT(brandName, bannerConcept, styleLock.colors, styleLock.style),
                                },
                            ],
                        },
                    ],
                    config: {
                        responseModalities: ["IMAGE", "TEXT"],
                        imageConfig: { aspectRatio },
                    },
                }).then((result) => {
                    const imagePart = result.candidates?.[0]?.content?.parts?.find(
                        (p) => p.inlineData?.mimeType?.startsWith("image/")
                    );
                    return {
                        format: aspectRatio,
                        imageBase64: imagePart?.inlineData?.data ?? null,
                    };
                })
            )
        );

        return Response.json({ banners: results });
    } catch (error) {
        console.error("Banner generation error:", error);
        return Response.json({ error: "Failed to generate banners" }, { status: 500 });
    }
}
