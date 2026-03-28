// FFmpeg WASM client-side video+audio merge utility.
// Requires SharedArrayBuffer — ensure COOP/COEP headers are set in next.config.ts.
// WASM binary (~25MB) is loaded from CDN; call preloadFFmpeg() during onboarding
// so it's ready by the time the dashboard needs to merge video + voiceover.

const FFMPEG_CORE_PATH = "/ffmpeg/ffmpeg-core.js";
const FFMPEG_WASM_PATH = "/ffmpeg/ffmpeg-core.wasm";
const FFMPEG_CLASS_WORKER_PATH = "/ffmpeg/ffmpeg-worker.js";
export const FINAL_VIDEO_VERSION = 3;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any | null = null;
let ffmpegLoggerAttached = false;
let ffmpegLastError = "";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function inferAudioInput(base64: string): { mimeType: string; filename: string } {
  if (base64.startsWith("UklGR")) {
    return { mimeType: "audio/wav", filename: "audio.wav" };
  }
  if (base64.startsWith("SUQz") || base64.startsWith("//uQ")) {
    return { mimeType: "audio/mpeg", filename: "audio.mp3" };
  }
  return { mimeType: "audio/wav", filename: "audio.wav" };
}

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("FFmpeg can only run in the browser, not on the server.");
  }
}

function getBrowserAssetUrl(path: string): string {
  assertBrowser();
  return new URL(path, window.location.origin).toString();
}

/**
 * Preload the FFmpeg WASM binary from CDN.
 * Safe to call multiple times — subsequent calls are no-ops.
 * Call this early (e.g. during onboarding) so the 25MB download happens
 * before the user reaches the dashboard.
 */
export async function preloadFFmpeg(): Promise<void> {
  assertBrowser();
  if (ffmpegInstance?.loaded) return;

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  ffmpegInstance = new FFmpeg();
  if (!ffmpegLoggerAttached) {
    ffmpegInstance.on("log", ({ type, message }: { type: string; message: string }) => {
      if (type === "stderr" && message.trim()) {
        ffmpegLastError = message.trim();
      }
    });
    ffmpegLoggerAttached = true;
  }
  await ffmpegInstance.load({
    coreURL: getBrowserAssetUrl(FFMPEG_CORE_PATH),
    wasmURL: getBrowserAssetUrl(FFMPEG_WASM_PATH),
    classWorkerURL: getBrowserAssetUrl(FFMPEG_CLASS_WORKER_PATH),
  });
}

/**
 * Merge a video (MP4) and audio (WAV) into a single MP4 with audio track.
 * Both inputs should be base64-encoded strings.
 * Returns a base64-encoded MP4.
 *
 * Runs entirely client-side via WASM — no server involved.
 */
export async function mergeVideoAudio(
  videoBase64: string,
  audioBase64: string
): Promise<string> {
  assertBrowser();
  ffmpegLastError = "";

  // Ensure FFmpeg is loaded
  if (!ffmpegInstance?.loaded) {
    await preloadFFmpeg();
  }

  const { fetchFile } = await import("@ffmpeg/util");

  // Convert base64 → Uint8Array → write into WASM virtual FS
  const videoBlob = new Blob(
    [Uint8Array.from(atob(videoBase64), (c) => c.charCodeAt(0))],
    { type: "video/mp4" }
  );
  const audioInput = inferAudioInput(audioBase64);
  const audioBlob = new Blob(
    [Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))],
    { type: audioInput.mimeType }
  );

  // Best-effort cleanup so reruns don't fail from stale files.
  await ffmpegInstance.deleteFile("input.mp4").catch(() => {});
  await ffmpegInstance.deleteFile("audio.wav").catch(() => {});
  await ffmpegInstance.deleteFile("audio.mp3").catch(() => {});
  await ffmpegInstance.deleteFile("output.mp4").catch(() => {});

  await ffmpegInstance.writeFile("input.mp4", await fetchFile(videoBlob));
  await ffmpegInstance.writeFile(audioInput.filename, await fetchFile(audioBlob));

  try {
    // Produce a browser-safe MP4. Loop the video so it covers the full
    // voiceover duration (voiceover may exceed the 8s Veo clip).
    // -stream_loop -1 makes the video loop indefinitely; -shortest stops
    // the output when the shorter (audio) stream ends.
    const exitCode = await ffmpegInstance.exec([
      "-y",
      "-stream_loop", "-1",
      "-i", "input.mp4",
      "-i", audioInput.filename,
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-r", "30",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-profile:v", "baseline",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-ar", "48000",
      "-ac", "2",
      "-avoid_negative_ts", "make_zero",
      "-movflags", "+faststart",
      "-shortest",
      "output.mp4",
    ]);

    if (exitCode !== 0) {
      throw new Error(ffmpegLastError || `FFmpeg exited with code ${exitCode}`);
    }

    const data: Uint8Array = await ffmpegInstance.readFile("output.mp4");

    // Convert Uint8Array → base64
    let binary = "";
    for (let i = 0; i < data.byteLength; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  } catch (error) {
    throw new Error(getErrorMessage(error, ffmpegLastError || "Video merge failed"));
  } finally {
    // Clean up WASM virtual FS to free memory
    await ffmpegInstance.deleteFile("input.mp4").catch(() => {});
    await ffmpegInstance.deleteFile("audio.wav").catch(() => {});
    await ffmpegInstance.deleteFile("audio.mp3").catch(() => {});
    await ffmpegInstance.deleteFile("output.mp4").catch(() => {});
  }
}
