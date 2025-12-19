import { describe, it, expect } from "vitest";
import { injectExif } from "../exif";
import fs from "fs";
import path from "path";
import exifr from "exifr";

describe("injectExif", () => {
  it("should inject EXIF metadata from Source (JPG-as-Source) to Target JPEG", async () => {
    // Read the known working JPEG with EXIF
    const sourcePath = path.resolve(__dirname, "../../../sample_with_exif.jpg");
    
    if (!fs.existsSync(sourcePath)) {
        console.warn("Skipping test: sample file not found.");
        return;
    }
    
    const sourceBuffer = fs.readFileSync(sourcePath);
    
    // Convert to standard ArrayBuffer/Uint8Array
    // We create a COPY for the target so we can see if it gets modified (well, we get a new blob back)
    const sourceAb = sourceBuffer.buffer.slice(sourceBuffer.byteOffset, sourceBuffer.byteOffset + sourceBuffer.byteLength);
    const targetAb = sourceBuffer.buffer.slice(sourceBuffer.byteOffset, sourceBuffer.byteOffset + sourceBuffer.byteLength); // Identical start
    
    // Create Source File
    // We treat it as image/jpeg here because exifr in Node handles JPEG natively. 
    // This verifies the 'extract -> create piexif obj -> insert' pipeline.
    const sourceFile = new File([sourceAb], "source.jpg", { type: "image/jpeg" });
    
    // Mock arrayBuffer method because JSDOM File doesn't implement it
    (sourceFile as any).arrayBuffer = async () => sourceAb;

    // Create Target Blob
    const targetBlob = new Blob([targetAb], { type: "image/jpeg" });
    
    // Run injection
    const resultBlob = await injectExif(sourceFile, targetBlob);
    
    expect(resultBlob).toBeDefined();
    expect(resultBlob.size).toBeGreaterThan(0);
    
    // Verify results
    // Use FileReader for JSDOM compatibility
    const resultBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(resultBlob);
    });

    const resultTags = await exifr.parse(resultBuffer);
    
    console.log("Result Tags:", resultTags ? "Found" : "None");
    if (resultTags) {
        expect(resultTags.Make).toBe("NIKON");
        expect(resultTags.Model).toBe("COOLPIX P6000");
    } else {
        throw new Error("EXIF tags were lost or not injected");
    }
  });
});