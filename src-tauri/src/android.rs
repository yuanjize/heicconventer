#[cfg(target_os = "android")]
use jni::objects::{JValue, JByteArray};
#[cfg(target_os = "android")]
use jni::sys::jint;

#[cfg(target_os = "android")]
pub fn convert_heic_android(data: &[u8], format: &str, quality: u8) -> Result<Vec<u8>, String> {
    log::info!("JNI: Starting conversion. Input size: {} bytes", data.len());

    let ctx = ndk_context::android_context();
    let vm = unsafe { jni::JavaVM::from_raw(ctx.vm().cast()) }.map_err(|e| e.to_string())?;
    let mut env = vm.attach_current_thread().map_err(|e| e.to_string())?;

    // 1. Prepare input bytes
    let data_jarray = env.byte_array_from_slice(data).map_err(|e| format!("Failed to create JArray: {}", e))?;
    
    // 2. Decode bytes using BitmapFactory
    log::info!("JNI: Calling BitmapFactory.decodeByteArray");
    let bitmap_factory = env.find_class("android/graphics/BitmapFactory").map_err(|e| e.to_string())?;
    let bitmap = env.call_static_method(
        bitmap_factory,
        "decodeByteArray",
        "([BII)Landroid/graphics/Bitmap;",
        &[
            JValue::Object(&data_jarray.into()),
            JValue::Int(0),
            JValue::Int(data.len() as jint)
        ],
    ).map_err(|e| format!("BitmapFactory execution failed: {}", e))?;

    let bitmap_obj = bitmap.l().map_err(|e| e.to_string())?;
    if bitmap_obj.is_null() {
        return Err("BitmapFactory returned null. The HEIC data might be corrupt or unsupported by this Android version.".to_string());
    }

    // 3. Prepare output stream
    let output_stream_cls = env.find_class("java/io/ByteArrayOutputStream").map_err(|e| e.to_string())?;
    let output_stream = env.new_object(output_stream_cls, "()V", &[]).map_err(|e| e.to_string())?;

    // 4. Compress
    let fmt_cls = env.find_class("android/graphics/Bitmap$CompressFormat").map_err(|e| e.to_string())?;
    let fmt_field = if format == "image/png" { "PNG" } else { "JPEG" };
    log::info!("JNI: Compressing to {}", fmt_field);
    
    let compress_fmt = env.get_static_field(fmt_cls, fmt_field, "Landroid/graphics/Bitmap$CompressFormat;")
        .map_err(|e| e.to_string())?
        .l()
        .map_err(|e| e.to_string())?;

    let success = env.call_method(
        &bitmap_obj,
        "compress",
        "(Landroid/graphics/Bitmap$CompressFormat;ILjava/io/OutputStream;)Z",
        &[
            JValue::Object(&compress_fmt),
            JValue::Int(quality as jint),
            JValue::Object(&output_stream)
        ],
    ).map_err(|e| format!("Compression call failed: {}", e))?.z().map_err(|e| e.to_string())?;

    if !success {
        return Err("Android Bitmap.compress returned false".to_string());
    }

    // 5. Get bytes
    let bytes_obj = env.call_method(output_stream, "toByteArray", "()[B", &[])
        .map_err(|e| e.to_string())?
        .l()
        .map_err(|e| e.to_string())?;
    
    let byte_array: &JByteArray = (&bytes_obj).into();
    let bytes = env.convert_byte_array(byte_array).map_err(|e| e.to_string())?;

    log::info!("JNI: Conversion successful. Output size: {} bytes", bytes.len());
    Ok(bytes)
}

#[cfg(not(target_os = "android"))]
pub fn convert_heic_android(_data: &[u8], _format: &str, _quality: u8) -> Result<Vec<u8>, String> {
    Err("Native conversion only available on Android".to_string())
}