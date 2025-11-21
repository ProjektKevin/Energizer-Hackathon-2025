const API_BASE = 'http://localhost:8080/api';

// Helper to get token
const getToken = () => localStorage.getItem('token');

export const getProfile = async () => {
  const response = await fetch(`${API_BASE}/profile`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
};

export const updateProfile = async (profileData) => {
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(profileData)
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};

export const addAllergy = async (allergyName) => {
  const response = await fetch(`${API_BASE}/profile/allergies`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ allergy_name: allergyName })
  });
  if (!response.ok) throw new Error('Failed to add allergy');
  return response.json();
};

export const deleteAllergy = async (allergyId) => {
  const response = await fetch(`${API_BASE}/profile/allergies/${allergyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!response.ok) throw new Error('Failed to delete allergy');
  return response.json();
};