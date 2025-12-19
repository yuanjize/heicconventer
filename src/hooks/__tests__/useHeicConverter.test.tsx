import { renderHook, act, waitFor } from "@testing-library/react";
import { useHeicConverter } from "../useHeicConverter";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Worker
vi.mock("../../worker/converter.worker?worker", () => {
  return {
    default: class MockWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: ErrorEvent) => void) | null = null;

      postMessage(data: any) {
        // Simulate worker processing
        setTimeout(() => {
          if (this.onmessage) {
            // Check if we should simulate an error (based on file name for testing)
            if (data.file.name === "bad.heic") {
              // We can't easily trigger the hook's onerror via the worker instance mock cleanly 
              // without more complex setup, but we can send an error result payload 
              // if that's how our worker is designed (it returns { error: ... }).
              // Our worker returns { blob: ..., error: ... }
              this.onmessage({
                data: {
                  blob: new Blob(),
                  error: "Corrupt file",
                },
              } as MessageEvent);
            } else {
              this.onmessage({
                data: {
                  blob: new Blob(["mock-image"], { type: data.format }),
                },
              } as MessageEvent);
            }
          }
        }, 10);
      }

      terminate() {}
    },
  };
});

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock File
class MockFile {
  name: string;
  type: string;
  constructor(_parts: (string | Blob)[], name: string, options: { type: string }) {
    this.name = name;
    this.type = options.type;
  }
}
global.File = MockFile as any;

describe("useHeicConverter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue("blob:url");
  });

  it("should initialize with empty items", () => {
    const { result } = renderHook(() => useHeicConverter());
    expect(result.current.items).toEqual([]);
    expect(result.current.hasItems).toBe(false);
  });

  it("should add files and start conversion with default settings", async () => {
    const { result } = renderHook(() => useHeicConverter());
    const file = new File([""], "test.heic", { type: "image/heic" });

    const settings = { format: "image/jpeg" as const, quality: 0.8 };

    act(() => {
      result.current.addFiles([file], settings);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].status).toBe("idle");

    // Wait for conversion (simulated by mock worker)
    await waitFor(() => {
      expect(result.current.items[0].status).toBe("success");
    });

    expect(result.current.items[0].outputName).toBe("test.jpg");
  });

  it("should respect PNG format settings", async () => {
    const { result } = renderHook(() => useHeicConverter());
    const file = new File([""], "photo.HEIC", { type: "image/heic" });
    const settings = { format: "image/png" as const, quality: 1.0 };

    act(() => {
      result.current.addFiles([file], settings);
    });

    await waitFor(() => {
      expect(result.current.items[0].status).toBe("success");
    });

    expect(result.current.items[0].outputName).toBe("photo.png");
  });

  it("should respect WebP format settings", async () => {
    const { result } = renderHook(() => useHeicConverter());
    const file = new File([""], "image.heif", { type: "image/heif" });
    const settings = { format: "image/webp" as const, quality: 0.5 };

    act(() => {
      result.current.addFiles([file], settings);
    });

    await waitFor(() => {
      expect(result.current.items[0].status).toBe("success");
    });

    expect(result.current.items[0].outputName).toBe("image.webp");
  });

  it("should handle conversion errors", async () => {
    const { result } = renderHook(() => useHeicConverter());
    const file = new File([""], "bad.heic", { type: "image/heic" });
    const settings = { format: "image/jpeg" as const, quality: 0.8 };

    act(() => {
      result.current.addFiles([file], settings);
    });

    await waitFor(() => {
      expect(result.current.items[0].status).toBe("error");
    });

    expect(result.current.items[0].error).toBe("Corrupt file");
  });

  it("should remove items", async () => {
    const { result } = renderHook(() => useHeicConverter());
    const file = new File([""], "test.heic", { type: "image/heic" });
    const settings = { format: "image/jpeg" as const, quality: 0.8 };

    act(() => {
      result.current.addFiles([file], settings);
    });

    const id = result.current.items[0].id;

    act(() => {
      result.current.removeItem(id);
    });

    expect(result.current.items).toHaveLength(0);
  });
});