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

  // VAD Configuration
  const VOICE_THRESHOLD = 0.02; // Energy threshold for voice detection
  const SILENCE_DURATION = 1500; // ms of silence before stopping

  // Start listening
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setIsListening(true);

      // Setup Audio Context for VAD
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Setup MediaRecorder for capturing audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        setAudioChunks(chunks);
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
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    setIsListening(false);
    setIsTalking(false);
    setAudioChunks([]);
  }, []);

  // Voice Activity Detection Logic
  const detectVoiceActivity = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      if (!isListening) return;

      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) energy
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Voice detected
      if (rms > VOICE_THRESHOLD) {
        if (!isTalking) {
          console.log("Voice detected - starting recording");
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
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log("Silence detected - stopping recording");
            setIsTalking(false);
            
            // Stop recording
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              mediaRecorderRef.current.stop();
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

  return {
    isTalking,
    isListening,
    audioChunks,
    startListening,
    stopListening,
  };
}

export default useMicrophoneAutoVAD;