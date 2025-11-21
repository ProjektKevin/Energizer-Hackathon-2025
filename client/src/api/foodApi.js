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