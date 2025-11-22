import { useState } from "react";
import QuickRecord from "@/components/quickRecord";
import NutritionAssistantModal from "@/components/NutritionAssistantModal";
import { Button } from "@/components/ui/button";
import { Mic, Zap, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function RecordPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Blue Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 mb-4">
        <div className="flex justify-between items-start">
          {/* Left side - Title */}
          <div>
            <h1 className="text-xl font-bold">Log Meal</h1>
            <p className="text-blue-100 text-xs mt-1">Choose how to track</p>
          </div>

          {/* Right side - Logo */}
          <div className="flex items-center gap-1">
            <p className="text-blue-100 text-xs">GlucoSG</p>
            <span className="text-2xl">🍜</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">

        {/* Quick Record Card */}
        <div className="mb-4">
          <div className="bg-blue-500 hover:bg-blue-600 rounded-2xl p-6 shadow-lg transition-all cursor-pointer active:scale-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Quick Record</h2>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-white/80 hover:text-white">
                      <HelpCircle className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-sm">Record what you ate and we'll detect it automatically</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <QuickRecord />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* AI Session Card */}
        <div className="mb-4">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-2xl p-6 shadow-lg transition-all active:scale-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-white/80 hover:text-white">
                      <HelpCircle className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-sm">Talk with AI - get advice, recipes, and video links</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full h-14 bg-white text-purple-600 hover:bg-gray-50 font-semibold text-lg shadow-md"
              size="lg"
            >
              Start Conversation
            </Button>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <NutritionAssistantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default RecordPage;
