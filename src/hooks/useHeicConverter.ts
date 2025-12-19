import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import heic2any from "heic2any";
import pLimit from "p-limit";

import type { HeicItem, ConversionSettings, ConversionFormat } from "../types";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getExtension = (format: ConversionFormat) => {
  switch (format) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/jpeg":
    default:
      return ".jpg";
  }
};

const toOutputName = (filename: string, format: ConversionFormat) => {
  const ext = getExtension(format);
  if (/\.(heic|heif)$/i.test(filename)) {
    return filename.replace(/\.(heic|heif)$/i, ext);
  }
  return `${filename}${ext}`;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Conversion failed";
};

const useIsMobile = () => {
  const getMatch = () => {
    if (typeof window === "undefined") {
      return false;
    }
    if (window.matchMedia) {
      return window.matchMedia("(max-width: 768px)").matches;
    }
    return window.innerWidth < 768;
  };

  const [isMobile, setIsMobile] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  return isMobile;
};

export const useHeicConverter = () => {
  const [items, setItems] = useState<HeicItem[]>([]);
  const itemsRef = useRef<HeicItem[]>([]);
  const isMobile = useIsMobile();

  const limit = useMemo(() => pLimit(isMobile ? 2 : 5), [isMobile]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      // Clear pending state to help iOS Safari GC.
      itemsRef.current = [];
    };
  }, []);

  const addFiles = useCallback(
    (files: File[], settings: ConversionSettings) => {
      if (!files.length) {
        return;
      }

      // Normalize HEIC extensions for older iOS file pickers that report uppercase.
      const normalized = files.map((file) =>
        /\.HEIC$/i.test(file.name)
          ? new File([file], file.name.replace(/\.HEIC$/i, ".heic"), { type: file.type })
          : file
      );

      const newItems: HeicItem[] = normalized.map((file) => ({
        id: createId(),
        file,
        status: "idle",
        conversionSettings: settings,
      }));

      setItems((prev) => [...prev, ...newItems]);

      void Promise.all(
        newItems.map((item) =>
          limit(async () => {
            try {
              setItems((prev) =>
                prev.map((existing) =>
                  existing.id === item.id
                    ? { ...existing, status: "converting" as const, error: undefined }
                    : existing
                )
              );

              // Convert with bounded concurrency.
              const output = await heic2any({
                blob: item.file,
                toType: settings.format,
                quality: settings.quality,
              });

              const blob = Array.isArray(output) ? output[0] : output;

              setItems((prev) => {
                let updated = false;

                const next = prev.map((existing) => {
                  if (existing.id !== item.id) {
                    return existing;
                  }

                  updated = true;
                  const previewUrl = URL.createObjectURL(blob);

                  return {
                    ...existing,
                    status: "success" as const,
                    outputBlob: blob,
                    outputName: toOutputName(existing.file.name, settings.format),
                    previewUrl,
                  };
                });

                return updated ? next : prev;
              });
            } catch (error) {
              setItems((prev) =>
                prev.map((existing) =>
                  existing.id === item.id
                    ? { ...existing, status: "error" as const, error: getErrorMessage(error) }
                    : existing
                )
              );
            }
          })
        )
      );
    },
    [limit]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return [];
    });
  }, []);

  const hasSuccess = items.some((item) => item.status === "success");
  const hasItems = items.length > 0;

  return {
    items,
    addFiles,
    removeItem,
    clearAll,
    hasSuccess,
    hasItems,
    isMobile,
  };
};
