import { Loader2, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import FoodLogCard from "./FoodLogCard";
import VideoLinksList from "./VideoLinksList";
import RecipeCard from "./RecipeCard";

function AIResponseBox({ response, isProcessing, onMealLogged }) {
  if (isProcessing) {
    return (
      <Card className="flex-1 p-6 flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-blue-600 font-medium">Analyzing your request...</p>
        </div>
      </Card>
    );
  }

  if (!response) {
    return (
      <Card className="flex-1 p-6 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            Start talking or capture an image to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 overflow-y-auto min-h-[400px]">
      <div className="p-6 space-y-4">
        {/* AI Message */}
        {response.message && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-gray-800">{response.message}</p>
          </div>
        )}

        {/* Intent-based Content */}
        {response.intent === "FOOD_LOGGING" && (
          <FoodLogCard
            foodData={response.foodCaloryMappingList}
            userData={response.userData}
            onLogMeal={onMealLogged}
          />
        )}

        {response.intent === "VIDEO_SEARCH" && (
          <VideoLinksList links={response.links} />
        )}

        {response.intent === "RECIPE_MODE" && (
          <RecipeCard
            ingredients={response.ingredients}
            recipes={response.recipes}
          />
        )}

        {/* General Text Response */}
        {response.intent === "GENERAL" && response.text && (
          <div className="prose max-w-none">
            <p className="text-gray-700">{response.text}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AIResponseBox;
