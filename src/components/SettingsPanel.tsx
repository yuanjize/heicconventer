import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { cn } from "../lib/utils";
import type { ConversionFormat, ConversionSettings } from "../types";

interface SettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  t: {
    settingsTitle: string;
    formatLabel: string;
    qualityLabel: string;
    qualityValue: (q: number) => string;
  };
}

const formats: { value: ConversionFormat; label: string }[] = [
  { value: "image/jpeg", label: "JPG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
];

export const SettingsPanel = ({
  isOpen,
  onToggle,
  settings,
  onSettingsChange,
  t,
}: SettingsPanelProps) => {
  const handleFormatChange = (format: ConversionFormat) => {
    onSettingsChange({ ...settings, format });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, quality: parseFloat(e.target.value) });
  };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900"
      >
        <Settings2 className="h-4 w-4" />
        <span className="text-sm font-medium">{t.settingsTitle}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      <div
        className={cn(
          "w-full max-w-md overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3">
            <Label>{t.formatLabel}</Label>
            <div className="flex gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFormatChange(f.value)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                    settings.format === f.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {settings.format !== "image/png" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label>{t.qualityLabel}</Label>
                <span className="text-sm font-medium text-slate-600">
                  {t.qualityValue(Math.round(settings.quality * 100))}
                </span>
              </div>
              <Slider
                value={settings.quality}
                min={0.1}
                max={1.0}
                step={0.05}
                onChange={handleQualityChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
