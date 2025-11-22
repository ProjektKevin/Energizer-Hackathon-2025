import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Text-to-Speech hook using browser's built-in SpeechSynthesis API
 * Provides natural voice feedback for AI responses
 */
function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);
  const selectedVoiceRef = useRef(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Select a good default voice (prefer English, female, natural-sounding)
      const preferredVoice =
        availableVoices.find((v) => v.name.includes("Google US English")) ||
        availableVoices.find((v) => v.lang === "en-US" && v.name.includes("Female")) ||
        availableVoices.find((v) => v.lang === "en-US") ||
        availableVoices[0];

      if (preferredVoice) {
        selectedVoiceRef.current = preferredVoice;
        console.log("🔊 Selected voice:", preferredVoice.name);
      }
    };

    loadVoices();

    // Voices might load asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      // Cleanup
      window.speechSynthesis.cancel();
    };
  }, []);

  /**
   * Speak the given text
   */
  const speak = useCallback((text) => {
    if (!text || text.trim().length === 0) {
      console.log("⚠️ No text to speak");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    console.log("🔊 Speaking:", text.substring(0, 50) + "...");

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure voice
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }

    // Configure speech parameters
    utterance.rate = 1.0; // Speed (0.1 - 10)
    utterance.pitch = 1.0; // Pitch (0 - 2)
    utterance.volume = 1.0; // Volume (0 - 1)

    // Event handlers
    utterance.onstart = () => {
      console.log("🔊 Speech started");
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log("✅ Speech ended");
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("❌ Speech error:", event.error);
      setIsSpeaking(false);
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  }, []);

  /**
   * Stop speaking
   */
  const stop = useCallback(() => {
    console.log("🛑 Stopping speech");
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  /**
   * Pause speaking
   */
  const pause = useCallback(() => {
    console.log("⏸️ Pausing speech");
    window.speechSynthesis.pause();
  }, []);

  /**
   * Resume speaking
   */
  const resume = useCallback(() => {
    console.log("▶️ Resuming speech");
    window.speechSynthesis.resume();
  }, []);

  /**
   * Change voice
   */
  const setVoice = useCallback((voiceName) => {
    const voice = voices.find((v) => v.name === voiceName);
    if (voice) {
      selectedVoiceRef.current = voice;
      console.log("🔊 Voice changed to:", voice.name);
    }
  }, [voices]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    voices,
    setVoice,
  };
}

export default useTextToSpeech;
