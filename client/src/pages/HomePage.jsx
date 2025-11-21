import { useState, useEffect } from 'react';
import { getDailyStats, deleteMealFood } from '../api/foodApi';
import { getProfile } from '../api/profileApi';
import { useNavigate } from 'react-router-dom';
import { Plus, Coffee, Sun, Moon, Apple, Trash2 } from 'lucide-react';

const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, profileData] = await Promise.all([
          getDailyStats(today),
          getProfile()
        ]);
        setStats(statsData);
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPersonalizedTip = () => {
    if (!stats || !profile) return null;

    const { totals, goals, conditions } = stats;
    const sugarRemaining = goals.sugar - totals.sugar;
    const carbsRemaining = goals.carbs - totals.carbs;
    const caloriesRemaining = goals.calories - totals.calories;

    const hasDiabetes = conditions.includes('Diabetes');
    const hasOverweight = conditions.includes('Overweight');
    const hasHypertension = conditions.includes('Hypertension');

    // Diabetes-specific tips
    if (hasDiabetes) {
      if (sugarRemaining <= 10 && sugarRemaining > 0) {
        return { icon: '⚠️', text: `Only ${Math.round(sugarRemaining)}g sugar left. Try: Black coffee or unsweetened tea`, color: 'bg-orange-50 border-orange-200 text-orange-700' };
      }
      if (sugarRemaining > 20) {
        return { icon: '✅', text: `You have ${Math.round(sugarRemaining)}g sugar left. A small apple (~8g) is a good choice!`, color: 'bg-green-50 border-green-200 text-green-700' };
      }
    }

    // Overweight-specific tips
    if (hasOverweight && caloriesRemaining < 400 && caloriesRemaining > 0) {
      return { icon: '💡', text: `${Math.round(caloriesRemaining)} cal remaining. Fill up on vegetables and lean protein!`, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' };
    }

    // Hypertension-specific tips
    if (hasHypertension) {
      const sodiumRemaining = goals.sodium - totals.sodium;
      if (sodiumRemaining < 500) {
        return { icon: '🧂', text: `Watch your sodium - only ${Math.round(sodiumRemaining)}mg left. Avoid soy sauce!`, color: 'bg-blue-50 border-blue-200 text-blue-700' };
      }
    }

    // Default tip
    if (carbsRemaining > 50) {
      return { icon: '🍚', text: `You have ${Math.round(carbsRemaining)}g carbs left for today. Balance with protein!`, color: 'bg-blue-50 border-blue-200 text-blue-700' };
    }

    return { icon: '👍', text: "You're doing great! Keep tracking your meals.", color: 'bg-green-50 border-green-200 text-green-700' };
  };

  const handleQuickLog = (mealType) => {
    navigate(`/search?meal=${mealType}`);
  };

  const handleDeleteFood = async (mealFoodId) => {
  if (!confirm('Remove this food from your log?')) return;
  
  try {
    await deleteMealFood(mealFoodId);
    // Refresh stats
    const statsData = await getDailyStats(today);
    setStats(statsData);
  } catch (error) {
    console.error('Error deleting food:', error);
    alert('Failed to remove food');
  }
};

  if (loading) return <div className="p-4">Loading...</div>;
  if (!stats || !profile) return <div className="p-4">Failed to load data</div>;

  const { totals, goals, meals } = stats;
  const tip = getPersonalizedTip();

  // Get today's meals
  const todaysMeals = [];
  meals.forEach(meal => {
  meal.meal_foods.forEach(mf => {
    if (mf.foods) {
      todaysMeals.push({
        name: mf.foods.food_name,
        calories: Math.round(mf.foods.calories * mf.quantity),
        carbs: Math.round(mf.foods.carbs_g * mf.quantity),
        meal_type: meal.meal_type,
        meal_food_id: mf.meal_food_id  // Add this
      });
    }
  });
});

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-b-3xl">
        <p className="text-blue-100 text-sm">GlucoSG</p>
        <h1 className="text-2xl font-bold mt-1">{getGreeting()}, {profile.user.name?.split(' ')[0] || 'there'}!</h1>
        <p className="text-blue-100 text-sm mt-1">Let's keep your glucose in check today</p>
      </div>

      
     {/* Stats Cards */}
<div>
  <div className="mb-2">
    <h2 className="font-semibold text-gray-800">Today's Progress</h2>
    <p className="text-xs text-gray-800">Based on what you've eaten so far</p>
  </div>
 <div className="grid grid-cols-3 gap-3">
          {/* Calories Card */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500">Calories</span>
              <span className="text-lg">🔥</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {Math.round(totals.calories)}
              <span className="text-sm font-normal text-gray-400">/{goals.calories}</span>
            </p>
            <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${Math.min(100, (totals.calories / goals.calories) * 100)}%` }}
              />
            </div>
          </div>

          {/* Sugar Card */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500">Sugar</span>
              <span className="text-lg">🍬</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {Math.round(totals.sugar)}
              <span className="text-sm font-normal text-gray-400">/{goals.sugar}g</span>
            </p>
            <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${(totals.sugar / goals.sugar) * 100 >= 80 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, (totals.sugar / goals.sugar) * 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs Card */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500">Carbs</span>
              <span className="text-lg">🍚</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {Math.round(totals.carbs)}
              <span className="text-sm font-normal text-gray-400">/{goals.carbs}g</span>
            </p>
            <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, (totals.carbs / goals.carbs) * 100)}%` }}
              />
            </div>
          </div>
        </div>
</div>
      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        

        {/* Personalized Tip */}
        {tip && (
          <div className={`rounded-xl p-4 border ${tip.color}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{tip.icon}</span>
              <p className="text-sm">{tip.text}</p>
            </div>
          </div>
        )}

        {/* Quick Log Buttons */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-800">Quick Log</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleQuickLog('Breakfast')}
              className="flex flex-col items-center gap-1 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <Coffee className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-gray-600">Breakfast</span>
            </button>
            <button
              onClick={() => handleQuickLog('Lunch')}
              className="flex flex-col items-center gap-1 p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
            >
              <Sun className="w-5 h-5 text-yellow-500" />
              <span className="text-xs text-gray-600">Lunch</span>
            </button>
            <button
              onClick={() => handleQuickLog('Dinner')}
              className="flex flex-col items-center gap-1 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <Moon className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-gray-600">Dinner</span>
            </button>
            <button
              onClick={() => handleQuickLog('Snack')}
              className="flex flex-col items-center gap-1 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
              <Apple className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-600">Snack</span>
            </button>
          </div>
        </div>

        {/* Today's Meals */}
<div className="bg-white rounded-xl p-4 shadow-sm">
  <div className="flex items-center gap-2 mb-3">
    <span className="text-xl">🍽️</span>
    <h2 className="font-semibold text-gray-800">Today's Meals</h2>
  </div>

  {todaysMeals.length > 0 ? (
    <div className="space-y-3">
      {todaysMeals.map((meal, index) => (
        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
              {meal.meal_type === 'breakfast' ? '🍳' : 
               meal.meal_type === 'lunch' ? '🍱' : 
               meal.meal_type === 'dinner' ? '🍽️' : '🍎'}
            </div>
            <div>
              <p className="font-medium text-gray-800">{meal.name}</p>
              <p className="text-xs text-gray-500">{meal.calories} cal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold text-gray-800">{meal.carbs}g</p>
              <p className="text-xs text-green-500">carbs</p>
            </div>
            <button
              onClick={() => handleDeleteFood(meal.meal_food_id)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-6 text-gray-400">
      <p>No meals logged yet today</p>
      <button 
        onClick={() => navigate('/search')}
        className="mt-2 text-blue-500 text-sm font-medium"
      >
        + Add your first meal
      </button>
    </div>
  )}
</div>
      </div>
    </div>
  );
};

export default HomePage;