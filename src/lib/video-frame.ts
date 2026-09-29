const MAX_POSTER_WIDTH = 1080;

function canvasForVideo(video: HTMLVideoElement) {
  const sourceWidth = video.videoWidth || 1080;
  const sourceHeight = video.videoHeight || 1920;
  const scale = Math.min(1, MAX_POSTER_WIDTH / sourceWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossibile preparare il fotogramma del video.");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function captureVideoFrameDataUrl(video: HTMLVideoElement) {
  return canvasForVideo(video).toDataURL("image/webp", 0.86);
}

export async function createFinalVideoFrameFile(file: File) {
  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.addEventListener("loadedmetadata", () => resolve(), { once: true });
      video.addEventListener("error", () => reject(new Error("Il browser non riesce a leggere questo video. Prova con un file MP4.")), { once: true });
    });

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error("Non è stato possibile trovare la fine del video.");
    }

    video.currentTime = Math.max(0, video.duration - 0.08);
    await new Promise<void>((resolve, reject) => {
      video.addEventListener("seeked", () => resolve(), { once: true });
      video.addEventListener("error", () => reject(new Error("Non è stato possibile estrarre l’ultimo fotogramma.")), { once: true });
    });

    const canvas = canvasForVideo(video);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    if (!blob) throw new Error("Non è stato possibile creare lo sfondo fermo.");
    return new File([blob], `ultimo-fotogramma-${Date.now()}.webp`, { type: "image/webp" });
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
