import { pool } from '../services/db.js';

/**
 * Get user profile information
 */
export const getUserProfileById = async (userId) => {
  try {
    const query = `
      SELECT 
        user_id,
        name,
        age,
        gender,
        height_cm,
        weight_kg,
        weight_goal,
        calorie_goal,
        carbs_goal,
        protein_goal,
        fat_goal,
        sugar_goal,
        sodium_goal
      FROM users
      WHERE user_id = $1
    `;
    const values = [userId];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      console.error("User profile not found for userId:", userId);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("Error in getUserProfileById:", error);
    throw error;
  }
};

/**
 * Get all user allergies
 */
export const getUserAllergiesById = async (userId) => {
  try {
    const query = `
      SELECT allergy_name
      FROM user_allergies
      WHERE user_id = $1
    `;
    const values = [userId];
    
    const result = await pool.query(query, values);
    
    // Return array of allergy names
    return result.rows.map((row) => row.allergy_name);
  } catch (error) {
    console.error("Error in getUserAllergiesById:", error);
    return [];
  }
};

/**
 * Get user dietary preferences (only enabled ones)
 */
export const getUserPreferencesById = async (userId) => {
  try {
    const query = `
      SELECT preference_name
      FROM user_preferences
      WHERE user_id = $1 AND enabled = true
    `;
    const values = [userId];
    
    const result = await pool.query(query, values);
    
    // Return array of preference names
    return result.rows.map((row) => row.preference_name);
  } catch (error) {
    console.error("Error in getUserPreferencesById:", error);
    return [];
  }
};

/**
 * Get user health conditions
 */
export const getUserConditionsById = async (userId) => {
  try {
    const query = `
      SELECT condition_name
      FROM user_conditions
      WHERE user_id = $1
    `;
    const values = [userId];
    
    const result = await pool.query(query, values);
    
    // Return array of condition names
    return result.rows.map((row) => row.condition_name);
  } catch (error) {
    console.error("Error in getUserConditionsById:", error);
    return [];
  }
};

/**
 * Get complete user context (profile + allergies + preferences + conditions)
 * This is the main function to use for getting all user info at once
 */
export const getUserCompleteContext = async (userId) => {
  try {
    const [profile, allergies, preferences, conditions] = await Promise.all([
      getUserProfileById(userId),
      getUserAllergiesById(userId),
      getUserPreferencesById(userId),
      getUserConditionsById(userId),
    ]);

    if (!profile) {
      throw new Error("User profile not found");
    }

    return {
      profile,
      allergies,
      preferences,
      conditions,
    };
  } catch (error) {
    console.error("Error in getUserCompleteContext:", error);
    throw error;
  }
};

export default {
  getUserProfileById,
  getUserAllergiesById,
  getUserPreferencesById,
  getUserConditionsById,
  getUserCompleteContext,
};