import heic2any from "heic2any";
// import exifr from "exifr"; // Kept for future full implementation
// import * as piexif from "piexifjs";

export interface ConversionConfig {
  file: File;
  format: "image/jpeg" | "image/png" | "image/webp";
  quality: number;
}

export interface ConversionResult {
  blob: Blob;
  error?: string;
}

export const convertHeic = async ({
  file,
  format,
  quality,
}: ConversionConfig): Promise<ConversionResult> => {
  try {
    // 1. Perform Conversion
    // @ts-ignore - heic2any types might be loose or conflicting in worker context
    const conversionResult = await heic2any({
      blob: file,
      toType: format,
      quality: quality,
    });

    let outputBlob = Array.isArray(conversionResult)
      ? conversionResult[0]
      : conversionResult;

    return { blob: outputBlob };
  } catch (error) {
    return {
      blob: new Blob(),
      error: error instanceof Error ? error.message : "Unknown error in worker",
    };
  }
};

// Listen for messages from the main thread
self.onmessage = async (e: MessageEvent<ConversionConfig>) => {
  const result = await convertHeic(e.data);
  self.postMessage(result);
};