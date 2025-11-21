import { useState, useEffect } from 'react';
import { getDailyStats, deleteMealFood } from '../api/foodApi';
import { Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('Daily');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDailyStats(selectedDate);
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedDate]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleDeleteFood = async (mealFoodId) => {
  if (!confirm('Remove this food from your log?')) return;
  
  try {
    await deleteMealFood(mealFoodId);
    // Refresh stats
    const data = await getDailyStats(selectedDate);
    setStats(data);
  } catch (error) {
    console.error('Error deleting food:', error);
    alert('Failed to remove food');
  }
};

  const getProgressColor = (current, goal, isLimitType = false) => {
    const percentage = (current / goal) * 100;
    if (isLimitType) {
      // For sugar/sodium - lower is better
      if (percentage >= 90) return 'bg-red-500';
      if (percentage >= 70) return 'bg-orange-500';
      return 'bg-green-500';
    } else {
      // For protein/fiber - higher is better
      if (percentage >= 80) return 'bg-green-500';
      if (percentage >= 50) return 'bg-orange-500';
      return 'bg-gray-300';
    }
  };

  const getStatusMessage = (current, goal, nutrient, isLimitType = false) => {
    const remaining = goal - current;
    const percentage = (current / goal) * 100;
    
    if (isLimitType) {
      if (percentage >= 100) return { text: `Over by ${Math.abs(Math.round(remaining))}${nutrient === 'sodium' ? 'mg' : 'g'}`, color: 'text-red-600', icon: 'warning' };
      if (percentage >= 80) return { text: `High • Only ${Math.round(remaining)}${nutrient === 'sodium' ? 'mg' : 'g'} remaining`, color: 'text-orange-600', icon: 'warning' };
      return { text: `On track • ${Math.round(remaining)}${nutrient === 'sodium' ? 'mg' : 'g'} left`, color: 'text-green-600', icon: 'check' };
    } else {
      if (percentage >= 100) return { text: `Goal reached!`, color: 'text-green-600', icon: 'check' };
      if (percentage >= 70) return { text: `Good • ${Math.round(remaining)}g left`, color: 'text-green-600', icon: 'check' };
      return { text: `Need ${Math.round(remaining)}g more`, color: 'text-gray-600', icon: 'none' };
    }
  };

  if (loading) return <div className="p-4 pb-24">Loading stats...</div>;
  if (!stats) return <div className="p-4 pb-24">Failed to load stats</div>;

  const { totals, goals, conditions, meals } = stats;
const caloriesRemaining = goals.calories - totals.calories;
const hasDiabetes = conditions.includes('Diabetes');
const hasOverweight = conditions.includes('Overweight');  // Add this line
const sugarPercentage = (totals.sugar / goals.sugar) * 100;
const hasHypertension = conditions.includes('Hypertension');       // Add this
const hasHighCholesterol = conditions.includes('High Cholesterol'); // Add this
  // Group meals by type
  const mealsByType = {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: []
  };
  
  meals.forEach(meal => {
  const type = meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);
  if (mealsByType[type]) {
    meal.meal_foods.forEach(mf => {
      if (mf.foods) {
        mealsByType[type].push({
          ...mf.foods,
          quantity: mf.quantity,
          meal_food_id: mf.meal_food_id  // Add this
        });
      }
    });
  }
});

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-b-3xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">📊</span>
          <h1 className="text-xl font-bold">Nutrition Stats</h1>
        </div>
        <p className="text-blue-100 text-sm">Track your progress over time</p>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          {['Daily', 'Weekly', 'Monthly'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeDate(-1)} className="p-2">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 font-medium">{formatDate(selectedDate)}</span>
          </div>
          <button onClick={() => changeDate(1)} className="p-2">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calories Remaining Card */}
        <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-xl p-4 mb-4 text-white relative overflow-hidden">
          <p className="text-green-100 text-sm font-medium">CALORIES REMAINING</p>
          <p className="text-4xl font-bold">{Math.max(0, Math.round(caloriesRemaining))} <span className="text-lg font-normal">kcal</span></p>
          <p className="text-green-100 text-sm mt-1">
            You've consumed {Math.round(totals.calories)} / {goals.calories} kcal today
          </p>
          <div className="absolute right-4 top-4 text-5xl opacity-30">🎯</div>
        </div>

        {/* Macronutrients */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span>📝</span>
            <h2 className="font-semibold text-gray-800">Macronutrients</h2>
          </div>

          {/* Carbs */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Carbs</span>
              <span className="text-orange-600 font-medium">{Math.round(totals.carbs)}g / {goals.carbs}g</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totals.carbs / goals.carbs) * 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${getStatusMessage(totals.carbs, goals.carbs, 'carbs').color}`}>
              ✓ On track • {Math.round(goals.carbs - totals.carbs)}g left
            </p>
          </div>

          {/* Sugar */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Sugar {hasDiabetes && '⚠️'}</span>
              <span className="text-red-600 font-medium">{Math.round(totals.sugar)}g / {goals.sugar}g</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${getProgressColor(totals.sugar, goals.sugar, true)}`}
                style={{ width: `${Math.min(100, sugarPercentage)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${getStatusMessage(totals.sugar, goals.sugar, 'sugar', true).color}`}>
              {sugarPercentage >= 80 ? '⚠️' : '✓'} {getStatusMessage(totals.sugar, goals.sugar, 'sugar', true).text}
            </p>
          </div>

          {/* Protein */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Protein</span>
              <span className="text-blue-600 font-medium">{Math.round(totals.protein)}g / {goals.protein}g</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${getProgressColor(totals.protein, goals.protein, false)}`}
                style={{ width: `${Math.min(100, (totals.protein / goals.protein) * 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${getStatusMessage(totals.protein, goals.protein, 'protein').color}`}>
              ✓ {getStatusMessage(totals.protein, goals.protein, 'protein').text}
            </p>
          </div>

          {/* Fats */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Fats</span>
              <span className="text-purple-600 font-medium">{Math.round(totals.fat)}g / {goals.fat}g</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totals.fat / goals.fat) * 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${getStatusMessage(totals.fat, goals.fat, 'fat').color}`}>
              ✓ {getStatusMessage(totals.fat, goals.fat, 'fat').text}
            </p>
          </div>

          {/* Sodium */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Sodium</span>
              <span className="text-gray-600 font-medium">{Math.round(totals.sodium)}mg / {goals.sodium}mg</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${getProgressColor(totals.sodium, goals.sodium, true)}`}
                style={{ width: `${Math.min(100, (totals.sodium / goals.sodium) * 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${getStatusMessage(totals.sodium, goals.sodium, 'sodium', true).color}`}>
              {getStatusMessage(totals.sodium, goals.sodium, 'sodium', true).text}
            </p>
          </div>
        </div>

      {/* Condition-Based Alerts */}
{conditions.length > 0 && (
  <div className="space-y-3 mb-4">
    
    {/* Diabetes Alert - Sugar Warning */}
    {hasDiabetes && sugarPercentage >= 70 && (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-red-700">Sugar Alert - Diabetes Management</h3>
            <p className="text-sm text-red-600 mt-1">
              Your sugar intake is <strong>{Math.round(sugarPercentage)}% of daily limit</strong>. You can have:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>☕ 1 cup of coffee with 1 tsp sugar (4g)</li>
              <li>🍎 1 small apple (~8g natural sugar)</li>
            </ul>
            <p className="text-sm text-red-500 mt-2">✗ Avoid: Sweet drinks, desserts, white bread</p>
          </div>
        </div>
      </div>
    )}

    {/* Diabetes Alert - Carbs Warning */}
    {hasDiabetes && (totals.carbs / goals.carbs) * 100 >= 80 && (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🍞</span>
          <div>
            <h3 className="font-semibold text-orange-700">Carbs Alert - Blood Sugar Control</h3>
            <p className="text-sm text-orange-600 mt-1">
              You've consumed <strong>{Math.round((totals.carbs / goals.carbs) * 100)}%</strong> of your carbs limit. High carbs can spike blood sugar.
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>✓ Choose low-GI foods like vegetables, legumes</li>
              <li>✓ Pair carbs with protein to slow absorption</li>
            </ul>
            <p className="text-sm text-orange-500 mt-2">✗ Avoid: White rice, bread, noodles</p>
          </div>
        </div>
      </div>
    )}

    {/* Hypertension Alert - Sodium Warning */}
    {hasHypertension && (totals.sodium / goals.sodium) * 100 >= 70 && (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧂</span>
          <div>
            <h3 className="font-semibold text-blue-700">Sodium Alert - Blood Pressure Control</h3>
            <p className="text-sm text-blue-600 mt-1">
              Sodium intake at <strong>{Math.round((totals.sodium / goals.sodium) * 100)}%</strong>. High sodium can raise blood pressure.
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>✓ Choose fresh foods over processed</li>
              <li>✓ Ask for less salt when eating out</li>
              <li>✓ Use herbs and spices for flavor</li>
            </ul>
            <p className="text-sm text-blue-500 mt-2">✗ Avoid: Soy sauce, processed meats, instant noodles</p>
          </div>
        </div>
      </div>
    )}

    {/* High Cholesterol Alert - Fat Warning */}
    {hasHighCholesterol && (totals.fat / goals.fat) * 100 >= 75 && (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🫀</span>
          <div>
            <h3 className="font-semibold text-amber-700">Fat Alert - Cholesterol Management</h3>
            <p className="text-sm text-amber-600 mt-1">
              Fat intake at <strong>{Math.round((totals.fat / goals.fat) * 100)}%</strong>. Watch saturated fat for heart health.
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>✓ Choose lean proteins, fish, tofu</li>
              <li>✓ Use olive oil instead of butter</li>
              <li>✓ Eat more fiber to lower cholesterol</li>
            </ul>
            <p className="text-sm text-amber-500 mt-2">✗ Avoid: Fried foods, fatty meats, full-fat dairy</p>
          </div>
        </div>
      </div>
    )}

    {/* Overweight Alert - Calorie Warning */}
    {hasOverweight && (totals.calories / goals.calories) * 100 >= 85 && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <h3 className="font-semibold text-yellow-700">Calorie Alert - Weight Management</h3>
            <p className="text-sm text-yellow-600 mt-1">
              You've consumed <strong>{Math.round((totals.calories / goals.calories) * 100)}%</strong> of your daily calories.
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>🥗 Fill up on vegetables and lean protein</li>
              <li>💧 Drink water before meals</li>
            </ul>
            <p className="text-sm text-yellow-600 mt-2">✗ Avoid: Fried foods, sugary snacks</p>
          </div>
        </div>
      </div>
    )}

    {/* Overweight Alert - Fat Warning */}
    {hasOverweight && (totals.fat / goals.fat) * 100 >= 80 && (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧈</span>
          <div>
            <h3 className="font-semibold text-purple-700">Fat Alert - Watch Your Intake</h3>
            <p className="text-sm text-purple-600 mt-1">
              Fat intake at <strong>{Math.round((totals.fat / goals.fat) * 100)}%</strong>. Choose healthy fats wisely.
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>✓ Opt for grilled over fried</li>
              <li>✓ Choose lean meats like chicken breast, fish</li>
            </ul>
            <p className="text-sm text-purple-500 mt-2">✗ Avoid: Deep-fried foods, fatty cuts</p>
          </div>
        </div>
      </div>
    )}

    {/* All Good Message */}
    {conditions.length > 0 && 
      !(hasDiabetes && sugarPercentage >= 70) && 
      !(hasDiabetes && (totals.carbs / goals.carbs) * 100 >= 80) &&
      !(hasHypertension && (totals.sodium / goals.sodium) * 100 >= 70) &&
      !(hasHighCholesterol && (totals.fat / goals.fat) * 100 >= 75) &&
      !(hasOverweight && (totals.calories / goals.calories) * 100 >= 85) &&
      !(hasOverweight && (totals.fat / goals.fat) * 100 >= 80) && (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="font-semibold text-green-700">You're Doing Great!</h3>
            <p className="text-sm text-green-600 mt-1">
              Your nutrition is within healthy limits for your conditions. Keep it up!
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {/* Daily Goals Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🎯</span>
            <h2 className="font-semibold text-gray-800">Daily Goals</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-orange-600 text-xs font-medium">CALORIES</p>
              <p className="text-orange-700 text-xl font-bold">{goals.calories}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-yellow-600 text-xs font-medium">CARBS</p>
              <p className="text-yellow-700 text-xl font-bold">{goals.carbs}g</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-600 text-xs font-medium">SUGAR</p>
              <p className="text-red-700 text-xl font-bold">{goals.sugar}g</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-blue-600 text-xs font-medium">PROTEIN</p>
              <p className="text-blue-700 text-xl font-bold">{goals.protein}g</p>
            </div>
          </div>
        </div>

        {/* Meal Diary */}
{activeTab === 'Daily' && (
  <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
    <div className="flex items-center gap-2 mb-4">
      <span>🍽️</span>
      <h2 className="font-semibold text-gray-800">Today's Meals</h2>
    </div>

    {Object.entries(mealsByType).map(([mealType, foods]) => (
      <div key={mealType} className="mb-4 last:mb-0">
        <h3 className="text-sm font-medium text-gray-500 mb-2">{mealType}</h3>
        {foods.length > 0 ? (
          <div className="space-y-2">
            {foods.map((food, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{food.food_name}</p>
                  <p className="text-xs text-gray-500">
                    {food.quantity !== 1 && `${food.quantity}x • `}
                    {Math.round(food.calories * food.quantity)} cal
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-600">{Math.round(food.carbs_g * food.quantity)}g carbs</p>
                  <button
                    onClick={() => handleDeleteFood(food.meal_food_id)}
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
          <p className="text-gray-400 text-sm italic">No foods logged</p>
        )}
      </div>
    ))}
  </div>
)}
      </div>
    </div>
  );
};

export default StatsPage;