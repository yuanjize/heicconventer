import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import heic2any from "heic2any";
import pLimit from "p-limit";

import type { HeicItem } from "../types";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toJpgName = (filename: string) => {
  if (/\.(heic|heif)$/i.test(filename)) {
    return filename.replace(/\.(heic|heif)$/i, ".jpg");
  }
  return `${filename}.jpg`;
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
    };
  }, []);

  const addFiles = useCallback(
    (files: File[]) => {
      if (!files.length) {
        return;
      }

      const newItems: HeicItem[] = files.map((file) => ({
        id: createId(),
        file,
        status: "idle",
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

              // Convert with bounded concurrency to avoid memory spikes on mobile.
              const output = await heic2any({
                blob: item.file,
                toType: "image/jpeg",
                quality: 0.8,
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
                    outputName: toJpgName(existing.file.name),
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
