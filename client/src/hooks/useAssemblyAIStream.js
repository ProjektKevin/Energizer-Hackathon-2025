import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Real-time speech-to-text using AssemblyAI WebSocket
 * Handles audio processing and conversion to PCM format
 */
function useAssemblyAIStream() {
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);

  /**
   * Convert Float32Array audio samples to 16-bit PCM
   */
  const floatTo16BitPCM = useCallback((float32Array) => {
    const buffer = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return buffer;
  }, []);

  /**
   * Convert ArrayBuffer to Base64 string
   */
  const arrayBufferToBase64 = useCallback((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }, []);

  /**
   * Connect to backend WebSocket and start streaming
   */
  const connect = useCallback(async (mediaStream) => {
    console.log("🎬 Connecting to STT WebSocket...");

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Create WebSocket connection
      const ws = new WebSocket("ws://localhost:8080/api/stt-stream");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);

        // Setup audio processing
        setupAudioProcessing(mediaStream);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📥 Received:", data);

          if (data.type === "partial") {
            // Update transcript in real-time
            console.log("📝 Partial:", data.text);
            setTranscript(data.text);
          } else if (data.type === "final") {
            // Final transcript - triggers AI processing
            console.log("✅ Final:", data.text);
            setTranscript(data.text);
            setFinalTranscript(data.text);
          } else if (data.type === "connection") {
            console.log("🔗 Connection status:", data.message);
          }
        } catch (error) {
          console.error("❌ Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket closed");
        setIsConnected(false);
        cleanupAudioProcessing();
      };
    } catch (error) {
      console.error("❌ Error creating WebSocket:", error);
      setIsConnected(false);
    }
  }, []);

  /**
   * Setup audio processing pipeline
   */
  const setupAudioProcessing = useCallback((mediaStream) => {
    console.log("🎵 Setting up audio processing...");

    try {
      // Create AudioContext with 16kHz sample rate (required by AssemblyAI)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      // Create source from microphone stream
      const source = audioContext.createMediaStreamSource(mediaStream);
      sourceRef.current = source;

      // Create ScriptProcessorNode to process audio chunks
      // 4096 samples = ~256ms at 16kHz
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Process each audio chunk
      let chunkCount = 0;
      processor.onaudioprocess = (audioEvent) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Get raw audio data (Float32Array)
          const inputData = audioEvent.inputBuffer.getChannelData(0);

          // Convert to 16-bit PCM
          const pcmData = floatTo16BitPCM(inputData);

          // Convert to base64
          const base64Audio = arrayBufferToBase64(pcmData.buffer);

          // Send to backend WebSocket
          wsRef.current.send(base64Audio);

          // Log first chunk for debugging
          chunkCount++;
          if (chunkCount === 1) {
            console.log("📤 First audio chunk sent");
            console.log("   Chunk size:", base64Audio.length, "chars");
            console.log("   Sample:", base64Audio.substring(0, 50) + "...");
          }
        }
      };

      // Connect the audio processing chain
      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log("✅ Audio processing setup complete");
      console.log("   Sample rate:", audioContext.sampleRate);
      console.log("   Buffer size:", processor.bufferSize);
    } catch (error) {
      console.error("❌ Error setting up audio processing:", error);
    }
  }, [floatTo16BitPCM, arrayBufferToBase64]);

  /**
   * Cleanup audio processing
   */
  const cleanupAudioProcessing = useCallback(() => {
    console.log("🧹 Cleaning up audio processing...");

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  /**
   * Disconnect and cleanup
   */
  const disconnect = useCallback(() => {
    console.log("🛑 Disconnecting from WebSocket...");

    cleanupAudioProcessing();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [cleanupAudioProcessing]);

  /**
   * Reset transcripts
   */
  const resetTranscript = useCallback(() => {
    console.log("🔄 Resetting transcripts");
    setTranscript("");
    setFinalTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    transcript,
    finalTranscript,
    isConnected,
    connect,
    disconnect,
    resetTranscript,
  };
}

export default useAssemblyAIStream;
