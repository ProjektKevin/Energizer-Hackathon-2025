import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const FoodCard = ({ food }) => {
  const navigate = useNavigate();

  // Calculate health score (same logic as FoodDetail)
  const calculateHealthScore = (food) => {
    let score = 5;
    
    const calories = food.calories;
    const carbs = food.carbs_g;
    const protein = food.protein_g;
    const fiber = food.fiber_g || 0;
    const fat = food.fat_g;
    const gi = food.glycemic_index || 50;
    const netCarbs = carbs - fiber;
    const gl = (netCarbs * gi) / 100;
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

    return Math.max(1, Math.min(10, Math.round(score)));
  };

  const getScoreStyle = (score) => {
    if (score >= 7) return { bg: 'bg-green-500', text: 'text-white' };
    if (score >= 4) return { bg: 'bg-orange-500', text: 'text-white' };
    return { bg: 'bg-red-500', text: 'text-white' };
  };

  const healthScore = calculateHealthScore(food);
  const scoreStyle = getScoreStyle(healthScore);

  const handleFindNearby = (e) => {
    e.stopPropagation();
    const query = encodeURIComponent(food.food_name + ' near me');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div 
      onClick={() => navigate(`/food/${food.food_id}`)}
      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Health Score Badge with Label */}
      <div className="flex flex-col items-center mr-3 shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scoreStyle.bg}`}>
          <span className={`text-sm font-bold ${scoreStyle.text}`}>{healthScore}</span>
        </div>
        <span className="text-xs text-gray-500 mt-1">Health</span>
      </div>

      {/* Food Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 truncate">{food.food_name}</h3>
        <p className="text-sm text-blue-500">{food.category}</p>
        <p className="text-sm text-gray-500 mt-1">
          {food.carbs_g}g carbs • {food.calories} cal
        </p>
      </div>

      {/* Right side - Location + Calories */}
      <div className="flex flex-col items-end gap-2 ml-2">
        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
          {food.calories} cal
        </span>
        <button
          onClick={handleFindNearby}
          className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          title="Find nearby"
        >
          <MapPin className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-600">Nearby</span>
        </button>
      </div>
    </div>
  );
};

export default FoodCard;