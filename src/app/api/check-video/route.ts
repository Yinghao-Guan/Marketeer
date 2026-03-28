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
            console.log("[check-video] still processing:", operationId);
            return Response.json({ done: false, status: "processing" });
        }

        // Log full response for debugging
        console.log("[check-video] operation completed:", JSON.stringify({
            operationId,
            error: operation.error ?? null,
            raiFilteredCount: operation.response?.raiMediaFilteredCount ?? 0,
            raiFilteredReasons: operation.response?.raiMediaFilteredReasons ?? [],
            videoCount: operation.response?.generatedVideos?.length ?? 0,
            hasVideoUri: !!operation.response?.generatedVideos?.[0]?.video?.uri,
            metadata: operation.metadata ?? null,
        }, null, 2));

        // Check for operation-level error
        if (operation.error) {
            const err = operation.error as { message?: string; code?: number };
            console.error("[check-video] operation error:", err);
            return Response.json(
                { error: err.message || "video generation was rejected" },
                { status: 500 }
            );
        }

        // Check for RAI safety filter
        const filtered = operation.response?.raiMediaFilteredCount;
        if (filtered && filtered > 0) {
            const reasons = operation.response?.raiMediaFilteredReasons?.join(", ") || "content policy";
            console.warn("[check-video] RAI filtered:", { count: filtered, reasons });
            return Response.json(
                { error: `video was filtered by safety policy: ${reasons}` },
                { status: 500 }
            );
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) {
            console.error("[check-video] no video URI in response:", JSON.stringify(operation.response));
            return Response.json({ error: "no video in completed operation" }, { status: 500 });
        }

        // Download the MP4 and return as base64
        console.log("[check-video] downloading video from:", videoUri.slice(0, 80) + "...");
        const videoRes = await fetch(videoUri, {
            headers: { "X-Goog-Api-Key": process.env.GEMINI_API_KEY! },
        });

        if (!videoRes.ok) {
            console.error("[check-video] video download failed:", videoRes.status, videoRes.statusText);
            return Response.json({ error: "failed to download generated video" }, { status: 500 });
        }

        const buffer = await videoRes.arrayBuffer();
        const videoBase64 = Buffer.from(buffer).toString("base64");
        console.log("[check-video] success, video size:", Math.round(buffer.byteLength / 1024), "KB");

        return Response.json({ done: true, videoBase64 });
    } catch (error) {
        console.error("[check-video] unexpected error:", error);
        return Response.json({ error: "Failed to check video status" }, { status: 500 });
    }
}
