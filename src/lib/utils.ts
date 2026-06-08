import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function compressImage(
  file: File,
  maxSize: number = 800,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = (h / w) * maxSize;
          w = maxSize;
        } else {
          w = (w / h) * maxSize;
          h = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

export function sanitizeUrl(url: string | undefined): string {
  if (!url) return "#";
  const trimmed = url.trim();
  const protocolPattern = /^(https?|ftp|mailto|tel):/i;
  if (protocolPattern.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed;
  }
  // If it doesn't have a protocol, it might be a domain like www.google.com
  // but for href it would be relative. To be safe, if it looks like a domain, we could prepends https://
  // but for the sake of URI injection fix, we just block javascript: etc.
  if (trimmed.toLowerCase().startsWith("javascript:") || 
      trimmed.toLowerCase().startsWith("data:") || 
      trimmed.toLowerCase().startsWith("vbscript:")) {
    return "#";
  }
  return trimmed;
}
