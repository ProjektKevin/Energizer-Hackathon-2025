import { pool } from '../services/db.js';

export const insertNewMeal = async (userId, mealType = 'snack') => {
  try {
    const query = `
      INSERT INTO meals (user_id, meal_type, meal_date) 
      VALUES ($1, $2, CURRENT_DATE) 
      RETURNING meal_id
    `;
    const values = [userId, mealType];
    
    const result = await pool.query(query, values);
    return result.rows[0].meal_id;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Insert a food item into meal_foods
export const insertFoodToMeal = async (mealId, foodId, quantity = 1) => {
  try {
    const query = `
      INSERT INTO meal_foods (meal_id, food_id, quantity) 
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [mealId, foodId, quantity];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};


