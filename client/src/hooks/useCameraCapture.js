import { useState, useRef, useCallback, useEffect } from "react";

function useCameraCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen && streamRef.current && videoRef.current) {
      console.log("✅ Connecting stream to video element");
      videoRef.current.srcObject = streamRef.current;

      // Force video to play (sometimes needed for autoplay)
      videoRef.current.play().catch((err) => {
        console.log("Video autoplay prevented:", err);
      });
    }
  }, [isOpen]);

  // Open camera
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;
      console.log("✅ Stream obtained:", stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("✅ Video element connected:", videoRef.current);
      } else {
        console.error("❌ videoRef.current is null!");
      }

      setIsOpen(true);
      // Clear any previously captured image when opening camera
      setCapturedImage(null);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check permissions.");
    }
  }, []);

  // Close camera
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsOpen(false);
  }, []);

  // Capture image from video stream
  const captureImage = useCallback(() => {
    if (!videoRef.current || !isOpen) {
      console.error("Camera not open or video ref not available");
      return;
    }

    try {
      // Create canvas to capture frame
      const canvas = document.createElement("canvas");
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageDataUrl);

      console.log("Image captured successfully");
    } catch (error) {
      console.error("Error capturing image:", error);
    }
  }, [isOpen]);

  // Clear captured image
  const clearCapturedImage = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return {
    isOpen,
    capturedImage,
    videoRef,
    openCamera,
    closeCamera,
    captureImage,
    clearCapturedImage,
  };
}

export default useCameraCapture;
