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
        console.log("   URL:", assemblyUrl.substring(0, 70) + "...");
        console.log("   Ready state:", assemblyWs.readyState);
        isAssemblyConnected = true;

        if (audioBuffer.length > 0) {
          console.log(`📤 Sending ${audioBuffer.length} buffered audio chunks...`);
          audioBuffer.forEach((audioBase64, index) => {
            if (assemblyWs.readyState === WebSocket.OPEN) {
              assemblyWs.send(
                JSON.stringify({
                  audio_data: audioBase64,
                })
              );
              if (index === 0) {
                console.log(`   First chunk size: ${audioBase64.length} chars`);
              }
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
        console.error("   Error message:", error.message);
        console.error("   Error code:", error.code);
        clientWs.send(
          JSON.stringify({
            type: "error",
            message: "Speech-to-text service error",
          })
        );
      });

      // AssemblyAI connection closed
      assemblyWs.on("close", (code, reason) => {
        console.log("🔌 Disconnected from AssemblyAI");
        console.log("   Close code:", code);
        console.log("   Close reason:", reason.toString());
        isAssemblyConnected = false;
      });
    };

    // Initialize connection to AssemblyAI
    connectToAssemblyAI();

    // Receive audio data from client
    let messageCount = 0;
    clientWs.on("message", (message) => {
      messageCount++;

      // Prepare audio data
      let audioBase64;
      try {
        // Log first message for debugging
        if (messageCount === 1) {
          console.log("📥 First message from client:");
          console.log("   Type:", typeof message);
          console.log("   Is Buffer:", Buffer.isBuffer(message));
          console.log("   Length:", message.length);
          if (Buffer.isBuffer(message)) {
            const str = message.toString('utf-8', 0, Math.min(50, message.length));
            console.log("   Content preview:", str);
          }
        }

        if (typeof message === 'string') {
          // Already base64 encoded string
          audioBase64 = message;
        } else if (Buffer.isBuffer(message)) {
          // WebSocket messages from browser are received as Buffer
          // If the client sent a string, it will be in the buffer
          // Try to treat it as a string first
          const asString = message.toString('utf-8');
          // Check if it looks like base64 (only contains base64 chars)
          if (/^[A-Za-z0-9+/=]+$/.test(asString)) {
            audioBase64 = asString;
            if (messageCount === 1) {
              console.log("   ✅ Treating as base64 string");
            }
          } else {
            // It's binary data, convert to base64
            audioBase64 = message.toString("base64");
            if (messageCount === 1) {
              console.log("   ✅ Converting binary to base64");
            }
          }
        } else {
          // ArrayBuffer - convert to base64
          audioBase64 = Buffer.from(message).toString("base64");
        }
      } catch (error) {
        console.error("Error processing audio message:", error);
        return;
      }

      // Forward audio chunks to AssemblyAI or buffer if not connected
      if (isAssemblyConnected && assemblyWs.readyState === WebSocket.OPEN) {
        try {
          assemblyWs.send(
            JSON.stringify({
              audio_data: audioBase64,
            })
          );
        } catch (error) {
          console.error("Error forwarding audio to AssemblyAI:", error);
        }
      } else {
        // Buffer audio until AssemblyAI connects
        if (audioBuffer.length < 100) { // Limit buffer size to prevent memory issues
          audioBuffer.push(audioBase64);
          if (audioBuffer.length === 1) {
            console.log("🔄 Buffering audio chunks until AssemblyAI connects...");
          }
        }
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
