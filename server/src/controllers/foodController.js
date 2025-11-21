import supabase from '../services/supabaseClient.js';

// Get all foods
export const getAllFoods = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('foods')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single food by ID
export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('food_id', id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};