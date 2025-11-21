import { pool } from '../services/db.js';

// Get list of food stats from food item name
export const getFoodByFoodList = async (foodItem) => {
  try {
    const query = `SELECT * FROM foods WHERE food_name ILIKE $1;`;
    const VALUES = [`%${foodItem}%`];

    const result = await pool.query(query, VALUES);

    return result.rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

// Get calory goal and today's intake by user id
export const getUserDailyIntakeWithGoalByUserId = async (userId) => {
  const query = `
    SELECT 
      u.user_id,
      u.name,
      u.calorie_goal,
      u.sodium_goal,
      u.carbs_goal,
      u.protein_goal,
      u.fat_goal,
      COALESCE(SUM(f.calories * mf.quantity), 0) AS calories_intake,
      COALESCE(SUM(f.sodium_mg * mf.quantity), 0) AS sodium_intake,
      COALESCE(SUM(f.carbs_g * mf.quantity), 0) AS carbs_intake,
      COALESCE(SUM(f.protein_g * mf.quantity), 0) AS protein_intake,
      COALESCE(SUM(f.fat_g * mf.quantity), 0) AS fat_intake
    FROM users u
    LEFT JOIN meals m ON u.user_id = m.user_id AND m.meal_date = CURRENT_DATE
    LEFT JOIN meal_foods mf ON m.meal_id = mf.meal_id
    LEFT JOIN foods f ON mf.food_id = f.food_id
    WHERE u.user_id = $1
    GROUP BY u.user_id;
  `;
  const VALUES = [userId];

  const result = await pool.query(query, VALUES);
  return result.rows[0];
};
