import exifr from "exifr";
import piexif from "piexifjs";

export const injectExif = async (
  originalFile: File,
  jpegBlob: Blob
): Promise<Blob> => {
  try {
    if (!(originalFile instanceof Blob)) {
        return jpegBlob;
    }

    // 1. Parse metadata from the original HEIC file
    let buffer: ArrayBuffer;
    if (typeof originalFile.arrayBuffer === 'function') {
        buffer = await originalFile.arrayBuffer();
    } else {
        buffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(originalFile);
        });
    }

    const tags = await exifr.parse(new Uint8Array(buffer), {
      tiff: true,
      exif: true,
      gps: false, 
    });

    if (!tags) {
      return jpegBlob;
    }

    // 2. Construct the piexif object
    const exifObj: any = {
      "0th": {},
      "Exif": {},
      "GPS": {},
    };

    // Helper to safe-copy tags
    const copyTag = (
      sourceVal: any,
      targetObj: any,
      tagId: number
    ) => {
      if (sourceVal !== undefined && sourceVal !== null) {
        // Ensure primitive types for piexifjs
        if (sourceVal instanceof Date) {
            // piexifjs expects string for DateTime: "YYYY:MM:DD HH:MM:SS"
            // exifr returns Date object. Convert it.
            const toExifString = (d: Date) => {
                const pad = (n: number) => n.toString().padStart(2, '0');
                return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            };
            targetObj[tagId] = toExifString(sourceVal);
        } else {
             targetObj[tagId] = sourceVal;
        }
      }
    };

    // 0th IFD
    copyTag(tags.Make, exifObj["0th"], piexif.ImageIFD.Make);
    copyTag(tags.Model, exifObj["0th"], piexif.ImageIFD.Model);
    copyTag(tags.Software, exifObj["0th"], piexif.ImageIFD.Software);
    copyTag(tags.DateTime, exifObj["0th"], piexif.ImageIFD.DateTime);
    
    exifObj["0th"][piexif.ImageIFD.Orientation] = 1;

    // Exif IFD
    copyTag(tags.DateTimeOriginal, exifObj["Exif"], piexif.ExifIFD.DateTimeOriginal);
    copyTag(tags.DateTimeDigitized, exifObj["Exif"], piexif.ExifIFD.DateTimeDigitized);
    copyTag(tags.SubSecTimeOriginal, exifObj["Exif"], piexif.ExifIFD.SubSecTimeOriginal);
    copyTag(tags.SubSecTimeDigitized, exifObj["Exif"], piexif.ExifIFD.SubSecTimeDigitized);
    copyTag(tags.LensMake, exifObj["Exif"], piexif.ExifIFD.LensMake);
    copyTag(tags.LensModel, exifObj["Exif"], piexif.ExifIFD.LensModel);

    // 3. Create the EXIF binary string
    const exifBytes = piexif.dump(exifObj);

    // 4. Convert Blob to Base64 to insert EXIF
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(jpegBlob);
    });
    
    // 5. Insert EXIF
    const newBase64 = piexif.insert(exifBytes, base64);
    
    // 6. Convert back to Blob
    const byteCharacters = atob(newBase64.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    return new Blob([byteArray], { type: "image/jpeg" });

  } catch (error) {
    console.warn("Failed to preserve EXIF data:", error);
    return jpegBlob;
  }
};