import { useState, useEffect } from 'react';
import { getAllFoods } from '../api/foodApi';
import FoodCard from '../components/FoodCard';

const FoodSearch = () => {
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const data = await getAllFoods();
        setFoods(data);
      } catch (error) {
        console.error('Error fetching foods:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);


  // Apply filters
  const filteredFoods = foods.filter(food => {
    // Search filter
    const matchesSearch = food.food_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Helper function to calculate GL
const calculateGL = (food) => {
  const gi = food.glycemic_index || 50;
  const netCarbs = food.carbs_g - (food.fiber_g || 0);
  return (netCarbs * gi) / 100;
};
    // Category filter
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
        {filteredFoods.map((food) => (
          <FoodCard 
            key={food.food_id} 
            food={food} 
            onClick={handleFoodClick}
          />
        ))}
      </div>
    </div>
  );
};

export default FoodSearch;