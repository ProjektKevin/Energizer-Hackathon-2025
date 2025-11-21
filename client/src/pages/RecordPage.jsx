import { useState } from "react";
import QuickRecord from "@/components/quickRecord";
import NutritionAssistantModal from "@/components/NutritionAssistantModal";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

function RecordPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Track Your Meals</h1>

      <div className="w-full max-w-md mb-8">
        <QuickRecord />
      </div>

      {/* New AI Session Button */}
      <div className="w-full max-w-md mb-8">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full h-16 text-lg font-semibold bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Mic className="mr-2 h-6 w-6" />
          Start AI Session
        </Button>
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
