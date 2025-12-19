export type ConvertStatus = "idle" | "converting" | "success" | "error";

export interface HeicItem {
  id: string;
  file: File;
  status: ConvertStatus;
  error?: string;
  outputBlob?: Blob;
  outputName?: string;
  previewUrl?: string;
}
