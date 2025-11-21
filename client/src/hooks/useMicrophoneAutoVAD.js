import { useState, useRef, useEffect, useCallback } from "react";

// Voice Activity Detection using Web Audio API
function useMicrophoneAutoVAD() {
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);

  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const isListeningRef = useRef(false);
  const audioChunksRef = useRef([]); // 🆕 Use ref for chunks to avoid closure issues

  // VAD Configuration
  const VOICE_THRESHOLD = 0.02; // Energy threshold for voice detection
  const SILENCE_DURATION = 1500; // ms of silence before stopping

  // Start listening
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
          sampleRate: 48000,
        },
      });

      console.log("✅ Microphone access granted!", stream);

      const audioTrack = stream.getAudioTracks()[0];
      console.log("🎤 Audio track:", audioTrack);
      console.log("🎤 Track enabled:", audioTrack.enabled);
      console.log("🎤 Track muted:", audioTrack.muted);
      console.log("🎤 Track settings:", audioTrack.getSettings());

      mediaStreamRef.current = stream;
      setIsListening(true);
      isListeningRef.current = true;

      // Setup Audio Context for VAD
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      console.log("🔗 Audio source connected to analyser");
      console.log("🎤 AudioContext state:", audioContext.state);

      // Setup MediaRecorder for capturing audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      // 🆕 FIXED: Reset chunks ref
      audioChunksRef.current = [];

      // 🆕 FIXED: Use ref to store chunks
      mediaRecorder.ondataavailable = (e) => {
        console.log("📦 Audio chunk available, size:", e.data.size);
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log("✅ Chunk added. Total chunks:", audioChunksRef.current.length);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("🏁 MediaRecorder stopped. Total chunks:", audioChunksRef.current.length);
        console.log("📦 Chunks array:", audioChunksRef.current);
        // 🆕 FIXED: Copy array to trigger state update
        setAudioChunks([...audioChunksRef.current]);
        console.log("✅ Audio chunks set to state");
      };

      // 🆕 ADD: More event listeners for debugging
      mediaRecorder.onstart = () => {
        console.log("▶️ MediaRecorder started");
      };

      mediaRecorder.onerror = (e) => {
        console.error("❌ MediaRecorder error:", e);
      };

      // Start VAD monitoring
      detectVoiceActivity();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log("🛑 stopListening called");

    isListeningRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    setIsListening(false);
    setIsTalking(false);
    setAudioChunks([]);
    audioChunksRef.current = []; // 🆕 Clear ref too
  }, []);

  // Voice Activity Detection Logic
  const detectVoiceActivity = () => {
    console.log("👂 detectVoiceActivity started");
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      if (!isListeningRef.current) {
        console.log("🛑 Loop stopped - isListeningRef is false");
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

      // Only log occasionally to avoid spam
      if (Math.random() < 0.03) {
        console.log("🎵 RMS:", rms.toFixed(4));
      }

      // Voice detected
      if (rms > VOICE_THRESHOLD) {
        if (!isTalking) {
          console.log("🎤 Voice detected - starting recording");
          console.log("RMS value:", rms);
          setIsTalking(true);

          // Start recording
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "inactive"
          ) {
            mediaRecorderRef.current.start(100); // Collect data every 100ms
          }
        }

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
      // Silence detected while talking
      else if (isTalking) {
        console.log("🤫 Silence detected, RMS:", rms);
        if (!silenceTimeoutRef.current) {
          console.log("⏰ Starting 1.5s silence timer...");
          silenceTimeoutRef.current = setTimeout(() => {
            console.log("⏹️ Stopping recording after 1.5s silence");
            console.log("📊 MediaRecorder state:", mediaRecorderRef.current?.state);
            setIsTalking(false);

            // Stop recording
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              console.log("🛑 Calling mediaRecorder.stop()");
              mediaRecorderRef.current.stop();
            } else {
              console.log("⚠️ MediaRecorder not in recording state!");
            }

            silenceTimeoutRef.current = null;
          }, SILENCE_DURATION);
        }
      }

      // Continue monitoring
      requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const setMuted = useCallback((muted) => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !muted;
        console.log("🎤 Audio track enabled:", audioTrack.enabled);
      }
    }
  }, []);

  return {
    isTalking,
    isListening,
    audioChunks,
    startListening,
    stopListening,
    setMuted,
  };
}

export default useMicrophoneAutoVAD;