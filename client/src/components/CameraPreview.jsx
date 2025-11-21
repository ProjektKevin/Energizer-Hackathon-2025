import { Camera } from "lucide-react";

function CameraPreview({ isOpen, videoRef, capturedImage }) {
  if (!isOpen && !capturedImage) {
    return (
      <div className="bg-gray-900 rounded-lg h-96 flex items-center justify-center border-2 border-gray-700">
        <div className="text-center text-gray-400">
          <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Camera is off</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-900 rounded-lg aspect-4/3 max-h-96 border-2 border-gray-700">
      {/* Live Video Feed */}
      {isOpen && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
      )}

      {/* Captured Image Overlay */}
      {capturedImage && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured"
              className="max-h-22rem max-w-full rounded-lg shadow-lg"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              ✓ Captured
            </div>
          </div>
        </div>
      )}

      {/* Camera Status Indicator */}
      {isOpen && !capturedImage && (
        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          LIVE
        </div>
      )}
    </div>
  );
}

export default CameraPreview;