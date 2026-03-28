import { GoogleGenAI } from "@google/genai";
import { GENERATE_PROPOSAL_PROMPT } from "@/lib/prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
    try {
        const {
            brandName,
            industry,
            location,
            styleLock,
            competitorAnalysis,
            logoDescription,
            revisionFeedback
        } = await req.json();

        const prompt = GENERATE_PROPOSAL_PROMPT(
            brandName,
            industry,
            location,
            styleLock.colors,
            styleLock.style,
            JSON.stringify(competitorAnalysis),
            logoDescription,
            revisionFeedback
        );

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const response = JSON.parse(result.text!);

        return Response.json(response);
    } catch (error) {
        return Response.json({ error: "Failed to generate proposal" }, { status: 500 });
    }
}