const API_URL = 'http://localhost:8080/api';

export const getAllFoods = async () => {
  const response = await fetch(`${API_URL}/foods`);
  if (!response.ok) throw new Error('Failed to fetch foods');
  return response.json();
};

export const getFoodById = async (id) => {
  const response = await fetch(`${API_URL}/foods/${id}`);
  if (!response.ok) throw new Error('Failed to fetch food');
  return response.json();
};

export const logMeal = async (foodId, quantity, mealType) => {
  const response = await fetch(`${API_URL}/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      food_id: foodId,
      quantity: quantity,
      meal_type: mealType,
    }),
  });
  
  if (!response.ok) throw new Error('Failed to log meal');
  return response.json();
};