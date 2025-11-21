/**
 * Convert data URL to base64 string (removes prefix)
 */
export const dataUrlToBase64 = (dataUrl) => {
  if (!dataUrl) return null;
  return dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
};

/**
 * Resize image to fit within max dimensions
 */
export const resizeImage = (dataUrl, maxWidth = 1024, maxHeight = 1024) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = dataUrl;
  });
};

/**
 * Compress image quality
 */
export const compressImage = (dataUrl, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
};

/**
 * Get image dimensions from data URL
 */
export const getImageDimensions = (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.src = dataUrl;
  });
};

/**
 * Check if browser supports camera
 */
export const checkCameraSupport = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Capture frame from video element
 */
export const captureVideoFrame = (videoElement, quality = 0.8) => {
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElement, 0, 0);

  return canvas.toDataURL("image/jpeg", quality);
};