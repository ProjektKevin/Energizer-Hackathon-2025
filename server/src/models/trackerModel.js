import { pool } from '../services/db.js';

export const insertNewFoodLog = async (userId, foodName, calories) => {
  try {
    const query = 'INSERT INTO calory_tracker () VALUES ($1, $2, $3)';
    const VALUES = [userId, foodName, calories];

    const result = await pool.query(query, VALUES);

    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}