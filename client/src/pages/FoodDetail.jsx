import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFoodById } from '../api/foodApi';
import { MapPin } from 'lucide-react';  // Add this line

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portion, setPortion] = useState(1);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const data = await getFoodById(id);
        console.log('Food data:', data); // Add this line
        setFood(data);
      } catch (error) {
        console.error('Error fetching food:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFood();
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

      {/* Food Header */}
{/* Food Header */}
<div className="bg-white rounded-xl p-4 shadow-sm mb-4">
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-xl font-bold text-gray-800">{food.food_name}</h1>
      <p className="text-blue-500 text-sm">{food.category}</p>
    </div>
    <button 
      onClick={openGoogleMaps}
      className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
      title="Find nearby on Google Maps"
    >
      <MapPin className="w-4 h-4 text-red-500" />
      <span className="text-xs font-medium text-red-600">Find Nearby</span>
    </button>
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

        {/* Fine-tune slider */}
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

     {/* Action Buttons */}
<div className="fixed bottom-20 left-4 right-4 space-y-2">
  <button className="w-full bg-blue-500 text-white py-4 rounded-xl font-medium">
    + Log This Meal
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