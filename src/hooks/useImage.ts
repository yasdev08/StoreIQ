// src/hooks/useImage.ts
import { convertFileSrc } from "@tauri-apps/api/tauri";

// Normalise Windows backslashes → forward slashes BEFORE passing to convertFileSrc.
// convertFileSrc("C:\\Users\\...") → encodes backslashes as %5C → 403
// convertFileSrc("C:/Users/...")   → produces correct asset.localhost URL → 200
function normalisePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function useImage(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  try {
    return convertFileSrc(normalisePath(filePath));
  } catch {
    return null;
  }
}

export function pathToFileUrl(filePath: string): string {
  try {
    return convertFileSrc(normalisePath(filePath));
  } catch {
    return filePath;
  }
}