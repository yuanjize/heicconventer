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
  Moon,
  Sun,
  Smartphone,
  X,
} from "lucide-react";

import type { HeicItem, ConversionSettings } from "./types";
import { ImageCard } from "./components/ImageCard";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { SettingsPanel } from "./components/SettingsPanel";
import { cn } from "./lib/utils";
import { useHeicConverter } from "./hooks/useHeicConverter";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type Locale = "en" | "zh" | "es";
type Theme = "light" | "dark";

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
  installLabel: string;
  iosInstallStep: string;
  heroTaglineShort: string;
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
    heroTaglineShort: "Free • Fast • Private • Secure",
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
    installLabel: "Install App",
    iosInstallStep: "Tap Share then 'Add to Home Screen'",
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
    heroTaglineShort: "免费 · 快速 · 隐私 · 安全",
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
    installLabel: "安装应用",
    iosInstallStep: "点击‘分享’按钮，然后选择‘添加到主屏幕’",
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
    heroTaglineShort: "Gratis · Rápido · Privado · Seguro",
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
    installLabel: "Instalar App",
    iosInstallStep: "Pulsa Compartir y luego 'Añadir a la pantalla de inicio'",
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
  const [theme, setTheme] = useState<Theme>("light");
  const [showSettings, setShowSettings] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>({
    format: "image/jpeg",
    quality: 0.8,
  });

  const t = translations[locale];

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already in standalone mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;

    if (!standalone) {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowInstallBanner(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      if (ios) {
        setShowInstallBanner(true);
      }

      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }
  }, []);

  useEffect(() => {
    const isDarkStored =
      localStorage.getItem("heic-theme") === "dark" ||
      (!("heic-theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setTheme(isDarkStored ? "dark" : "light");
    if (isDarkStored) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("heic-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("heic-theme", "light");
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      void deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };

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
        "relative min-h-screen overflow-hidden text-slate-900 transition-colors duration-300 dark:text-slate-100",
        "bg-[radial-gradient(1200px_circle_at_20%_10%,#ffe8b0_0%,transparent_60%),radial-gradient(900px_circle_at_85%_15%,#c6f0ff_0%,transparent_55%),linear-gradient(140deg,#fff7e8_0%,#eefbf3_45%,#eaf7ff_100%)]",
        "dark:bg-[radial-gradient(1200px_circle_at_20%_10%,#1e293b_0%,transparent_60%),radial-gradient(900px_circle_at_85%_15%,#0f172a_0%,transparent_55%),linear-gradient(140deg,#020617_0%,#0f172a_45%,#1e293b_100%)]"
      )}
    >
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-900/20" />
      <div className="pointer-events-none absolute -right-10 top-40 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-900/20" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20" />

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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                {t.heroKicker}
              </p>
              <h1 className="font-['Fraunces'] text-3xl font-semibold tracking-tight md:text-4xl">
                {t.heroTitle}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{t.heroTagline}</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Badge className="w-fit dark:bg-slate-800 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4" />
              {t.privacyBadge}
            </Badge>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.languageLabel}</span>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
                >
                  {Object.entries(translations).map(([value, data]) => (
                    <option key={value} value={value}>
                      {data.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {showInstallBanner && (
          <div className="mt-6 flex animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 backdrop-blur-sm dark:border-amber-900/30 dark:bg-amber-900/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {t.installLabel}
                  </p>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400/80">
                    {isIOS ? t.iosInstallStep : t.heroTaglineShort}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isIOS && deferredPrompt && (
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="h-9 bg-amber-600 px-4 text-xs hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                  >
                    {t.installLabel}
                  </Button>
                )}
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 max-w-3xl text-base text-slate-600 dark:text-slate-300">{t.description}</div>

        <div className="mt-8 flex flex-col gap-4">
          <SettingsPanel
            isOpen={showSettings}
            onToggle={() => setShowSettings(!showSettings)}
            settings={settings}
            onSettingsChange={setSettings}
            showInstall={showInstallBanner}
            onInstall={handleInstall}
            isIOS={isIOS}
            t={t}
          />
          <Card
            {...getRootProps()}
            className={cn(
              "flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed px-6 py-10 text-center transition",
              isDragActive
                ? "border-slate-900 bg-white/90 dark:border-slate-100 dark:bg-slate-800/90"
                : "border-slate-300 bg-white/70 dark:border-slate-700 dark:bg-slate-900/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <CloudUpload className="h-6 w-6" />
            </div>
            <div className="text-lg font-semibold">
              {isMobile ? t.uploadMobile : t.uploadDesktop}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{t.uploadSupport}</div>
          </Card>
        </div>

        {hasItems && !isMobile && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/60 bg-white/85 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
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