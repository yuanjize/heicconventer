import { useCallback, useEffect, useMemo, useState } from "react";
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

import type { HeicItem, ConversionSettings } from "./types";
import { ImageCard } from "./components/ImageCard";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { SettingsPanel } from "./components/SettingsPanel";
import { cn } from "./lib/utils";
import { useHeicConverter } from "./hooks/useHeicConverter";

type Locale = "en" | "zh" | "es";

const translations: Record<Locale, {
  label: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  heroKicker: string;
  heroTitle: string;
  heroTagline: string;
  privacyBadge: string;
  description: string;
  uploadDesktop: string;
  uploadMobile: string;
  uploadSupport: string;
  readySummary: (ready: number, pending: number) => string;
  clearAll: string;
  downloadAllZip: string;
  downloadAll: string;
  packaging: string;
  download: string;
  status: Record<"idle" | "converting" | "success" | "error", string>;
  errorFallback: string;
  languageLabel: string;
  settingsTitle: string;
  formatLabel: string;
  qualityLabel: string;
  qualityValue: (q: number) => string;
}> = {
  en: {
    label: "English",
    seoTitle: "Free HEIC to JPG/PNG Converter | Fast, Private, Secure",
    seoDescription:
      "Free, fast, private and secure HEIC to JPG/PNG converter. 100% client-side, no uploads to server.",
    seoKeywords:
      "free HEIC to JPG,HEIC to PNG,fast,privacy first,secure,client-side,no upload",
    heroKicker: "HEIC Converter",
    heroTitle: "Private client-side converter",
    heroTagline: "Free • Fast • Private • Secure • No uploads • iOS / Android ready",
    privacyBadge: "Privacy First",
    description:
      "Convert HEIC images directly in your browser. Files never leave your device. Support JPG, PNG and WebP.",
    uploadDesktop: "Drag and drop HEIC files here, or click to select, or paste from clipboard",
    uploadMobile: "Tap to select HEIC photos",
    uploadSupport: "Supports .heic and .heif files. Multiple selection enabled.",
    readySummary: (ready, pending) => `${ready} ready | ${pending} in queue`,
    clearAll: "Clear All",
    downloadAllZip: "Download All (ZIP)",
    downloadAll: "Download All",
    packaging: "Packaging...",
    download: "Download",
    status: {
      idle: "Queued",
      converting: "Converting",
      success: "Ready",
      error: "Failed",
    },
    errorFallback: "Conversion failed",
    languageLabel: "Lang",
    settingsTitle: "Output Settings",
    formatLabel: "Format",
    qualityLabel: "Quality",
    qualityValue: (q) => `${q}%`,
  },
  zh: {
    label: "中文",
    seoTitle: "免费 HEIC 转 JPG/PNG | 快速、隐私、安全 | iOS / Android",
    seoDescription:
      "免费快速的 HEIC 转 JPG/PNG 转换器，纯前端运行，不上传服务器。支持 JPG, PNG, WebP。",
    seoKeywords:
      "免费,快速,隐私,安全,不上传服务器,HEIC 转 JPG,HEIC 转 PNG",
    heroKicker: "HEIC 转换器",
    heroTitle: "纯前端 HEIC 转换器",
    heroTagline: "免费 · 快速 · 隐私 · 安全 · 不上传服务器 · iOS / Android 直转",
    privacyBadge: "隐私优先",
    description:
      "在浏览器本地完成 HEIC 转换。文件不出设备，支持导出 JPG、PNG 和 WebP 格式。",
    uploadDesktop: "拖拽 HEIC 到此处，或点击选择，或直接粘贴",
    uploadMobile: "点击选择 HEIC 照片",
    uploadSupport: "支持 .heic / .heif，多选批量转换。",
    readySummary: (ready, pending) => `${ready} 个已就绪 | ${pending} 个队列中`,
    clearAll: "清空全部",
    downloadAllZip: "全部打包下载 (ZIP)",
    downloadAll: "全部下载",
    packaging: "打包中...",
    download: "下载",
    status: {
      idle: "排队",
      converting: "转换中",
      success: "已完成",
      error: "失败",
    },
    errorFallback: "转换失败",
    languageLabel: "语言",
    settingsTitle: "输出设置",
    formatLabel: "格式",
    qualityLabel: "质量",
    qualityValue: (q) => `${q}%`,
  },
  es: {
    label: "Español",
    seoTitle: "Conversor HEIC a JPG/PNG gratis | Rápido, privado, seguro",
    seoDescription:
      "Convierte HEIC a JPG/PNG gratis, rápido y de forma privada. 100% en el navegador.",
    seoKeywords:
      "convertir HEIC a JPG,HEIC a PNG,gratis,rápido,privado,seguro",
    heroKicker: "Conversor HEIC",
    heroTitle: "Convertidor HEIC local",
    heroTagline: "Gratis · Rápido · Privado · Seguro · Sin subir al servidor",
    privacyBadge: "Privacidad primero",
    description:
      "Convierte imágenes HEIC directamente en tu navegador. Soporta JPG, PNG y WebP.",
    uploadDesktop: "Arrastra y suelta archivos HEIC aquí o haz clic para seleccionar o pegar",
    uploadMobile: "Toca para elegir fotos HEIC",
    uploadSupport: "Compatible con .heic y .heif. Selección múltiple.",
    readySummary: (ready, pending) => `${ready} listos | ${pending} en cola`,
    clearAll: "Borrar todo",
    downloadAllZip: "Descargar todo (ZIP)",
    downloadAll: "Descargar todo",
    packaging: "Empaquetando...",
    download: "Descargar",
    status: {
      idle: "En cola",
      converting: "Convirtiendo",
      success: "Listo",
      error: "Error",
    },
    errorFallback: "La conversión falló",
    languageLabel: "Idioma",
    settingsTitle: "Configuración",
    formatLabel: "Formato",
    qualityLabel: "Calidad",
    qualityValue: (q) => `${q}%`,
  },
};

const langMapForHtml: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  es: "es",
};

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem("heic-locale") as Locale | null;
  if (stored && stored in translations) {
    return stored;
  }
  const lang = window.navigator.language.toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("es")) return "es";
  return "en";
};

const getExtension = (format: string) => {
  if (format === "image/png") return ".png";
  if (format === "image/webp") return ".webp";
  return ".jpg";
};

const fallbackName = (name: string, format: string) => {
  const ext = getExtension(format);
  if (/\.(heic|heif)$/i.test(name)) {
    return name.replace(/\.(heic|heif)$/i, ext);
  }
  return `${name}${ext}`;
};

const App = () => {
  const { items, addFiles, removeItem, clearAll, hasSuccess, hasItems, isMobile } =
    useHeicConverter();
  const [isZipping, setIsZipping] = useState(false);
  const [locale, setLocale] = useState<Locale>(getInitialLocale());
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>({
    format: "image/jpeg",
    quality: 0.8,
  });

  const t = translations[locale];

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = langMapForHtml[locale];
    window.localStorage.setItem("heic-locale", locale);
  }, [locale]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const setMeta = (name: string, value: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    const setOg = (property: string, value: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    document.title = t.seoTitle;
    setMeta("description", t.seoDescription);
    setMeta("keywords", t.seoKeywords);
    setOg("og:title", t.seoTitle);
    setOg("og:description", t.seoDescription);
  }, [t, locale]);

  // Paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.files.length) return;
      
      const files = Array.from(e.clipboardData.files).filter(
        (file) =>
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          /\.heic$/i.test(file.name) ||
          /\.heif$/i.test(file.name)
      );

      if (files.length > 0) {
        addFiles(files, settings);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [addFiles, settings]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Pass the *current* settings at the moment of drop
      addFiles(acceptedFiles, settings);
    },
    [addFiles, settings]
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
    const fmt = item.conversionSettings?.format ?? "image/jpeg";
    saveAs(item.outputBlob, item.outputName ?? fallbackName(item.file.name, fmt));
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
        const fmt = item.conversionSettings?.format ?? "image/jpeg";
        zip.file(
          item.outputName ?? fallbackName(item.file.name, fmt),
          item.outputBlob
        );
      });

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `heic-converted-${Date.now()}.zip`);
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
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                {t.heroKicker}
              </p>
              <h1 className="font-['Fraunces'] text-3xl font-semibold tracking-tight md:text-4xl">
                {t.heroTitle}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600">{t.heroTagline}</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Badge className="w-fit">
              <ShieldCheck className="h-4 w-4" />
              {t.privacyBadge}
            </Badge>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">{t.languageLabel}</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                {Object.entries(translations).map(([value, data]) => (
                  <option key={value} value={value}>
                    {data.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="mt-4 max-w-3xl text-base text-slate-600">{t.description}</div>

        <div className="mt-8 flex flex-col gap-4">
          <SettingsPanel
            isOpen={showSettings}
            onToggle={() => setShowSettings(!showSettings)}
            settings={settings}
            onSettingsChange={setSettings}
            t={t}
          />
          <Card
            {...getRootProps()}
            className={cn(
              "flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed px-6 py-10 text-center transition",
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
              {isMobile ? t.uploadMobile : t.uploadDesktop}
            </div>
            <div className="text-sm text-slate-500">{t.uploadSupport}</div>
          </Card>
        </div>

        {hasItems && !isMobile && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-600">
              {t.readySummary(successItems.length, pendingCount)}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={clearAll}>
                <Trash2 className="h-4 w-4" />
                {t.clearAll}
              </Button>
              <Button
                onClick={handleDownloadAll}
                disabled={!hasSuccess || isZipping}
              >
                <Download className="h-4 w-4" />
                {isZipping ? t.packaging : t.downloadAllZip}
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
                statusCopy={t.status}
                downloadLabel={t.download}
                errorFallback={t.errorFallback}
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
              {t.clearAll}
            </Button>
            <Button
              className="flex-[1.4]"
              onClick={handleDownloadAll}
              disabled={!hasSuccess || isZipping}
            >
              <Download className="h-4 w-4" />
              {isZipping ? t.packaging : t.downloadAll}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
