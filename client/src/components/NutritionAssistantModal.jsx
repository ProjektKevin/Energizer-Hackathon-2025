import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TalkingIndicator from "./TalkingIndicator";
import CameraPreview from "./CameraPreview";
import ControlBar from "./ControlBar";
import AIResponseBox from "./AIResponseBox";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useCameraCapture from "@/hooks/useCameraCapture";
import useMultimodalAI from "@/hooks/useMultimodalAI";
import useTextToSpeech from "@/hooks/useTextToSpeech";

function NutritionAssistantModal({ isOpen, onClose }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Speech Recognition (browser's built-in)
  const { transcript, finalTranscript, isListening, isMuted, start, stop, resetTranscript, setMuted } =
    useSpeechRecognition();

  // Camera
  const {
    isOpen: isCameraOpen,
    capturedImage,
    videoRef,
    openCamera,
    closeCamera,
    captureImage,
  } = useCameraCapture();

  // Multimodal AI Processing
  const { sendToAI, loading: aiLoading } = useMultimodalAI();

  // Text-to-Speech for AI voice responses
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();

  // Track if we've already processed this transcript
  const processedTranscriptRef = useRef("");
  const lastTranscriptRef = useRef("");

  // Detect if user is talking (for UI indicator)
  const isTalking = transcript && transcript !== lastTranscriptRef.current;
  if (isTalking) {
    lastTranscriptRef.current = transcript;
  }

  // Start/stop speech recognition when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log("🚀 Modal opened - starting speech recognition...");
      start();
    } else {
      console.log("🔒 Modal closed - stopping speech recognition...");
      stop();

      if (isCameraOpen) {
        closeCamera();
      }

      // Reset state
      setAiResponse(null);
      setIsProcessing(false);
      processedTranscriptRef.current = "";
      lastTranscriptRef.current = "";
    }
  }, [isOpen, start, stop]);

  // Stop AI speaking when user starts talking (don't talk over each other)
  useEffect(() => {
    if (isTalking && isSpeaking) {
      console.log("🤐 User started talking - stopping AI speech");
      stopSpeaking();
    }
  }, [isTalking, isSpeaking, stopSpeaking]);

  // Process final transcript when user stops talking
  useEffect(() => {
    const shouldProcess =
      finalTranscript &&
      finalTranscript.trim().length > 0 &&
      !isProcessing &&
      finalTranscript !== processedTranscriptRef.current;

    if (shouldProcess) {
      console.log("🎯 Processing final transcript:", finalTranscript);
      processedTranscriptRef.current = finalTranscript;
      handleProcessRequest(finalTranscript);
    }
  }, [finalTranscript, isProcessing]);

  const handleProcessRequest = async (transcriptText) => {
    setIsProcessing(true);
    try {
      console.log("🤖 Sending to AI...");
      console.log("   Transcript:", transcriptText);
      console.log("   Image:", capturedImage ? "Yes" : "No");
      console.log("   History:", conversationHistory.length, "messages");

      // Create user message object
      const userMessage = {
        role: "user",
        content: transcriptText,
        timestamp: new Date().toISOString(),
      };

      // Add to history
      const updatedHistory = [...conversationHistory, userMessage];
      setConversationHistory(updatedHistory);

      // Send to backend with history
      const response = await sendToAI({
        transcript: transcriptText,
        image: capturedImage,
        conversationHistory: updatedHistory,
      });

      console.log("✅ AI Response received:", response);

      // Add AI message to history
      const aiMessage = {
        role: "assistant",
        content: response.message || "Response received",
        timestamp: new Date().toISOString(),
      };
      setConversationHistory([...updatedHistory, aiMessage]);

      setAiResponse(response);

      // Speak the AI response
      if (response.message) {
        console.log("🔊 AI speaking response");
        speak(response.message);
      }

      // Reset transcript for next utterance
      resetTranscript();
    } catch (error) {
      console.error("❌ Error processing AI request:", error);
      // Still reset transcript even on error
      resetTranscript();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMuteToggle = () => {
    setMuted(!isMuted);
  };

  const handleCameraToggle = () => {
    if (isCameraOpen) {
      closeCamera();
    } else {
      openCamera();
    }
  };

  const handleCapture = () => {
    if (isCameraOpen) {
      captureImage();
    }
  };

  const handleEndCall = () => {
    console.log("📞 Ending call...");
    stop();
    stopSpeaking(); // Stop any ongoing speech

    if (isCameraOpen) {
      closeCamera();
    }

    setAiResponse(null);
    setConversationHistory([]);
    processedTranscriptRef.current = "";
    lastTranscriptRef.current = "";

    onClose();
  };

  // Determine talking indicator state
  // NOTE: Don't show muted state in indicator - just keep showing current state
  const getTalkingState = () => {
    if (isProcessing || aiLoading) return "processing";
    if (isSpeaking) return "speaking"; // AI is speaking
    if (isTalking && !isMuted) return "recording"; // User is talking (and not muted)
    if (isListening) return "idle"; // Listening and ready
    return "idle"; // Default to idle instead of muted
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Stop speech when dialog closes (via X button or ESC)
          stopSpeaking();
        }
        onClose(open);
      }}
    >
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-center">
            AI Nutrition Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto">
          {/* Talking Indicator */}
          <TalkingIndicator state={getTalkingState()} transcript={transcript} />

          {/* Camera Preview */}
          <CameraPreview
            isOpen={isCameraOpen}
            videoRef={videoRef}
            capturedImage={capturedImage}
          />

          {/* Control Bar */}
          <ControlBar
            isMuted={isMuted}
            isCameraOpen={isCameraOpen}
            onMuteToggle={handleMuteToggle}
            onCameraToggle={handleCameraToggle}
            onCapture={handleCapture}
            onEndCall={handleEndCall}
            captureDisabled={!isCameraOpen}
          />

          {/* AI Response Box */}
          <AIResponseBox
            response={aiResponse}
            isProcessing={isProcessing || aiLoading}
            onMealLogged={handleEndCall}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NutritionAssistantModal;
