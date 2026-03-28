import { GoogleGenAI } from "@google/genai";
import { VIDEO_SCENE_PROMPT } from "@/lib/prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
    try {
        const { videoScene, styleLock, logoBase64, aspectRatio = "16:9" } = await req.json();

        const promptText = VIDEO_SCENE_PROMPT(videoScene, styleLock.colors, styleLock.style);
        console.log("[generate-video] starting", {
            model: "veo-3.1-generate-preview",
            promptLength: promptText.length,
            hasImage: !!logoBase64,
            aspectRatio,
        });

        const operation = await ai.models.generateVideos({
            model: "veo-3.1-generate-preview",
            prompt: promptText,
            ...(logoBase64 && {
                image: {
                    imageBytes: logoBase64,
                    mimeType: "image/png",
                },
            }),
            config: {
                aspectRatio,
                numberOfVideos: 1,
                durationSeconds: 8,
                negativePrompt: "people, faces, humans, children, text overlays, watermarks, blurry, distorted",
            },
        });

        console.log("[generate-video] operation started:", operation.name);
        return Response.json({ operationId: operation.name });
    } catch (error) {
        console.error("[generate-video] failed to start:", error);
        return Response.json({ error: "Failed to start video generation" }, { status: 500 });
    }
}
