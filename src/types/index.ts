export type ConvertStatus = "idle" | "converting" | "success" | "error";

export type ConversionFormat = "image/jpeg" | "image/png" | "image/webp";

export interface ConversionSettings {
  format: ConversionFormat;
  quality: number; // 0 to 1
}

export interface HeicItem {
  id: string;
  file: File;
  status: ConvertStatus;
  error?: string;
  outputBlob?: Blob;
  outputName?: string;
  previewUrl?: string;
  conversionSettings?: ConversionSettings; // Store what settings were used
}