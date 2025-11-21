import { useState, useRef, useCallback } from "react";

function useAssemblyAIStream() {
  const [transcript, setTranscript] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);

  const streamAudio = useCallback(
    async (audioChunks) => {
      console.log("🎤 streamAudio called with", audioChunks.length, "chunks");

      if (audioChunks.length === 0) {
        console.log("⚠️ No audio chunks to stream");
        return;
      }
      if (isStreaming) {
        console.log("⚠️ Already streaming, ignoring call");
        return;
      }

      try {
        setIsStreaming(true);

        // 🆕 FIXED: Changed port from 3000 to 8080
        const ws = new WebSocket("ws://localhost:8080/api/stt-stream");
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected to STT service");

          // 🆕 FIXED: Added index parameter to forEach
          audioChunks.forEach((chunk, index) => {
            if (ws.readyState === WebSocket.OPEN) {
              // Convert Blob to ArrayBuffer and send
              chunk.arrayBuffer().then((buffer) => {
                ws.send(buffer);
                console.log(`📨 Sent audio chunk ${index + 1}/${audioChunks.length}`);
              });
            }
          });
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log("📥 WebSocket message received:", data);

          // Update transcript with partial or final results
          if (data.text) {
            console.log("📝 Transcript update:", data.text);
            setTranscript(data.text);
          }

          if (data.type === "final") {
            console.log("✅ Final transcript received:", data.text);
          }
        };

        ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("🔌 WebSocket closed");
          setIsStreaming(false);
        };
      } catch (error) {
        console.error("❌ Error streaming audio:", error);
        setIsStreaming(false);
      }
    },
    [isStreaming]
  );

  const finalizeTranscript = useCallback(() => {
    console.log("🏁 Finalizing transcript...");
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