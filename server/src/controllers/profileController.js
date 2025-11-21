import supabase from '../services/supabaseClient.js';

// Get full profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // From JWT token via authMiddleware

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError) throw userError;

    // Get conditions
    const { data: conditions, error: condError } = await supabase
      .from('user_conditions')
      .select('condition_name')
      .eq('user_id', userId);

    if (condError) throw condError;

    // Get allergies
    const { data: allergies, error: allergyError } = await supabase
      .from('user_allergies')
      .select('allergy_id, allergy_name')
      .eq('user_id', userId);

    if (allergyError) throw allergyError;

    // Get preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('preference_id, preference_name, enabled')
      .eq('user_id', userId);

    if (prefError) throw prefError;

    // Calculate BMI
    let bmi = null;
    let bmiCategory = null;
    if (user.height_cm && user.weight_kg) {
      const heightM = user.height_cm / 100;
      bmi = (user.weight_kg / (heightM * heightM)).toFixed(1);
      
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 25) bmiCategory = 'Normal';
      else if (bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    res.json({
      user: {
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        weight_goal: user.weight_goal,
        bmi,
        bmiCategory
      },
      goals: {
        calories: user.calorie_goal,
        carbs: user.carbs_goal,
        protein: user.protein_goal,
        fat: user.fat_goal,
        sugar: user.sugar_goal,
        sodium: user.sodium_goal
      },
      conditions: conditions.map(c => c.condition_name),
      allergies,
      preferences
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // From JWT token
    const { user, goals, conditions, allergies, preferences } = req.body;

    // Update user info
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: user.name,
        age: user.age,
        gender: user.gender,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        weight_goal: user.weight_goal,
        calorie_goal: goals.calories,
        carbs_goal: goals.carbs,
        protein_goal: goals.protein,
        fat_goal: goals.fat,
        sugar_goal: goals.sugar,
        sodium_goal: goals.sodium
      })
      .eq('user_id', userId);

    if (userError) throw userError;

    // Update conditions - delete and re-insert
    await supabase
      .from('user_conditions')
      .delete()
      .eq('user_id', userId);

    if (conditions && conditions.length > 0) {
      const conditionRows = conditions.map(c => ({
        user_id: userId,
        condition_name: c
      }));
      await supabase.from('user_conditions').insert(conditionRows);
    }

    // Update preferences
    if (preferences && preferences.length > 0) {
      for (const pref of preferences) {
        await supabase
          .from('user_preferences')
          .update({ enabled: pref.enabled })
          .eq('user_id', userId)
          .eq('preference_name', pref.preference_name);
      }
    }

    res.json({ success: true, message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add allergy
export const addAllergy = async (req, res) => {
  try {
    const userId = req.user.user_id; // From JWT token
    const { allergy_name } = req.body;

    const { data, error } = await supabase
      .from('user_allergies')
      .insert({ user_id: userId, allergy_name })
      .select()
      .single();

    if (error) throw error;
    res.json(data);

  } catch (error) {
    console.error('Error adding allergy:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete allergy
export const deleteAllergy = async (req, res) => {
  try {
    const userId = req.user.user_id; // From JWT token
    const { id } = req.params;

    const { error } = await supabase
      .from('user_allergies')
      .delete()
      .eq('allergy_id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting allergy:', error);
    res.status(500).json({ error: error.message });
  }
};