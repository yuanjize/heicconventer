# Project Overview

This is a **hybrid HEIC to JPG/PNG Converter** application that runs both as a modern web app (PWA) and a desktop application using **Tauri 2.0**.

The core philosophy is **Privacy First**: all image conversions happen strictly on the client-side (in the browser or WebView) using WebAssembly/JS libraries, ensuring no photos are ever uploaded to a server.

## Tech Stack

*   **Frontend Framework:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Desktop Framework:** [Tauri 2.0](https://tauri.app/) (Rust backend)
*   **Core Libraries:**
    *   `heic2any`: Client-side HEIC/HEIF conversion.
    *   `exifr` / `piexifjs`: EXIF metadata extraction and injection.
    *   `jszip`: Client-side ZIP creation for batch downloads.
    *   `react-dropzone`: Drag-and-drop file handling.
    *   `lucide-react`: Iconography.

## Architecture

*   **`src/`**: Contains the React frontend application.
    *   **`components/`**: UI components. `ui/` contains reusable atoms (buttons, badges) likely following a shadcn/ui-like pattern.
    *   **`hooks/`**: Custom hooks. `useHeicConverter.ts` encapsulates the core conversion logic, queue management, and state.
    *   **`lib/`**: Utilities, including `exif.ts` for metadata handling.
    *   **`worker/`**: Web Workers (if any) for offloading heavy tasks (though `heic2any` runs on main thread usually, checking for worker usage is good practice).
*   **`src-tauri/`**: Contains the Rust project for the Tauri desktop application.
    *   **`tauri.conf.json`**: Main configuration for the Tauri app (permissions, windows, bundle settings).
    *   **`Cargo.toml`**: Rust dependencies.

## Key Features

1.  **Client-Side Conversion:** Uses `heic2any` to convert HEIC blobs to JPEG/PNG/WebP directly in the browser memory.
2.  **EXIF Preservation:** Metadata is extracted from original HEIC and re-injected into the converted JPEG (using `exif.ts`).
3.  **Tauri Integration:** Detects if running in Tauri to use native file system APIs (`@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`) for saving files, bypassing browser download prompts.
4.  **PWA Support:** Configured with `vite-plugin-pwa` for installability on mobile/web.
5.  **Internationalization:** Built-in support for English, Chinese, and Spanish.

# Building and Running

## Prerequisites

*   **Node.js** (Latest LTS recommended)
*   **Rust** (for Tauri development) - [Install Rust](https://www.rust-lang.org/tools/install)

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server for the web version. |
| `npm run tauri dev` | Starts the Tauri development window (Rust backend + Frontend). |
| `npm run build` | Builds the web frontend (TypeScript check + Vite build). |
| `npm run tauri build` | Builds the production desktop application (creates installer/executable). |
| `npm run test` | Runs unit tests using Vitest. |
| `npm run preview` | Previews the built web application locally. |

# Development Conventions

*   **Component Structure:** Functional components with strict TypeScript typing.
*   **Styling:** Utility-first CSS using Tailwind. Avoid CSS modules or styled-components unless necessary.
*   **State Management:** Local React state (`useState`, `useMemo`) is preferred for this scale. `useHeicConverter` acts as the main store for image processing state.
*   **Async Logic:** Use `async/await`. Heavy processing (conversion) is concurrency-limited using `p-limit` to avoid freezing the UI on lower-end devices.
*   **Tauri vs Web:** Use the `isTauri` check (or `window.__TAURI__`) to conditionally render or execute logic specific to the desktop environment (e.g., file system access).

## Testing

*   Tests are located in `__tests__` directories or next to the files they test.
*   Run `npm run test` to execute the test suite.
