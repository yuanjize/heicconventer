mod android;

#[tauri::command]
async fn convert_image_native(data: Vec<u8>, format: String, quality: u8) -> Result<Vec<u8>, String> {
    #[cfg(target_os = "android")]
    {
        android::convert_heic_android(&data, &format, quality)
    }
    #[cfg(not(target_os = "android"))]
    {
        Err("Native conversion is only available on Android".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  #[cfg(target_os = "android")]
  android_logger::init_once(
      android_logger::Config::default().with_max_level(log::LevelFilter::Trace),
  );

  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![convert_image_native])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
