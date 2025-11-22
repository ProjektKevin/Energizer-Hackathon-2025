import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, addAllergy, deleteAllergy } from '../api/profileApi';
import { useAuth } from '../context/AuthContext';
import { User, ChevronDown, X, Plus, Save, LogOut } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const conditionOptions = ['Diabetes', 'Hypertension', 'Overweight', 'High Cholesterol', 'None'];
  const genderOptions = ['Male', 'Female', 'Other'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      user: { ...prev.user, [field]: value }
    }));
  };

  const handleGoalChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      goals: { ...prev.goals, [field]: Number(value) }
    }));
  };

  const handleConditionToggle = (condition) => {
    setProfile(prev => {
      const conditions = [...prev.conditions];
      const index = conditions.indexOf(condition);
      if (index > -1) {
        conditions.splice(index, 1);
      } else {
        if (condition === 'None') {
          return { ...prev, conditions: ['None'] };
        }
        const filtered = conditions.filter(c => c !== 'None');
        filtered.push(condition);
        return { ...prev, conditions: filtered };
      }
      return { ...prev, conditions };
    });
  };

  const handlePreferenceToggle = (prefName) => {
    setProfile(prev => ({
      ...prev,
      preferences: prev.preferences.map(p =>
        p.preference_name === prefName ? { ...p, enabled: !p.enabled } : p
      )
    }));
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    try {
      const added = await addAllergy(newAllergy.trim());
      setProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, added]
      }));
      setNewAllergy('');
    } catch (error) {
      console.error('Error adding allergy:', error);
      alert('Failed to add allergy');
    }
  };

  const handleDeleteAllergy = async (allergyId) => {
    try {
      await deleteAllergy(allergyId);
      setProfile(prev => ({
        ...prev,
        allergies: prev.allergies.filter(a => a.allergy_id !== allergyId)
      }));
    } catch (error) {
      console.error('Error deleting allergy:', error);
      alert('Failed to delete allergy');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(profile);
      alert('Profile saved successfully!');
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const calculateBMI = () => {
    if (profile?.user?.height_cm && profile?.user?.weight_kg) {
      const heightM = profile.user.height_cm / 100;
      const bmi = (profile.user.weight_kg / (heightM * heightM)).toFixed(1);
      let category = '';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';
      return { bmi, category };
    }
    return { bmi: null, category: null };
  };

  if (loading) return <LoadingSpinner message="Loading your profile" />;
  if (!profile) return <div className="p-4 pb-24">Failed to load profile</div>;

  const { user, goals, conditions, allergies } = profile;
  const { bmi, category } = calculateBMI();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
       <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 mb-4">
  <div className="flex justify-between items-start">
    {/* Left side - Greetings */}
    <div>
      <h1 className="text-xl font-bold">
        Profile
      </h1>
      <p className="text-blue-100 text-xs mt-1">Manage your health information</p>
    </div>
    
    {/* Right side - Logo */}
    <div className="flex items-center gap-1">
      <p className="text-blue-100 text-xs">GlucoSG</p>
      <span className="text-2xl">🍜</span>
    </div>
  </div>
</div>
      <div className="p-4 space-y-4">
        {/* Personal Information */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-800">Personal Information</h2>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <button className="text-blue-500 text-sm mt-2">Change Photo</button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                type="text"
                value={user.name || ''}
                onChange={(e) => handleUserChange('name', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Age</label>
                <input
                  type="number"
                  value={user.age || ''}
                  onChange={(e) => handleUserChange('age', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Gender</label>
                <div className="relative mt-1">
                  <select
                    value={user.gender || ''}
                    onChange={(e) => handleUserChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    {genderOptions.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Height (cm)</label>
                <input
                  type="number"
                  value={user.height_cm || ''}
                  onChange={(e) => handleUserChange('height_cm', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Weight (kg)</label>
                <input
                  type="number"
                  value={user.weight_kg || ''}
                  onChange={(e) => handleUserChange('weight_kg', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* BMI Display */}
            {bmi && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-gray-600">BMI:</span>
                <span className="text-xl font-bold text-gray-800">{bmi}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  category === 'Normal' ? 'bg-green-100 text-green-700' :
                  category === 'Overweight' ? 'bg-orange-100 text-orange-700' :
                  category === 'Obese' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💊</span>
            <h2 className="font-semibold text-gray-800">Health Status</h2>
          </div>

          <label className="text-sm text-gray-600">Health Conditions</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {conditionOptions.map(condition => (
              <button
                key={condition}
                onClick={() => handleConditionToggle(condition)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  conditions.includes(condition)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Goals */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h2 className="font-semibold text-gray-800">Daily Goals</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Calorie Target</label>
              <input
                type="number"
                value={goals.calories || ''}
                onChange={(e) => handleGoalChange('calories', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-600">Carbs (g)</label>
                <input
                  type="number"
                  value={goals.carbs || ''}
                  onChange={(e) => handleGoalChange('carbs', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Protein (g)</label>
                <input
                  type="number"
                  value={goals.protein || ''}
                  onChange={(e) => handleGoalChange('protein', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Fats (g)</label>
                <input
                  type="number"
                  value={goals.fat || ''}
                  onChange={(e) => handleGoalChange('fat', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Sodium Limit (mg)</label>
                <input
                  type="number"
                  value={goals.sodium || ''}
                  onChange={(e) => handleGoalChange('sodium', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Sugar Limit (g)</label>
                <input
                  type="number"
                  value={goals.sugar || ''}
                  onChange={(e) => handleGoalChange('sugar', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Weight Goal (kg)</label>
              <input
                type="number"
                value={user.weight_goal || ''}
                onChange={(e) => handleUserChange('weight_goal', Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Dietary Preferences - Allergies Only */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🍽️</span>
            <h2 className="font-semibold text-gray-800">Dietary Preferences</h2>
          </div>

          {/* Allergies Selection */}
          <div>
            <label className="text-sm text-gray-600">Allergies & Restrictions</label>
            <p className="text-xs text-gray-400 mb-2">Select all that apply</p>
            
            <div className="flex flex-wrap gap-2">
              {['Shellfish', 'Seafood', 'Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy'].map(allergy => {
                const isSelected = allergies.some(a => a.allergy_name.toLowerCase() === allergy.toLowerCase());
                return (
                  <button
                    key={allergy}
                    onClick={async () => {
                      if (isSelected) {
                        const existing = allergies.find(a => a.allergy_name.toLowerCase() === allergy.toLowerCase());
                        if (existing) {
                          await handleDeleteAllergy(existing.allergy_id);
                        }
                      } else {
                        try {
                          const added = await addAllergy(allergy);
                          setProfile(prev => ({
                            ...prev,
                            allergies: [...prev.allergies, added]
                          }));
                        } catch (error) {
                          console.error('Error adding allergy:', error);
                        }
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected && '✓ '}{allergy}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Logout Button at Bottom */}
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;