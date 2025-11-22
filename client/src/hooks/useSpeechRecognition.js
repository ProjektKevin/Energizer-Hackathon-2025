import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Speech-to-Text using browser's built-in Web Speech API
 * Free, fast, and works great for conversational AI
 */
function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const isMutedRef = useRef(false);

  // Minimum transcript length to avoid processing background noise
  const MIN_TRANSCRIPT_LENGTH = 5;

  /**
   * Initialize and start speech recognition
   */
  const start = useCallback(() => {
    console.log("🎤 Starting browser speech recognition...");

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("❌ Speech Recognition not supported in this browser");
      alert("Speech Recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    try {
      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Get partial results
      recognition.lang = "en-US"; // Language
      recognition.maxAlternatives = 1; // Only need best result

      console.log("⚙️ Speech recognition configured");
      console.log("   Language:", recognition.lang);
      console.log("   Continuous:", recognition.continuous);
      console.log("   Interim results:", recognition.interimResults);

      // Handle results
      recognition.onresult = (event) => {
        // Don't process if muted
        if (isMutedRef.current) {
          console.log("🔇 Muted - ignoring speech input");
          return;
        }

        let interimTranscript = "";
        let finalText = "";

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;

          if (result.isFinal) {
            finalText += transcriptPart + " ";
            console.log("✅ Final result:", transcriptPart);
          } else {
            interimTranscript += transcriptPart;
          }
        }

        // Update transcript (interim results for real-time display)
        if (interimTranscript && interimTranscript.trim().length >= 2) {
          setTranscript(interimTranscript);
        }

        // Update final transcript (triggers AI processing)
        // Filter out short transcripts (likely background noise)
        if (finalText.trim() && finalText.trim().length >= MIN_TRANSCRIPT_LENGTH) {
          const fullFinalTranscript = finalText.trim();
          console.log("🎯 Final transcript:", fullFinalTranscript);
          setFinalTranscript(fullFinalTranscript);
          setTranscript(fullFinalTranscript);
        } else if (finalText.trim()) {
          console.log("⚠️ Ignoring short transcript (likely noise):", finalText.trim());
        }
      };

      // Handle start
      recognition.onstart = () => {
        console.log("✅ Speech recognition started");
        setIsListening(true);
        isListeningRef.current = true;
      };

      // Handle end
      recognition.onend = () => {
        console.log("🔌 Speech recognition ended");

        // Auto-restart if still supposed to be listening
        // This handles the automatic timeout that browsers impose
        if (isListeningRef.current) {
          console.log("🔄 Auto-restarting speech recognition...");
          try {
            recognition.start();
          } catch (error) {
            console.log("⚠️ Could not auto-restart:", error.message);
          }
        } else {
          setIsListening(false);
        }
      };

      // Handle errors
      recognition.onerror = (event) => {
        console.error("❌ Speech recognition error:", event.error);

        // Handle specific errors
        if (event.error === "no-speech") {
          console.log("⚠️ No speech detected, continuing to listen...");
          // Don't stop - this is normal when user pauses
        } else if (event.error === "aborted") {
          console.log("⚠️ Recognition aborted");
        } else if (event.error === "not-allowed") {
          alert("Microphone permission denied. Please allow microphone access.");
          setIsListening(false);
          isListeningRef.current = false;
        } else {
          console.log("⚠️ Error occurred, will auto-restart");
        }
      };

      // Start recognition
      recognition.start();

    } catch (error) {
      console.error("❌ Error starting speech recognition:", error);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, []);

  /**
   * Stop speech recognition
   */
  const stop = useCallback(() => {
    console.log("🛑 Stopping speech recognition...");
    isListeningRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log("⚠️ Error stopping recognition:", error.message);
      }
    }

    setIsListening(false);
  }, []);

  /**
   * Reset transcripts
   */
  const resetTranscript = useCallback(() => {
    console.log("🔄 Resetting transcripts");
    setTranscript("");
    setFinalTranscript("");
  }, []);

  /**
   * Mute/unmute the microphone
   */
  const setMuted = useCallback((muted) => {
    console.log(muted ? "🔇 Muting microphone" : "🔊 Unmuting microphone");
    setIsMuted(muted);
    isMutedRef.current = muted;

    // Clear transcripts when muting
    if (muted) {
      setTranscript("");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    transcript,
    finalTranscript,
    isListening,
    isMuted,
    start,
    stop,
    resetTranscript,
    setMuted,
  };
}

export default useSpeechRecognition;
