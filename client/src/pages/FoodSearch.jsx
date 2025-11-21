import { useState, useEffect } from 'react';
import { getAllFoods } from '../api/foodApi';
import FoodCard from '../components/FoodCard';
import { getProfile } from '../api/profileApi';
import { AlertTriangle } from 'lucide-react';

const FoodSearch = () => {
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [allergies, setAllergies] = useState([]);

   useEffect(() => {
    const fetchData = async () => {
      try {
        const [foodData, profileData] = await Promise.all([
          getAllFoods(),
          getProfile()
        ]);
        setFoods(foodData);
        setAllergies(profileData.allergies.map(a => a.allergy_name.toLowerCase()));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

   const hasAllergen = (food) => {
    const foodName = food.food_name?.toLowerCase() || '';
    const category = food.category?.toLowerCase() || '';
    
    // Map allergy names to food keywords
    const allergenKeywords = {
      'shellfish': ['prawn', 'shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'squid', 'shellfish'],
      'seafood': ['fish', 'salmon', 'tuna', 'cod', 'prawn', 'shrimp', 'crab', 'seafood', 'squid'],
      'nuts': ['peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'nut'],
      'dairy': ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'dairy'],
      'eggs': ['egg', 'omelette', 'scrambled'],
      'gluten': ['bread', 'wheat', 'pasta', 'noodle', 'flour', 'baguette'],
      'soy': ['soy', 'tofu', 'tempeh', 'edamame']
    };

    for (const allergy of allergies) {
      const keywords = allergenKeywords[allergy] || [allergy];
      for (const keyword of keywords) {
        if (foodName.includes(keyword) || category.includes(keyword)) {
          return allergy;
        }
      }
    }
    return null;
  };

  // Apply filters
  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.food_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const calculateGL = (food) => {
      const gi = food.glycemic_index || 50;
      const netCarbs = food.carbs_g - (food.fiber_g || 0);
      return (netCarbs * gi) / 100;
    };

    let matchesFilter = true;
    switch (activeFilter) {
      case 'low-calorie':
        matchesFilter = food.calories < 300;
        break;
      case 'low-carbs':
        matchesFilter = food.carbs_g < 30;
        break;
      case 'high-protein':
        matchesFilter = food.protein_g > 20;
        break;
      case 'beverage':
        matchesFilter = food.category?.toLowerCase().includes('beverage');
        break;
      case 'low-gl':
        matchesFilter = calculateGL(food) < 10;
        break;
      case 'high-gl':
        matchesFilter = calculateGL(food) >= 20;
        break;
      default:
        matchesFilter = true;
    }
    
    return matchesSearch && matchesFilter;
  });

 const handleFoodClick = (food) => {
    const allergen = hasAllergen(food);
    if (allergen) {
      if (!confirm(`⚠️ Warning: This food may contain ${allergen}!\n\nYou have this listed as an allergy. Do you still want to view it?`)) {
        return;
      }
    }
    console.log('Selected food:', food);
  };

  const filters = [
    { id: 'all', label: 'All Foods' },
    { id: 'low-calorie', label: 'Low Calorie' },
    { id: 'low-carbs', label: 'Low Carbs' },
    { id: 'high-protein', label: 'High Protein' },
    { id: 'beverage', label: 'Beverage' }, 
    { id: 'low-gl', label: '🟢 Low GL' },      // Add this
    { id: 'high-gl', label: '🔴 High GL' },
  ];

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Find Your Food</h1>
      
      {/* Allergy Warning Banner */}
      {allergies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="text-sm text-amber-700">
            Watching for: <strong>{allergies.join(', ')}</strong>
          </p>
        </div>
      )}

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search Singapore foods..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 rounded-xl border border-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.id
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-3">{filteredFoods.length} foods found</p>

      {/* Food List */}
      <div className="space-y-3">
        {filteredFoods.map((food) => {
          const allergen = hasAllergen(food);
          return (
            <div key={food.food_id} className="relative">
              {allergen && (
                <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {allergen}
                </div>
              )}
              <FoodCard 
                food={food} 
                onClick={() => handleFoodClick(food)}
                className={allergen ? 'border-2 border-red-300 bg-red-50' : ''}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FoodSearch;