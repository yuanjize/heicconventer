/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "piexifjs" {
  export const ImageIFD: any;
  export const ExifIFD: any;
  export const GPSIFD: any;
  export function load(data: string): any;
  export function dump(exifObj: any): string;
  export function insert(exifData: string, jpegData: string): string;
}