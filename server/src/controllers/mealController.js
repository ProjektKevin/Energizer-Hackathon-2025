import supabase from '../services/supabaseClient.js';

const HARDCODED_USER_ID = 1; // Test user

export const logMeal = async (req, res) => {
  try {
    const { food_id, quantity, meal_type } = req.body;

    // 1. Create meal entry
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: HARDCODED_USER_ID,
        meal_type: meal_type,
        meal_date: new Date().toISOString().split('T')[0], // Today's date
      })
      .select()
      .single();

    if (mealError) throw mealError;

    // 2. Add food to meal
    const { data: mealFood, error: mealFoodError } = await supabase
      .from('meal_foods')
      .insert({
        meal_id: meal.meal_id,
        food_id: food_id,
        quantity: quantity,
      })
      .select()
      .single();

    if (mealFoodError) throw mealFoodError;

    res.status(201).json({ 
      message: 'Meal logged successfully',
      meal,
      mealFood 
    });

  } catch (error) {
    console.error('Error logging meal:', error);
    res.status(500).json({ error: error.message });
  }
};