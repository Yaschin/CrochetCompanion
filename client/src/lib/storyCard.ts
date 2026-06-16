import { palette } from "@/lib/theme";
import { Pattern } from "./types";
import { patternProgress } from "./progress";

/**
 * Render a shareable "project story" card to a PNG: cover photo, title, maker,
 * dates and stats — perfect for the family chat. Canvas-only, no dependencies.
 */
export async function makeStoryCard(pattern: Pattern, makerName: string): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Warm cream background with a soft band
  ctx.fillStyle = "#FFF9F0";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FBF1F4";
  ctx.fillRect(0, 0, W, 200);

  // Brand
  ctx.fillStyle = "#C24E6B";
  ctx.font = "bold 40px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("🧶 Crochet Time", W / 2, 90);
  ctx.fillStyle = "#9A7868";
  ctx.font = "28px Georgia, serif";
  ctx.fillText("A finished make ♡", W / 2, 145);

  // Cover photo (rounded square) — skip gracefully if it can't load
  const img = new Image();
  img.crossOrigin = "anonymous";
  const loaded = await new Promise<boolean>((resolve) => {
    if (!pattern.endProductImage) return resolve(false);
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = pattern.endProductImage;
  });

  const imgSize = 640;
  const imgX = (W - imgSize) / 2;
  const imgY = 230;
  ctx.save();
  const r = 36;
  ctx.beginPath();
  ctx.roundRect(imgX, imgY, imgSize, imgSize, r);
  ctx.clip();
  if (loaded) {
    // cover-fit
    const scale = Math.max(imgSize / img.width, imgSize / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    try {
      ctx.drawImage(img, imgX + (imgSize - dw) / 2, imgY + (imgSize - dh) / 2, dw, dh);
    } catch {
      loadedFallback();
    }
  } else {
    loadedFallback();
  }
  function loadedFallback() {
    ctx.fillStyle = "#F0CACF";
    ctx.fillRect(imgX, imgY, imgSize, imgSize);
    ctx.fillStyle = "#C24E6B";
    ctx.font = "200px serif";
    ctx.fillText("🧶", W / 2, imgY + imgSize / 2 + 70);
  }
  ctx.restore();

  // Title + maker
  ctx.fillStyle = "#3D2318";
  ctx.font = "bold 56px Georgia, serif";
  const title = pattern.title.length > 28 ? pattern.title.slice(0, 27) + "…" : pattern.title;
  ctx.fillText(title, W / 2, imgY + imgSize + 110);
  ctx.fillStyle = "#A83050";
  ctx.font = "italic 40px Georgia, serif";
  ctx.fillText(`made by ${makerName}`, W / 2, imgY + imgSize + 170);

  // Stats line
  const { total } = patternProgress(pattern);
  const started = pattern.startedAt ? new Date(pattern.startedAt) : null;
  const finished = pattern.finishedAt ? new Date(pattern.finishedAt) : null;
  const days =
    started && finished
      ? Math.max(1, Math.round((finished.getTime() - started.getTime()) / 86_400_000))
      : null;
  const bits = [
    days ? `${days} ${days === 1 ? "day" : "days"}` : null,
    total ? `${total} rounds` : null,
    finished ? finished.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null,
  ].filter(Boolean);
  ctx.fillStyle = "#7A5A48";
  ctx.font = "34px Georgia, serif";
  ctx.fillText(bits.join("  ·  "), W / 2, imgY + imgSize + 240);

  // Footer
  ctx.fillStyle = palette.muted;
  ctx.font = "26px Georgia, serif";
  ctx.fillText("made with love, one stitch at a time", W / 2, H - 60);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render the card"))), "image/png")
  );
}

/** Share the card via the native share sheet, falling back to a download. */
export async function shareStoryCard(pattern: Pattern, makerName: string): Promise<void> {
  const blob = await makeStoryCard(pattern, makerName);
  const file = new File([blob], `${pattern.title.replace(/\s+/g, "-")}-story.png`, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: pattern.title });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
