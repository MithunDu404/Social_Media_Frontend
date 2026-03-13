/**
 * Cloudinary unsigned upload utility.
 *
 * Uploads a file directly from the browser to Cloudinary using their
 * unsigned upload API.  No backend proxy required.
 *
 * Env vars needed in .env.local:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */

export interface UploadResult {
  url: string;
  content_type: string;
  size: number;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

/**
 * Upload a single file to Cloudinary.
 *
 * @param file  The File object to upload.
 * @param onProgress  Optional callback receiving 0–100.
 * @returns  `{ url, content_type, size }` matching the backend Media schema.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          content_type: data.resource_type + "/" + data.format, // e.g. "image/jpeg"
          size: data.bytes,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

/**
 * Upload multiple files in parallel, aggregating per-file progress into
 * an overall 0–100 value.
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  onOverallProgress?: (percent: number) => void,
): Promise<UploadResult[]> {
  const progresses = new Array(files.length).fill(0);

  const report = () => {
    if (!onOverallProgress) return;
    const total = progresses.reduce((a, b) => a + b, 0);
    onOverallProgress(Math.round(total / files.length));
  };

  const promises = files.map((file, i) =>
    uploadToCloudinary(file, (p) => {
      progresses[i] = p;
      report();
    }),
  );

  return Promise.all(promises);
}
