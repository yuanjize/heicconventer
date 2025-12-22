import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tauriDir = path.join(rootDir, 'src-tauri');
const androidDir = path.join(tauriDir, 'gen', 'android');
const jniLibsDir = path.join(androidDir, 'app', 'src', 'main', 'jniLibs');
const assetsDir = path.join(androidDir, 'app', 'src', 'main', 'assets');
const distDir = path.join(rootDir, 'dist');

const targets = [
  { rust: 'aarch64-linux-android', android: 'arm64-v8a' },
  { rust: 'armv7-linux-androideabi', android: 'armeabi-v7a' }
];

function run(command, cwd = rootDir) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', cwd, env: process.env });
}

console.log('Start building optimized Android APK (ARM Only)...');

// 1. Build Frontend
console.log('Building Frontend...');
run('npm run build');

// 2. Sync Assets
console.log('Syncing Web Assets to Android...');
if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true, force: true });
}
fs.mkdirSync(assetsDir, { recursive: true });
fs.cpSync(distDir, assetsDir, { recursive: true });

// 3. Compile Rust
console.log('Compiling Rust Native Libs (Release, Stripped)...');

const cargoPath = path.join(process.env.USERPROFILE, '.cargo', 'bin', 'cargo');

targets.forEach(target => {
  console.log(`Compiling ${target.rust}...`);
  run(`${cargoPath} build --target ${target.rust} --release`, tauriDir);
  
  // 4. Copy .so files
  const sourceLib = path.join(tauriDir, 'target', target.rust, 'release', 'libheic_converter_lib.so');
  const destDir = path.join(jniLibsDir, target.android);
  
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  
  console.log(`Copying lib -> ${target.android}`);
  fs.copyFileSync(sourceLib, path.join(destDir, 'libheic_converter_lib.so'));
});

// 5. Gradle Build
console.log('Running Gradle Build...');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

// Ensure ANDROID_HOME is set
if (!process.env.ANDROID_HOME) {
  process.env.ANDROID_HOME = path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk');
}

// Using assembleDebug for testing convenience
run(`${gradlew} assembleDebug`, androidDir);

console.log('Build Complete!');
console.log(`APK Path: ${path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')}`);