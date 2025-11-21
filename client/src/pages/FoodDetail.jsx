import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFoodById, logMeal } from '../api/foodApi';
import { getProfile } from '../api/profileApi';
import { MapPin, AlertTriangle } from 'lucide-react';

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portion, setPortion] = useState(1);
  const [mealType, setMealType] = useState('Lunch');
  const [logging, setLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const [allergies, setAllergies] = useState([]);
  const [detectedAllergen, setDetectedAllergen] = useState(null);

  // Allergen detection logic (same as FoodSearch)
  const checkAllergen = (food, userAllergies) => {
    const foodName = food.food_name?.toLowerCase() || '';
    const category = food.category?.toLowerCase() || '';
    
    const allergenKeywords = {
      'shellfish': ['prawn', 'shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'squid', 'shellfish'],
      'seafood': ['fish', 'salmon', 'tuna', 'cod', 'prawn', 'shrimp', 'crab', 'seafood', 'squid'],
      'nuts': ['peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'nut'],
      'dairy': ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'dairy'],
      'eggs': ['egg', 'omelette', 'scrambled'],
      'gluten': ['bread', 'wheat', 'pasta', 'noodle', 'flour', 'baguette'],
      'soy': ['soy', 'tofu', 'tempeh', 'edamame']
    };

    for (const allergy of userAllergies) {
      const keywords = allergenKeywords[allergy] || [allergy];
      for (const keyword of keywords) {
        if (foodName.includes(keyword) || category.includes(keyword)) {
          return allergy;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foodData, profileData] = await Promise.all([
          getFoodById(id),
          getProfile()
        ]);
        console.log('Food data:', foodData);
        setFood(foodData);
        
        const userAllergies = profileData.allergies.map(a => a.allergy_name.toLowerCase());
        setAllergies(userAllergies);
        
        // Check if this food contains allergens
        const allergen = checkAllergen(foodData, userAllergies);
        setDetectedAllergen(allergen);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Calculate adjusted nutrition based on portion
  const adjustedNutrition = food ? {
    carbs: (food.carbs_g * portion).toFixed(1),
    protein: (food.protein_g * portion).toFixed(1),
    fat: (food.fat_g * portion).toFixed(1),
    calories: Math.round(food.calories * portion),
  } : null;

  // Calculate glucose impact using real GI
  const calculateGlucoseImpact = (food, portion) => {
    const gi = food.glycemic_index || 50;
    const netCarbs = (food.carbs_g - (food.fiber_g || 0)) * portion;
    const gl = (netCarbs * gi) / 100;
    return Math.round(gl);
  };

  const glucoseImpact = food ? calculateGlucoseImpact(food, portion) : 0;

  // Determine impact level for styling
  const getImpactLevel = (impact) => {
    if (impact < 10) return { label: 'Low', color: 'green', message: 'Low impact. Good choice!' };
    if (impact < 20) return { label: 'Medium', color: 'yellow', message: 'Moderate impact. Consider portion size.' };
    return { label: 'High', color: 'red', message: 'High impact. Balance with protein/fiber.' };
  };

  const impactLevel = getImpactLevel(glucoseImpact);

  const portionOptions = [
    { label: 'Small', value: 0.7, desc: '~70%' },
    { label: 'Medium', value: 1, desc: 'Standard' },
    { label: 'Large', value: 1.3, desc: '~30% more' },
  ];

  // Calculate health score (1-10)
  const calculateHealthScore = (food, portion) => {
    let score = 5;
    
    const calories = food.calories * portion;
    const gl = calculateGlucoseImpact(food, portion);
    const protein = food.protein_g * portion;
    const fiber = (food.fiber_g || 0) * portion;
    const fat = food.fat_g * portion;
    const carbs = food.carbs_g * portion;
    const category = food.category?.toLowerCase() || '';

    if (category.includes('vegetable')) score += 2;
    else if (category.includes('protein') || category.includes('fish')) score += 1.5;
    else if (category.includes('fruit')) score += 1;
    else if (category.includes('dessert') || category.includes('sweet')) score -= 2;
    else if (category.includes('beverage')) score -= 1;
    else if (category.includes('grain')) score += 0.5;

    if (gl >= 20) score -= 2.5;
    else if (gl >= 10) score -= 1.5;
    else if (gl < 5) score += 1;

    if (calories > 600) score -= 2;
    else if (calories > 400) score -= 1.5;
    else if (calories > 250) score -= 0.5;
    else if (calories < 100) score += 0.5;

    if (protein >= 25) score += 1.5;
    else if (protein >= 15) score += 1;
    else if (protein >= 8) score += 0.5;

    if (fiber >= 6) score += 1.5;
    else if (fiber >= 3) score += 1;
    else if (fiber >= 1) score += 0.5;

    if (fat > 25) score -= 2;
    else if (fat > 15) score -= 1;
    else if (fat > 10) score -= 0.5;

    if (carbs > 40 && fiber < 2) score -= 1.5;
    else if (carbs > 25 && fiber < 1) score -= 1;

    if (protein > 0 && carbs > 0) {
      const ratio = protein / carbs;
      if (ratio > 1) score += 1;
      else if (ratio > 0.5) score += 0.5;
    }

    return Math.max(1, Math.min(10, Math.round(score)));
  };

  const getScoreColor = (score) => {
    if (score >= 7) return { bg: 'bg-green-50', text: 'text-green-700', ring: 'stroke-green-500', label: 'Healthy Choice', emoji: '🥗' };
    if (score >= 4) return { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'stroke-orange-500', label: 'Moderate', emoji: '⚖️' };
    return { bg: 'bg-red-50', text: 'text-red-700', ring: 'stroke-red-500', label: 'Limit This', emoji: '⚠️' };
  };

  const healthScore = food ? calculateHealthScore(food, portion) : 0;
  const scoreStyle = getScoreColor(healthScore);

  const handleLogMeal = async () => {
    // Block logging if allergen detected
    if (detectedAllergen) {
      alert(`Cannot log this meal - it contains ${detectedAllergen} which is in your allergy list.`);
      return;
    }
    
    try {
      setLogging(true);
      await logMeal(food.food_id, portion, mealType);
      setLogSuccess(true);
      setTimeout(() => setLogSuccess(false), 2000);
    } catch (error) {
      console.error('Error logging meal:', error);
      alert('Failed to log meal');
    } finally {
      setLogging(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!food) return <div className="p-4">Food not found</div>;

  const openGoogleMaps = () => {
    const query = encodeURIComponent(food.food_name + ' near me');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/search')}
        className="text-blue-500 font-medium mb-4"
      >
        ← Back to search
      </button>

      {/* Allergy Warning Banner */}
      {detectedAllergen && (
        <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 rounded-full p-2">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-red-800 text-lg">Allergy Warning!</p>
              <p className="text-red-700">
                This food may contain <strong>{detectedAllergen}</strong> which is in your allergy list.
              </p>
              <p className="text-red-600 text-sm mt-1">Logging is disabled for your safety.</p>
            </div>
          </div>
        </div>
      )}

      {/* Food Header */}
      <div className={`bg-white rounded-xl p-4 shadow-sm mb-4 ${detectedAllergen ? 'border-2 border-red-300' : ''}`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800">{food.food_name}</h1>
              {detectedAllergen && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {detectedAllergen}
                </span>
              )}
            </div>
            <p className="text-blue-500 text-sm">{food.category}</p>
            <button 
              onClick={openGoogleMaps}
              className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors mt-2"
              title="Find nearby on Google Maps"
            >
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-600">Find Nearby</span>
            </button>
          </div>
        </div>
      </div>

      {/* Health Score - Circular Gauge Design */}
      <div className={`rounded-xl p-4 mb-4 ${scoreStyle.bg}`}>
        <p className={`text-sm font-medium mb-3 ${scoreStyle.text}`}>HEALTH SCORE</p>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={scoreStyle.ring}
                strokeDasharray={`${(healthScore / 10) * 251.2} 251.2`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${scoreStyle.text}`}>{healthScore}</span>
              <span className="text-xs text-gray-500">/10</span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{scoreStyle.emoji}</span>
              <span className={`font-semibold ${scoreStyle.text}`}>{scoreStyle.label}</span>
            </div>
            <p className="text-xs text-gray-500">
              {healthScore >= 7 && "Great nutritional balance!"}
              {healthScore >= 4 && healthScore < 7 && "Okay in moderation."}
              {healthScore < 4 && "Consider healthier alternatives."}
            </p>
          </div>
        </div>
      </div>

      {/* Glucose Impact */}
      <div className={`rounded-xl p-4 mb-4 ${
        impactLevel.color === 'green' ? 'bg-green-50' :
        impactLevel.color === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'
      }`}>
        <p className={`text-sm font-medium mb-1 ${
          impactLevel.color === 'green' ? 'text-green-700' :
          impactLevel.color === 'yellow' ? 'text-yellow-700' : 'text-red-700'
        }`}>
          GLUCOSE IMPACT
        </p>
        <p className={`text-2xl font-bold ${
          impactLevel.color === 'green' ? 'text-green-800' :
          impactLevel.color === 'yellow' ? 'text-yellow-800' : 'text-red-800'
        }`}>
          +{glucoseImpact} GL
        </p>
        <p className={`text-sm ${
          impactLevel.color === 'green' ? 'text-green-600' :
          impactLevel.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {impactLevel.message}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          GI: {food.glycemic_index || 'N/A'}
        </p>
      </div>

      {/* Nutrition Facts */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Nutrition Facts</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-orange-600 text-xs font-medium">CARBS</p>
            <p className="text-orange-700 text-2xl font-bold">{adjustedNutrition.carbs}g</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-blue-600 text-xs font-medium">PROTEIN</p>
            <p className="text-blue-700 text-2xl font-bold">{adjustedNutrition.protein}g</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-purple-600 text-xs font-medium">FATS</p>
            <p className="text-purple-700 text-2xl font-bold">{adjustedNutrition.fat}g</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-green-600 text-xs font-medium">CALORIES</p>
            <p className="text-green-700 text-2xl font-bold">{adjustedNutrition.calories}</p>
          </div>
        </div>
      </div>

      {/* Portion Size Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Portion Size</h2>
        <div className="flex gap-2">
          {portionOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPortion(option.value)}
              className={`flex-1 py-3 rounded-lg text-center transition-colors ${
                portion === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <p className="font-medium">{option.label}</p>
              <p className="text-xs opacity-75">{option.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Fine Tune: {portion.toFixed(1)}x</p>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={portion}
            onChange={(e) => setPortion(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Meal Type Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Meal Type</h2>
        <div className="flex gap-2">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mealType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-20 left-4 right-4 space-y-2">
        <button 
          onClick={handleLogMeal}
          disabled={logging || detectedAllergen}
          className={`w-full py-4 rounded-xl font-medium transition-colors ${
            detectedAllergen
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : logSuccess 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white'
          } ${logging ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {detectedAllergen 
            ? `⚠️ Cannot Log - Contains ${detectedAllergen}`
            : logging 
              ? 'Logging...' 
              : logSuccess 
                ? '✓ Logged!' 
                : '+ Log This Meal'}
        </button>
        <button 
          onClick={() => navigate('/search')}
          className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-medium"
        >
          Back to Search
        </button>
      </div>
    </div>
  );
};

export default FoodDetail;