import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

function FoodLogCard({ foodData, userData, onLogMeal }) {
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isLogging, setIsLogging] = useState(false);

  // Initialize with first variant of each food
  useState(() => {
    const initialSelections = {};
    foodData?.forEach((food) => {
      if (food.variants && food.variants.length > 0) {
        initialSelections[food.foodName] = food.variants[0];
      }
    });
    setSelectedVariants(initialSelections);
  }, [foodData]);

  const handleVariantChange = (foodName, variantId) => {
    const food = foodData.find((f) => f.foodName === foodName);
    const variant = food.variants.find((v) => v.food_id === variantId);
    setSelectedVariants((prev) => ({
      ...prev,
      [foodName]: variant,
    }));
  };

  const calculateTotals = () => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
    };

    Object.values(selectedVariants).forEach((variant) => {
      totals.calories += variant.calories || 0;
      totals.protein += variant.protein || 0;
      totals.carbs += variant.carbs || 0;
      totals.fat += variant.fat || 0;
      totals.fiber += variant.fiber || 0;
      totals.sodium += variant.sodium || 0;
    });

    return totals;
  };

  const handleLogMeal = async () => {
    setIsLogging(true);
    try {
      const foods = Object.values(selectedVariants).map((variant) => ({
        foodId: variant.food_id,
        quantity: 1,
      }));

      const response = await axios.post(
        `http://localhost:3000/api/tracker/meal/${userData.userId}`,
        {
          foods,
          mealType: "snack",
        }
      );

      if (response.data.success) {
        console.log("Meal logged successfully!");
        onLogMeal();
      }
    } catch (error) {
      console.error("Error logging meal:", error);
      alert("Failed to log meal. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">🍽️ Detected Foods</h3>
          <Badge variant="secondary">{foodData?.length || 0} items</Badge>
        </div>

        <Separator />

        {/* Food List */}
        <div className="space-y-4">
          {foodData?.map((food, index) => {
            const selected = selectedVariants[food.foodName];
            return (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <p className="font-semibold text-gray-800 mb-2">
                  {food.foodName}
                </p>

                {/* Variant Selector */}
                <Select
                  value={selected?.food_id}
                  onValueChange={(value) =>
                    handleVariantChange(food.foodName, value)
                  }
                >
                  <SelectTrigger className="w-full mb-2">
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {food.variants?.map((variant) => (
                      <SelectItem key={variant.food_id} value={variant.food_id}>
                        {variant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Nutrition Info */}
                {selected && (
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">{selected.calories}</span>{" "}
                      cal
                    </div>
                    <div>
                      <span className="font-medium">{selected.protein}g</span> P
                    </div>
                    <div>
                      <span className="font-medium">{selected.carbs}g</span> C
                    </div>
                    <div>
                      <span className="font-medium">{selected.fat}g</span> F
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Totals */}
        <div className="bg-white rounded-lg p-4">
          <p className="font-bold text-gray-800 mb-3">Total Nutrition</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {totals.calories}
              </p>
              <p className="text-xs text-gray-500">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {totals.protein.toFixed(1)}g
              </p>
              <p className="text-xs text-gray-500">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {totals.carbs.toFixed(1)}g
              </p>
              <p className="text-xs text-gray-500">Carbs</p>
            </div>
          </div>
        </div>

        {/* User Progress (Optional) */}
        {userData && (
          <div className="bg-white rounded-lg p-4 text-sm">
            <p className="font-semibold text-gray-700 mb-2">Today's Progress</p>
            <div className="space-y-1 text-gray-600">
              <p>
                Calories: {userData.todayIntake.calorie} /{" "}
                {userData.goal.calorie}
              </p>
              <p>
                Protein: {userData.todayIntake.protein}g /{" "}
                {userData.goal.protein}g
              </p>
            </div>
          </div>
        )}

        {/* Log Button */}
        <Button
          onClick={handleLogMeal}
          disabled={isLogging || Object.keys(selectedVariants).length === 0}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          {isLogging ? "Logging..." : "📝 Log This Meal"}
        </Button>
      </div>
    </Card>
  );
}

export default FoodLogCard;
