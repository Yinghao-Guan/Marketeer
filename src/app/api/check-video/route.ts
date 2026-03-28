import { GenerateVideosOperation, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get("operationId");

        if (!operationId) {
            return Response.json({ error: "Missing operationId" }, { status: 400 });
        }

        const operationRef = new GenerateVideosOperation();
        operationRef.name = operationId;
        const operation = await ai.operations.getVideosOperation({
            operation: operationRef,
        });

        if (!operation.done) {
            return Response.json({ done: false, status: "processing" });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) {
            return Response.json({ error: "No video in completed operation" }, { status: 500 });
        }

        // Download the MP4 and return as base64
        const videoRes = await fetch(videoUri, {
            headers: { "X-Goog-Api-Key": process.env.GEMINI_API_KEY! },
        });
        const buffer = await videoRes.arrayBuffer();
        const videoBase64 = Buffer.from(buffer).toString("base64");

        return Response.json({ done: true, videoBase64 });
    } catch (error) {
        console.error("check-video error:", error);
        return Response.json({ error: "Failed to check video status" }, { status: 500 });
    }
}
