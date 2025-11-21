/**
 * Convert audio blob to base64
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert audio blob to ArrayBuffer
 */
export const blobToArrayBuffer = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

/**
 * Merge multiple audio blobs into one
 */
export const mergeAudioBlobs = (blobs, mimeType = "audio/webm") => {
  return new Blob(blobs, { type: mimeType });
};

/**
 * Calculate audio energy/volume from analyser data
 */
export const calculateRMS = (dataArray) => {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / dataArray.length);
};

/**
 * Check if browser supports required audio APIs
 */
export const checkAudioSupport = () => {
  const hasGetUserMedia = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );
  const hasAudioContext = !!(
    window.AudioContext || window.webkitAudioContext
  );
  const hasMediaRecorder = !!window.MediaRecorder;

  return {
    supported: hasGetUserMedia && hasAudioContext && hasMediaRecorder,
    getUserMedia: hasGetUserMedia,
    audioContext: hasAudioContext,
    mediaRecorder: hasMediaRecorder,
  };
};