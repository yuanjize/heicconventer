import { renderHook, act, waitFor } from "@testing-library/react";
import { useHeicConverter } from "../useHeicConverter";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import heic2any from "heic2any";

// Mock heic2any
vi.mock("heic2any", () => ({
  default: vi.fn(),
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock File
class MockFile {
  name: string;
  type: string;
  constructor(parts: (string | Blob)[], name: string, options: { type: string }) {
    this.name = name;
    this.type = options.type;
  }
}
global.File = MockFile as any;

describe("useHeicConverter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue("blob:url");
    (heic2any as any).mockResolvedValue(new Blob(["fake content"], { type: "image/jpeg" }));
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

    // Wait for conversion
    await waitFor(() => {
      expect(result.current.items[0].status).toBe("success");
    });

    expect(heic2any).toHaveBeenCalledWith({
      blob: expect.any(Object),
      toType: "image/jpeg",
      quality: 0.8,
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

    expect(heic2any).toHaveBeenCalledWith({
      blob: expect.any(Object),
      toType: "image/png",
      quality: 1.0,
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

    expect(heic2any).toHaveBeenCalledWith({
      blob: expect.any(Object),
      toType: "image/webp",
      quality: 0.5,
    });
    expect(result.current.items[0].outputName).toBe("image.webp");
  });

  it("should handle conversion errors", async () => {
    (heic2any as any).mockRejectedValue(new Error("Corrupt file"));
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
