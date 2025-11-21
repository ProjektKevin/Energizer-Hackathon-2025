import * as trackerModel from "../models/trackerModel.js";

export const createNewFoodLog = async (req, res, next) => {
  try {
    const userId = req.params.user_id || 1;
    const { foods, mealType } = req.body; // Changed from 'food' to 'foods' to match frontend

    // Step 1: Create a new meal entry
    const mealId = await trackerModel.insertNewMeal(userId, mealType || "snack");

    // Step 2: Add all foods to the meal
    const addedFoods = [];
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      const result = await trackerModel.insertFoodToMeal(
        mealId,
        food.foodId,
        food.quantity || 1
      );
      addedFoods.push(result);
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Food log created successfully!",
      data: {
        mealId: mealId,
        foodsAdded: addedFoods.length,
        foods: addedFoods,
      },
    });
  } catch (error) {
    console.error("Error in createNewFoodLog controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track new food log!",
      error: error.message,
    });
  }
};
