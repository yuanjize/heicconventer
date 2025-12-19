import { AlertTriangle, CheckCircle2, Download, Loader2, X } from "lucide-react";

import type { HeicItem } from "../types";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface ImageCardProps {
  item: HeicItem;
  onDownload: (item: HeicItem) => void;
  onRemove: (id: string) => void;
}

const statusCopy = {
  idle: "Queued",
  converting: "Converting",
  success: "Ready",
  error: "Failed",
} as const;

export const ImageCard = ({ item, onDownload, onRemove }: ImageCardProps) => {
  const isLoading = item.status === "converting" || item.status === "idle";
  const isSuccess = item.status === "success" && item.outputBlob;
  const isError = item.status === "error";

  const statusColor = cn(
    "text-xs font-semibold",
    item.status === "success" && "text-emerald-600",
    item.status === "converting" && "text-sky-600",
    item.status === "idle" && "text-slate-500",
    item.status === "error" && "text-rose-600"
  );

  const statusIcon = {
    idle: <Loader2 className="h-4 w-4 animate-spin" />,
    converting: <Loader2 className="h-4 w-4 animate-spin" />,
    success: <CheckCircle2 className="h-4 w-4" />,
    error: <AlertTriangle className="h-4 w-4" />,
  }[item.status];

  return (
    <Card className="group relative flex h-full flex-col gap-3 rounded-3xl p-4">
      <div className="relative">
        <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
          {item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#e2e8f0_0%,#f8fafc_100%)] text-slate-400">
              <span className="text-xs font-semibold tracking-widest">
                HEIC
              </span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 rounded-full bg-white/80 text-slate-600 shadow-sm hover:bg-white"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.file.name}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {item.file.name}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={statusColor}>{statusCopy[item.status]}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">{statusIcon}</span>
          </div>

          <Button
            variant={isSuccess ? "primary" : "secondary"}
            size="sm"
            className="min-w-[120px]"
            onClick={() => onDownload(item)}
            disabled={!isSuccess}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        {isLoading && <Progress className="mt-1" />}
        {isError && (
          <p className="text-xs text-rose-600">
            {item.error ?? "Conversion failed"}
          </p>
        )}
      </div>
    </Card>
  );
};
