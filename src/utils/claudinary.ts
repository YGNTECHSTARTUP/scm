import { v2 as cloudinary } from "cloudinary";

// ✅ Configure once globally
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export async function uploadToCloudinary(
  file: File | Buffer,
  folder = "uploads"
): Promise<string> {
  try {
    let uploadResult;

    if (Buffer.isBuffer(file)) {
      // 📂 If file is a Buffer (e.g., from multipart form)
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "auto", // auto-detect image/pdf/video
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file);
      });
    } else {
      // 📄 If file is a File object (from FormData in Hono)
      const arrayBuffer = await (file as File).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
    }

    // ✅ Return the secure URL
    return (uploadResult as any).secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    throw new Error("Failed to upload file");
  }
}
