import { Circle, Loader2, MicOff } from "lucide-react";

function TalkingIndicator({ state, transcript }) {
  const getIndicatorContent = () => {
    switch (state) {
      case "idle":
        return {
          icon: (
            <div className="relative">
              <Circle className="h-12 w-12 text-gray-400 fill-gray-400 animate-pulse" />
              <Circle className="h-12 w-12 text-gray-400 absolute top-0 left-0 animate-ping opacity-20" />
            </div>
          ),
          text: "Listening...",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };

      case "recording":
        return {
          icon: (
            <div className="relative">
              {/* Animated waveform effect */}
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-wave"
                    style={{
                      height: "48px",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ),
          text: "Recording...",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };

      case "processing":
        return {
          icon: <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />,
          text: "Processing...",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };

      case "speaking":
        return {
          icon: (
            <div className="relative">
              {/* Animated sound waves effect */}
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-green-500 rounded-full animate-wave"
                    style={{
                      height: "48px",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ),
          text: "AI Speaking...",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };

      case "muted":
        return {
          icon: <MicOff className="h-12 w-12 text-gray-400" />,
          text: "Microphone Muted",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };

      default:
        return {
          icon: <Circle className="h-12 w-12 text-gray-400 fill-gray-400" />,
          text: "Ready",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  const { icon, text, color, bgColor } = getIndicatorContent();

  return (
    <div
      className={`${bgColor} rounded-lg p-6 border-2 border-dashed border-gray-300 min-h-[180px]`}
    >
      <div className="flex flex-col items-center justify-center gap-4 h-full">
        {/* Icon */}
        <div className="flex items-center justify-center">{icon}</div>

        {/* Status Text */}
        <p className={`text-lg font-semibold ${color}`}>{text}</p>

        {/* Live Transcript */}
        {transcript && state !== "processing" && (
          <div className="w-full mt-2 max-h-[100px] overflow-y-auto">
            <p className="text-base text-gray-700 text-center italic leading-relaxed">
              "{transcript}"
            </p>
          </div>
        )}
      </div>

      {/* CSS for wave animation */}
      <style>{`
        @keyframes wave {
          0%, 100% {
            height: 12px;
          }
          50% {
            height: 48px;
          }
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default TalkingIndicator;
