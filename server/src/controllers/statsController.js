import supabase from '../services/supabaseClient.js';

const HARDCODED_USER_ID = 1;

export const getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get user goals and conditions
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('calorie_goal, carbs_goal, protein_goal, fat_goal, sugar_goal, sodium_goal')
      .eq('user_id', HARDCODED_USER_ID)
      .single();

    if (userError) throw userError;

    const { data: conditions, error: condError } = await supabase
      .from('user_conditions')
      .select('condition_name')
      .eq('user_id', HARDCODED_USER_ID);

    if (condError) throw condError;

    // Get all meals for the date with their foods
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select(`
        meal_id,
        meal_type,
        meal_foods (
          meal_food_id,
          quantity,
          foods (
            food_name,
            calories,
            carbs_g,
            protein_g,
            fat_g,
            sugars_g,
            sodium_mg,
            fiber_g
          )
        )
      `)
      .eq('user_id', HARDCODED_USER_ID)
      .eq('meal_date', targetDate);

    if (mealsError) throw mealsError;

    // Calculate daily totals
    let totals = {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      sugar: 0,
      sodium: 0,
      fiber: 0
    };

    meals.forEach(meal => {
      meal.meal_foods.forEach(mf => {
        const qty = mf.quantity || 1;
        const food = mf.foods;
        if (food) {
          totals.calories += (food.calories || 0) * qty;
          totals.carbs += (food.carbs_g || 0) * qty;
          totals.protein += (food.protein_g || 0) * qty;
          totals.fat += (food.fat_g || 0) * qty;
          totals.sugar += (food.sugars_g || 0) * qty;
          totals.sodium += (food.sodium_mg || 0) * qty;
          totals.fiber += (food.fiber_g || 0) * qty;
        }
      });
    });

    // Round values
    Object.keys(totals).forEach(key => {
      totals[key] = Math.round(totals[key] * 10) / 10;
    });

    res.json({
      date: targetDate,
      totals,
      goals: {
        calories: user.calorie_goal,
        carbs: user.carbs_goal,
        protein: user.protein_goal,
        fat: user.fat_goal,
        sugar: user.sugar_goal,
        sodium: user.sodium_goal
      },
      conditions: conditions.map(c => c.condition_name),
      meals
    });

  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: error.message });
  }
};