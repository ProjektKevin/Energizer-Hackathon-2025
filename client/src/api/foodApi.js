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
export const getUserAllergies = async () => {
  const response = await fetch(`${API_BASE}/profile`);
  if (!response.ok) throw new Error('Failed to fetch profile');
  const data = await response.json();
  return data.allergies;
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

export const getDailyStats = async (date) => {
  const url = date 
    ? `${API_URL}/stats/daily?date=${date}` 
    : `${API_URL}/stats/daily`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

export const deleteMealFood = async (mealFoodId) => {
  const response = await fetch(`${API_URL}/meals/food/${mealFoodId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete meal food');
  return response.json();
};