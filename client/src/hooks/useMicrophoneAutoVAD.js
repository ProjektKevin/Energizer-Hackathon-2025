import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Voice Activity Detection using Web Audio API
 * Detects when user is speaking vs silence
 */
function useMicrophoneAutoVAD() {
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const isListeningRef = useRef(false);
  const isTalkingRef = useRef(false);

  // VAD Configuration
  const VOICE_THRESHOLD = 0.02; // Energy threshold for voice detection
  const SILENCE_DURATION = 1500; // ms of silence before considering user stopped talking

  /**
   * Start listening for voice activity
   */
  const startListening = useCallback(async () => {
    console.log("🎬 startListening called");
    try {
      console.log("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          // Note: Browser may not honor this exact sample rate
          // The AudioContext in useAssemblyAIStream will handle resampling
          sampleRate: 16000,
        },
      });

      console.log("✅ Microphone access granted");

      const audioTrack = stream.getAudioTracks()[0];
      console.log("🎤 Audio track:", audioTrack.label);
      console.log("🎤 Settings:", audioTrack.getSettings());

      mediaStreamRef.current = stream;
      setIsListening(true);
      isListeningRef.current = true;

      // Setup Audio Context for VAD only
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      console.log("🔗 Audio source connected to analyser for VAD");
      console.log("🎤 AudioContext state:", audioContext.state);

      // Start VAD monitoring
      detectVoiceActivity();

      // Return the stream so it can be used by useAssemblyAIStream
      return stream;
    } catch (error) {
      console.error("❌ Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
      return null;
    }
  }, []);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    console.log("🛑 stopListening called");

    isListeningRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    setIsListening(false);
    setIsTalking(false);
    isTalkingRef.current = false;
  }, []);

  /**
   * Voice Activity Detection Logic
   */
  const detectVoiceActivity = () => {
    console.log("👂 detectVoiceActivity started");
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      if (!isListeningRef.current) {
        console.log("🛑 VAD loop stopped");
        return;
      }

      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) energy
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Log occasionally to avoid spam
      if (Math.random() < 0.01) {
        console.log("🎵 RMS:", rms.toFixed(4));
      }

      // Voice detected
      if (rms > VOICE_THRESHOLD) {
        if (!isTalkingRef.current) {
          console.log("🎤 Voice detected - user started talking");
          console.log("   RMS value:", rms.toFixed(4));
          setIsTalking(true);
          isTalkingRef.current = true;
        }

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
      // Silence detected while talking
      else if (isTalkingRef.current) {
        if (!silenceTimeoutRef.current) {
          console.log("🤫 Silence detected, starting timer...");
          silenceTimeoutRef.current = setTimeout(() => {
            console.log("⏹️ User stopped talking (1.5s silence)");
            setIsTalking(false);
            isTalkingRef.current = false;
            silenceTimeoutRef.current = null;
          }, SILENCE_DURATION);
        }
      }

      // Continue monitoring
      requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  /**
   * Mute/unmute the microphone
   */
  const setMuted = useCallback((muted) => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !muted;
        console.log("🎤 Audio track enabled:", audioTrack.enabled);
      }
    }
  }, []);

  /**
   * Get the current media stream
   */
  const getMediaStream = useCallback(() => {
    return mediaStreamRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isTalking,
    isListening,
    startListening,
    stopListening,
    setMuted,
    getMediaStream,
  };
}

export default useMicrophoneAutoVAD;
