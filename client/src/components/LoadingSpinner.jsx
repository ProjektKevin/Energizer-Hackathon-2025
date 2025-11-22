import { Loader2 } from "lucide-react";

function LoadingSpinner({ message = "Loading", size = "default" }) {
  const sizeClasses = {
    small: "h-6 w-6",
    default: "h-12 w-12",
    large: "h-16 w-16"
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin mb-4`} />
      {message && (
        <p className="text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
