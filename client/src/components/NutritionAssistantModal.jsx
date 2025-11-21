import { useState, useEffect } from "react";
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
import useMicrophoneAutoVAD from "@/hooks/useMicrophoneAutoVAD";
import useAssemblyAIStream from "@/hooks/useAssemblyAIStream";
import useCameraCapture from "@/hooks/useCameraCapture";
import useMultimodalAI from "@/hooks/useMultimodalAI";

function NutritionAssistantModal({ isOpen, onClose }) {
  const [isMuted, setIsMuted] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Microphone with Voice Activity Detection
  const { isTalking, audioChunks, startListening, stopListening, isListening } =
    useMicrophoneAutoVAD();

  // AssemblyAI Streaming
  const { transcript, isStreaming, streamAudio, finalizeTranscript } =
    useAssemblyAIStream();

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

  // Start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
      if (isCameraOpen) closeCamera();
    }
  }, [isOpen]);

  // Stream audio when user is talking
  useEffect(() => {
    if (isTalking && !isMuted && audioChunks.length > 0) {
      streamAudio(audioChunks);
    } else if (!isTalking && isStreaming) {
      finalizeTranscript();
    }
  }, [isTalking, isMuted, audioChunks, isStreaming]);

  // Process transcript + image when finalized
  useEffect(() => {
    if (transcript && !isTalking && !isProcessing) {
      handleProcessRequest();
    }
  }, [transcript, isTalking]);

  const handleProcessRequest = async () => {
    setIsProcessing(true);
    try {
      const response = await sendToAI({
        transcript,
        image: capturedImage,
      });
      setAiResponse(response);
    } catch (error) {
      console.error("Error processing AI request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
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
    stopListening();
    if (isCameraOpen) closeCamera();
    setAiResponse(null);
    onClose();
  };

  // Determine talking indicator state
  const getTalkingState = () => {
    if (isProcessing || aiLoading) return "processing";
    if (isTalking && !isMuted) return "recording";
    if (isListening && !isMuted) return "idle";
    return "muted";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
