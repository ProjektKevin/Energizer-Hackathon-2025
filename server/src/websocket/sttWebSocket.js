import { WebSocketServer } from "ws";
import WebSocket from "ws";

/**
 * Setup WebSocket server for real-time speech-to-text
 * Connects frontend → backend → AssemblyAI
 */
export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({
    server,
    path: "/api/stt-stream",
  });

  console.log("WebSocket server initialized at /api/stt-stream");

  wss.on("connection", (clientWs) => {
    console.log("Client connected to STT WebSocket");

    let assemblyWs = null;
    let isAssemblyConnected = false;
    const audioBuffer = [];

    // Connect to AssemblyAI real-time API
    const connectToAssemblyAI = () => {
      const assemblyApiKey = process.env.ASSEMBLY_API_KEY;

      if (!assemblyApiKey) {
        console.error("❌ ASSEMBLY_API_KEY not found in environment");
        clientWs.send(
          JSON.stringify({
            error: "Server configuration error: Missing API key",
          })
        );
        clientWs.close();
        return;
      }

      // AssemblyAI WebSocket URL
      const assemblyUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${assemblyApiKey}`;

      assemblyWs = new WebSocket(assemblyUrl);

      // AssemblyAI connection opened
      assemblyWs.on("open", () => {
        console.log("✅ Connected to AssemblyAI real-time API");
        isAssemblyConnected = true;

        if (audioBuffer.length > 0) {
          console.log(`📤 Sending ${audioBuffer.length} buffered audio chunks...`);
          audioBuffer.forEach((audioBase64) => {
            if (assemblyWs.readyState === WebSocket.OPEN) {
              assemblyWs.send(
                JSON.stringify({
                  audio_data: audioBase64,
                })
              );
            }
          });
          audioBuffer.length = 0; // Clear buffer
          console.log("✅ Buffer sent and cleared");
        }

        // Send connection success to client
        clientWs.send(
          JSON.stringify({
            type: "connection",
            status: "connected",
            message: "Connected to speech-to-text service",
          })
        );
      });

      // Receive transcripts from AssemblyAI
      assemblyWs.on("message", (data) => {
        try {
          const response = JSON.parse(data.toString());

          // AssemblyAI sends different message types
          if (response.message_type === "PartialTranscript") {
            // Partial transcript (interim results)
            clientWs.send(
              JSON.stringify({
                type: "partial",
                text: response.text,
                confidence: response.confidence,
              })
            );
          } else if (response.message_type === "FinalTranscript") {
            // Final transcript
            console.log("Final transcript:", response.text);
            clientWs.send(
              JSON.stringify({
                type: "final",
                text: response.text,
                confidence: response.confidence,
              })
            );
          } else if (response.message_type === "SessionBegins") {
            console.log("🎬 AssemblyAI session started");
          } else if (response.message_type === "SessionTerminated") {
            console.log("🛑 AssemblyAI session ended");
          }
        } catch (error) {
          console.error("Error parsing AssemblyAI message:", error);
        }
      });

      // AssemblyAI connection error
      assemblyWs.on("error", (error) => {
        console.error("❌ AssemblyAI WebSocket error:", error);
        clientWs.send(
          JSON.stringify({
            type: "error",
            message: "Speech-to-text service error",
          })
        );
      });

      // AssemblyAI connection closed
      assemblyWs.on("close", () => {
        console.log("🔌 Disconnected from AssemblyAI");
        isAssemblyConnected = false;
      });
    };

    // Initialize connection to AssemblyAI
    connectToAssemblyAI();

    // Receive audio data from client
    clientWs.on("message", (message) => {
      // Forward audio chunks to AssemblyAI
      if (isAssemblyConnected && assemblyWs.readyState === WebSocket.OPEN) {
        try {
          // Client sends audio as ArrayBuffer
          // AssemblyAI expects base64-encoded audio
          const audioBase64 = Buffer.from(message).toString("base64");

          assemblyWs.send(
            JSON.stringify({
              audio_data: audioBase64,
            })
          );
        } catch (error) {
          console.error("Error forwarding audio to AssemblyAI:", error);
        }
      } else {
        console.warn("⚠️ AssemblyAI not connected, buffering not implemented");
      }
    });

    // Client disconnected
    clientWs.on("close", () => {
      console.log("👋 Client disconnected from STT WebSocket");

      // Close AssemblyAI connection
      if (assemblyWs && assemblyWs.readyState === WebSocket.OPEN) {
        assemblyWs.close();
      }
    });

    // Client error
    clientWs.on("error", (error) => {
      console.error("❌ Client WebSocket error:", error);
    });
  });

  return wss;
};

export default setupWebSocket;
