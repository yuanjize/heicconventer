import { ChevronDown, ChevronUp, Settings2, Smartphone } from "lucide-react";
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
  showInstall?: boolean;
  onInstall?: () => void;
  isIOS?: boolean;
  t: {
    settingsTitle: string;
    formatLabel: string;
    qualityLabel: string;
    qualityValue: (q: number) => string;
    installLabel: string;
    iosInstallStep: string;
    heroTagline: string;
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
  showInstall,
  onInstall,
  isIOS,
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
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
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
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60">
          {showInstall && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/30 p-4 dark:border-amber-900/20 dark:bg-amber-900/10">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">{t.installLabel}</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400/80">
                {isIOS ? t.iosInstallStep : t.heroTagline}
              </p>
              {!isIOS && onInstall && (
                <Button size="sm" onClick={onInstall} className="mt-1 h-8 bg-amber-600 text-xs hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600">
                  {t.installLabel}
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Label className="dark:text-slate-200">{t.formatLabel}</Label>
            <div className="flex gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFormatChange(f.value)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-slate-500",
                    settings.format === f.value
                      ? "border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
                <Label className="dark:text-slate-200">{t.qualityLabel}</Label>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
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