import { useState, useCallback } from "react";
import axios from "axios";

function useMultimodalAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendToAI = useCallback(async ({ transcript, image }) => {
    if (!transcript) {
      console.log("No transcript to send");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract base64 data from data URL if needed
      let imageBase64 = null;
      if (image) {
        // Remove data URL prefix if present
        imageBase64 = image.includes("base64,")
          ? image.split("base64,")[1]
          : image;
      }

      const response = await axios.post(
        "/api/assistant/process",
        {
          transcript,
          image: imageBase64,
        }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to process request");
      }
    } catch (err) {
      console.error("Error sending to AI:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendToAI,
    loading,
    error,
  };
}

export default useMultimodalAI;