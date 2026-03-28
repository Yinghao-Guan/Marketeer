// FFmpeg WASM client-side video+audio merge utility.
// Requires SharedArrayBuffer — ensure COOP/COEP headers are set in next.config.ts.
// WASM binary (~25MB) is loaded from CDN; call preloadFFmpeg() during onboarding
// so it's ready by the time the dashboard needs to merge video + voiceover.

const FFMPEG_CORE_URL =
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js";
const FFMPEG_WASM_URL =
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any | null = null;

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("FFmpeg can only run in the browser, not on the server.");
  }
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
  await ffmpegInstance.load({
    coreURL: FFMPEG_CORE_URL,
    wasmURL: FFMPEG_WASM_URL,
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
  const audioBlob = new Blob(
    [Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))],
    { type: "audio/wav" }
  );

  await ffmpegInstance.writeFile("input.mp4", await fetchFile(videoBlob));
  await ffmpegInstance.writeFile("audio.wav", await fetchFile(audioBlob));

  // Merge: copy video track, re-encode WAV → AAC for MP4 compatibility
  // -shortest: stop when the shorter stream ends (voiceover may be shorter than video)
  await ffmpegInstance.exec([
    "-i", "input.mp4",
    "-i", "audio.wav",
    "-c:v", "copy",
    "-c:a", "aac",
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-shortest",
    "output.mp4",
  ]);

  const data: Uint8Array = await ffmpegInstance.readFile("output.mp4");

  // Clean up WASM virtual FS to free memory
  await ffmpegInstance.deleteFile("input.mp4").catch(() => {});
  await ffmpegInstance.deleteFile("audio.wav").catch(() => {});
  await ffmpegInstance.deleteFile("output.mp4").catch(() => {});

  // Convert Uint8Array → base64
  let binary = "";
  for (let i = 0; i < data.byteLength; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}
