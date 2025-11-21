import { Button } from "@/components/ui/button";
import { Mic, MicOff, Camera, CameraOff, Circle, X } from "lucide-react";

function ControlBar({
  isMuted,
  isCameraOpen,
  onMuteToggle,
  onCameraToggle,
  onCapture,
  onEndCall,
  captureDisabled,
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-4 bg-gray-50 rounded-lg border">
      {/* Mute Button */}
      <Button
        variant={isMuted ? "destructive" : "outline"}
        size="lg"
        onClick={onMuteToggle}
        className="flex-1 h-14"
      >
        {isMuted ? (
          <>
            <MicOff className="mr-2 h-5 w-5" />
            Unmute
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" />
            Mute
          </>
        )}
      </Button>

      {/* Camera Button */}
      <Button
        variant={isCameraOpen ? "default" : "outline"}
        size="lg"
        onClick={onCameraToggle}
        className="flex-1 h-14"
      >
        {isCameraOpen ? (
          <>
            <CameraOff className="mr-2 h-5 w-5" />
            Close
          </>
        ) : (
          <>
            <Camera className="mr-2 h-5 w-5" />
            Camera
          </>
        )}
      </Button>

      {/* Capture Button */}
      <Button
        variant="secondary"
        size="lg"
        onClick={onCapture}
        disabled={captureDisabled}
        className="flex-1 h-14"
      >
        <Circle className="mr-2 h-5 w-5 fill-current" />
        Capture
      </Button>

      {/* End Call Button */}
      <Button
        variant="destructive"
        size="lg"
        onClick={onEndCall}
        className="flex-1 h-14"
      >
        <X className="mr-2 h-5 w-5" />
        End
      </Button>
    </div>
  );
}

export default ControlBar;
