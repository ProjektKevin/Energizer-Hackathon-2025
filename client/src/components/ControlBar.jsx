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
    <div className="bg-gray-50 rounded-lg border p-4">
      {/* Buttons in a responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Mute Button */}
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="lg"
          onClick={onMuteToggle}
          className="h-14 text-sm sm:text-base flex items-center justify-center gap-2"
        >
          {isMuted ? (
            <>
              <MicOff className="h-5 w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Unmute</span>
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Mute</span>
            </>
          )}
        </Button>

        {/* Camera Button */}
        <Button
          variant={isCameraOpen ? "default" : "outline"}
          size="lg"
          onClick={onCameraToggle}
          className="h-14 text-sm sm:text-base flex items-center justify-center gap-2"
        >
          {isCameraOpen ? (
            <>
              <CameraOff className="h-5 w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Close</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Camera</span>
            </>
          )}
        </Button>

        {/* Capture Button */}
        <Button
          variant="secondary"
          size="lg"
          onClick={onCapture}
          disabled={captureDisabled}
          className="h-14 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300"
        >
          <Circle className="h-5 w-5 flex-shrink-0 fill-current" />
          <span className="hidden sm:inline">Capture</span>
        </Button>

        {/* End Call Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={onEndCall}
          className="h-14 text-sm sm:text-base flex items-center justify-center gap-2"
        >
          <X className="h-5 w-5 flex-shrink-0" />
          <span className="hidden sm:inline">End</span>
        </Button>
      </div>
    </div>
  );
}

export default ControlBar;
