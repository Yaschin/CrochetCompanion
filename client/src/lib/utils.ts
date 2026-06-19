import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Read a File into a full base64 data URL (`data:<mime>;base64,...`). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/** Read a File into just the base64 payload (no `data:<mime>;base64,` prefix). */
export function fileToBase64(file: File): Promise<string> {
  return fileToDataUrl(file).then((url) => url.split(",")[1] ?? "");
}