import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  CloudUpload,
  Download,
  Image as ImageIcon,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import type { HeicItem } from "./types";
import { ImageCard } from "./components/ImageCard";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { cn } from "./lib/utils";
import { useHeicConverter } from "./hooks/useHeicConverter";

const fallbackJpgName = (name: string) => {
  if (/\.(heic|heif)$/i.test(name)) {
    return name.replace(/\.(heic|heif)$/i, ".jpg");
  }
  return `${name}.jpg`;
};

const App = () => {
  const { items, addFiles, removeItem, clearAll, hasSuccess, hasItems, isMobile } =
    useHeicConverter();
  const [isZipping, setIsZipping] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addFiles(acceptedFiles);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    multiple: true,
  });

  const successItems = useMemo(
    () => items.filter((item) => item.status === "success" && item.outputBlob),
    [items]
  );

  const pendingCount = useMemo(
    () =>
      items.filter(
        (item) => item.status === "converting" || item.status === "idle"
      ).length,
    [items]
  );

  const handleDownload = useCallback((item: HeicItem) => {
    if (!item.outputBlob) {
      return;
    }
    saveAs(item.outputBlob, item.outputName ?? fallbackJpgName(item.file.name));
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (!successItems.length || isZipping) {
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      successItems.forEach((item) => {
        if (!item.outputBlob) {
          return;
        }
        zip.file(item.outputName ?? fallbackJpgName(item.file.name), item.outputBlob);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `heic-to-jpg-${Date.now()}.zip`);
    } finally {
      setIsZipping(false);
    }
  }, [isZipping, successItems]);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden text-slate-900",
        "bg-[radial-gradient(1200px_circle_at_20%_10%,#ffe8b0_0%,transparent_60%),radial-gradient(900px_circle_at_85%_15%,#c6f0ff_0%,transparent_55%),linear-gradient(140deg,#fff7e8_0%,#eefbf3_45%,#eaf7ff_100%)]"
      )}
    >
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-40 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

      <main
        className={cn(
          "relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-10 md:px-8",
          isMobile && hasItems
            ? "pb-[calc(env(safe-area-inset-bottom)+120px)]"
            : "pb-16"
        )}
      >
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                HEIC to JPG
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl font-['Fraunces']">
                Pure client-side converter
              </h1>
            </div>
          </div>

          <Badge className="w-fit">
            <ShieldCheck className="h-4 w-4" />
            Privacy First
          </Badge>
        </header>

        <div className="mt-4 max-w-3xl text-base text-slate-600">
          Convert HEIC images directly in your browser. Files never leave your
          device, and conversions run locally with controlled concurrency.
        </div>

        <Card
          {...getRootProps()}
          className={cn(
            "mt-8 flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed px-6 py-10 text-center transition",
            isDragActive
              ? "border-slate-900 bg-white/90"
              : "border-slate-300 bg-white/70"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <CloudUpload className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold">
            {isMobile
              ? "Tap to select HEIC photos"
              : "Drag and drop HEIC files here, or click to select"}
          </div>
          <div className="text-sm text-slate-500">
            Supports .heic and .heif files. Multiple selection enabled.
          </div>
        </Card>

        {hasItems && !isMobile && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-600">
              {successItems.length} ready | {pendingCount} in queue
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={clearAll}>
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
              <Button
                onClick={handleDownloadAll}
                disabled={!hasSuccess || isZipping}
              >
                <Download className="h-4 w-4" />
                {isZipping ? "Packaging..." : "Download All (ZIP)"}
              </Button>
            </div>
          </div>
        )}

        {hasItems && (
          <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {items.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                onDownload={handleDownload}
                onRemove={removeItem}
              />
            ))}
          </section>
        )}
      </main>

      {isMobile && hasItems && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/60 bg-white/85 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <Button variant="ghost" className="flex-1" onClick={clearAll}>
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
            <Button
              className="flex-[1.4]"
              onClick={handleDownloadAll}
              disabled={!hasSuccess || isZipping}
            >
              <Download className="h-4 w-4" />
              {isZipping ? "Packaging..." : "Download All"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
