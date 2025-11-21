import { useState, useRef, useCallback } from "react";

function useAssemblyAIStream() {
  const [transcript, setTranscript] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);

  const streamAudio = useCallback(async (audioChunks) => {
    if (audioChunks.length === 0) return;
    if (isStreaming) return; // Already streaming

    try {
      setIsStreaming(true);

      // Connect to backend WebSocket endpoint
      const ws = new WebSocket("ws://localhost:3000/api/stt-stream");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");

        // Send audio chunks
        audioChunks.forEach((chunk) => {
          if (ws.readyState === WebSocket.OPEN) {
            // Convert Blob to ArrayBuffer and send
            chunk.arrayBuffer().then((buffer) => {
              ws.send(buffer);
            });
          }
        });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Update transcript with partial or final results
        if (data.text) {
          setTranscript(data.text);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setIsStreaming(false);
      };
    } catch (error) {
      console.error("Error streaming audio:", error);
      setIsStreaming(false);
    }
  }, [isStreaming]);

  const finalizeTranscript = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsStreaming(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    transcript,
    isStreaming,
    streamAudio,
    finalizeTranscript,
    resetTranscript,
  };
}

export default useAssemblyAIStream;