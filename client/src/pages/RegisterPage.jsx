import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, User, Heart, Target } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Step 2: Personal Info
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [weightGoal, setWeightGoal] = useState('');

  // Step 3: Health
  const [conditions, setConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);

  // Step 4: Goals
  const [goals, setGoals] = useState({
    calories: 2000,
    carbs: 250,
    protein: 50,
    fat: 65,
    sugar: 50,
    sodium: 2300
  });

  const conditionOptions = ['Diabetes', 'Hypertension', 'Overweight', 'High Cholesterol', 'None'];
  const allergyOptions = ['Shellfish', 'Seafood', 'Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy'];
  const genderOptions = ['Male', 'Female', 'Other'];

  const toggleCondition = (condition) => {
    if (condition === 'None') {
      setConditions(['None']);
    } else {
      setConditions(prev => {
        const filtered = prev.filter(c => c !== 'None');
        if (filtered.includes(condition)) {
          return filtered.filter(c => c !== condition);
        }
        return [...filtered, condition];
      });
    }
  };

  const toggleAllergy = (allergy) => {
    setAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const handleGoalChange = (field, value) => {
    setGoals(prev => ({ ...prev, [field]: Number(value) }));
  };

  const validateStep = () => {
    setError('');
    
    switch (step) {
      case 1:
        if (!email || !password || !name) {
          setError('Please fill in all fields');
          return false;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        return true;
      case 2:
        if (!age || !gender || !heightCm || !weightKg) {
          setError('Please fill in all fields');
          return false;
        }
        return true;
      case 3:
        return true; // Optional
      case 4:
        return true; // Has defaults
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      const userData = {
        email,
        password,
        name,
        age: Number(age),
        gender,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        weight_goal: weightGoal ? Number(weightGoal) : null,
        conditions: conditions.filter(c => c !== 'None'),
        allergies,
        goals
      };

      const data = await registerUser(userData);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= s 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step > s ? <Check className="w-4 h-4" /> : s}
          </div>
          {s < 4 && (
            <div className={`w-8 h-1 ${step > s ? 'bg-blue-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <User className="w-12 h-12 text-blue-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800">Create Account</h3>
        <p className="text-sm text-gray-500">Let's start with your login details</p>
      </div>

      <div>
        <label className="text-sm text-gray-600 font-medium">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 font-medium">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 font-medium">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <span className="text-2xl">📏</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
        <p className="text-sm text-gray-500">Help us calculate your BMI and needs</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600 font-medium">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 font-medium">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            {genderOptions.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600 font-medium">Height (cm)</label>
          <input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="170"
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 font-medium">Weight (kg)</label>
          <input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="70"
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 font-medium">Weight Goal (kg) - Optional</label>
        <input
          type="number"
          value={weightGoal}
          onChange={(e) => setWeightGoal(e.target.value)}
          placeholder="Target weight"
          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Live BMI Preview */}
      {heightCm && weightKg && (
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Your BMI</p>
          <p className="text-2xl font-bold text-blue-800">
            {(weightKg / ((heightCm / 100) ** 2)).toFixed(1)}
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Heart className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800">Health Information</h3>
        <p className="text-sm text-gray-500">Help us personalize recommendations</p>
      </div>

      <div>
        <label className="text-sm text-gray-600 font-medium">Health Conditions</label>
        <p className="text-xs text-gray-400 mb-2">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {conditionOptions.map(condition => (
            <button
              key={condition}
              type="button"
              onClick={() => toggleCondition(condition)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                conditions.includes(condition)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {conditions.includes(condition) && '✓ '}{condition}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 font-medium">Allergies & Restrictions</label>
        <p className="text-xs text-gray-400 mb-2">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {allergyOptions.map(allergy => (
            <button
              key={allergy}
              type="button"
              onClick={() => toggleAllergy(allergy)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                allergies.includes(allergy)
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {allergies.includes(allergy) && '✓ '}{allergy}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Target className="w-12 h-12 text-green-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800">Daily Goals</h3>
        <p className="text-sm text-gray-500">Set your nutrition targets</p>
      </div>

      <div>
        <label className="text-sm text-gray-600 font-medium">Calorie Target</label>
        <input
          type="number"
          value={goals.calories}
          onChange={(e) => handleGoalChange('calories', e.target.value)}
          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-gray-600 font-medium">Carbs (g)</label>
          <input
            type="number"
            value={goals.carbs}
            onChange={(e) => handleGoalChange('carbs', e.target.value)}
            className="w-full mt-1 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 font-medium">Protein (g)</label>
          <input
            type="number"
            value={goals.protein}
            onChange={(e) => handleGoalChange('protein', e.target.value)}
            className="w-full mt-1 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 font-medium">Fats (g)</label>
          <input
            type="number"
            value={goals.fat}
            onChange={(e) => handleGoalChange('fat', e.target.value)}
            className="w-full mt-1 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600 font-medium">Sodium (mg)</label>
          <input
            type="number"
            value={goals.sodium}
            onChange={(e) => handleGoalChange('sodium', e.target.value)}
            className="w-full mt-1 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 font-medium">Sugar (g)</label>
          <input
            type="number"
            value={goals.sugar}
            onChange={(e) => handleGoalChange('sugar', e.target.value)}
            className="w-full mt-1 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Preview */}
      <div className="bg-green-50 rounded-xl p-4 mt-4">
        <p className="text-sm text-green-600 font-medium mb-2">Your Daily Targets</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-green-800">{goals.calories}</p>
            <p className="text-xs text-green-600">Calories</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-800">{goals.carbs}g</p>
            <p className="text-xs text-green-600">Carbs</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-800">{goals.protein}g</p>
            <p className="text-xs text-green-600">Protein</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 flex flex-col justify-center p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white">Join GlucoSG</h1>
      </div>

      {/* Register Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        {renderStepIndicator()}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}
          
          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 disabled:bg-green-300"
            >
              {loading ? 'Creating Account...' : (
                <>
                  <Check className="w-5 h-5" />
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>

        {step === 1 && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;