import { useNavigate } from 'react-router-dom';

const FoodCard = ({ food }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/food/${food.food_id}`)}
      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{food.food_name}</h3>
        <p className="text-sm text-blue-500">{food.category}</p>
        <p className="text-sm text-gray-500 mt-1">
          {food.carbs_g}g carbs • {food.calories} cal
        </p>
      </div>
      <div className="text-right">
        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
          {food.calories} cal
        </span>
      </div>
    </div>
  );
};

export default FoodCard;