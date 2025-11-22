import { useState, useRef } from "react";
import { Dialog, Disclosure } from "@headlessui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import api from "../api/axios";

function QuickRecord() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedFoods, setDetectedFoods] = useState([]);
  const [foodVariations, setFoodVariations] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [userData, setUserData] = useState(null); // Store user goals and intake
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // --- Start recording ---
  const startRecording = async () => {
    setTranscript("");
    setDetectedFoods([]);
    setFoodVariations([]);
    setSelectedVariations({});
    setUserData(null);
    setModalStep(1);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await detectFood(blob);
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.start();
    setRecording(true);
  };

  // --- Stop recording ---
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // --- Toggle recording ---
  const handleRecordClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // --- Send audio to backend ---
  const detectFood = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      console.log("Calling backend now!");
      const response = await api.post("/api/ai/quickRecordSTT", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Extract detected food names from foodCaloryMappingList
      const detectedFoodNames = response.data.foodCaloryMappingList.map(
        (item) => item.foodName
      );

      setDetectedFoods(detectedFoodNames);
      setFoodVariations(response.data.foodCaloryMappingList || []);
      setUserData(response.data.userData || null);
      setModalStep(1);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error detecting food:", error);
      setDetectedFoods([]);
      setFoodVariations([]);
      setUserData(null);
      setIsModalOpen(true);
    }
  };

  // --- Handle variation selection ---
  const handleVariationSelect = (foodIndex, variantIndex) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [foodIndex]: variantIndex,
    }));
  };

  // --- Proceed to next step ---
  const handleNextStep = () => {
    setModalStep(modalStep + 1);
  };

  // --- Go back to previous step ---
  const handleBackStep = () => {
    setModalStep(modalStep - 1);
  };

  // --- Confirm and save selections ---
  const handleConfirm = async () => {
  const finalSelections = Object.entries(selectedVariations).map(([foodIndex, variantIndex]) => {
    const variant = foodVariations[foodIndex].variants[variantIndex];
    return {
      foodId: variant.food_id,
      foodName: variant.name,
      quantity: 1, // You could add a quantity selector in the UI
      calories: variant.calories,
      protein: variant.protein,
      carbs: variant.carbs,
      fiber: variant.fiber,
      sugars: variant.sugars,
      sodium: variant.sodium,
      cholesterol: variant.cholesterol,
    };
  });

  console.log("Final selections:", finalSelections);
  
  try {
    // Optionally detect meal type based on time of day
    const currentHour = new Date().getHours();
    let mealType = 'snack';
    if (currentHour >= 5 && currentHour < 11) mealType = 'breakfast';
    else if (currentHour >= 11 && currentHour < 16) mealType = 'lunch';
    else if (currentHour >= 16 && currentHour < 22) mealType = 'dinner';

    const response = await api.post("/api/tracker/1", { 
      foods: finalSelections,
      mealType: mealType
    });
    
    console.log("response:", response.data.message);
    
    setIsModalOpen(false);
    setSelectedVariations({});
  } catch (error) {
    console.error("Error saving meal:", error);
  }
};


  // --- Calculate nutrition totals for selected items ---
  const calculateTotals = () => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      sodium: 0,
      fiber: 0,
      sugars: 0,
      cholesterol: 0,
    };

    Object.entries(selectedVariations).forEach(([foodIndex, variantIndex]) => {
      const variant = foodVariations[foodIndex].variants[variantIndex];
      // Convert to numbers using parseFloat to handle string values
      totals.calories += parseFloat(variant.calories) || 0;
      totals.protein += parseFloat(variant.protein) || 0;
      totals.carbs += parseFloat(variant.carbs) || 0;
      totals.sodium += parseFloat(variant.sodium) || 0;
      totals.fiber += parseFloat(variant.fiber) || 0;
      totals.sugars += parseFloat(variant.sugars) || 0;
      totals.cholesterol += parseFloat(variant.cholesterol) || 0;
    });

    return totals;
  };

  // --- Progress Bar Component ---
  const NutritionBar = ({ label, current, adding, goal, unit = "g" }) => {
    // Ensure all values are numbers with fallbacks
    const currentValue = parseFloat(current) || 0;
    const addingValue = parseFloat(adding) || 0;
    const goalValue = parseFloat(goal) || 1; // Avoid division by zero

    const currentPercent = Math.min((currentValue / goalValue) * 100, 100);
    const addingPercent =
      Math.min(((currentValue + addingValue) / goalValue) * 100, 100) -
      currentPercent;
    const total = currentValue + addingValue;
    const isOverGoal = total > goalValue;

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className="text-xs text-gray-500">
            {currentValue.toFixed(1)} + {addingValue.toFixed(1)} ={" "}
            <span
              className={
                isOverGoal ? "text-red-600 font-bold" : "font-semibold"
              }
            >
              {total.toFixed(1)}
            </span>{" "}
            / {goalValue} {unit}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
          {/* Current intake */}
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
            style={{ width: `${currentPercent}%` }}
          />
          {/* Adding amount */}
          <div
            className={`absolute top-0 h-full ${
              isOverGoal ? "bg-red-400" : "bg-amber-400"
            } transition-all`}
            style={{
              left: `${currentPercent}%`,
              width: `${addingPercent}%`,
            }}
          />
          {/* Goal line */}
          <div className="absolute top-0 right-0 h-full w-0.5 bg-gray-700" />

          {/* Percentage label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-md">
              {((total / goalValue) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-3 h-3 ${
                isOverGoal ? "bg-red-400" : "bg-amber-400"
              } rounded`}
            ></div>
            <span className="text-gray-600">Adding</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center w-full max-w-md">
        <button
          onClick={handleRecordClick}
          className={`w-full bg-blue-400 text-white py-4 rounded-xl text-lg font-semibold transition-colors ${
            recording ? "bg-red-500 hover:bg-red-600" : "hover:bg-blue-600"
          }`}
        >
          {recording ? "⏹️ Stop Recording" : "🎤 Record Meal"}
        </button>
      </div>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    step <= modalStep ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Show detected foods */}
            {modalStep === 1 && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4">
                  Detected Foods
                </Dialog.Title>

                <div className="space-y-4">
                  {detectedFoods.length > 0 ? (
                    <>
                      <div>
                        <p className="font-semibold mb-2">We detected:</p>
                        <ul className="list-disc ml-6 text-gray-700">
                          {detectedFoods.map((food, i) => (
                            <li key={i} className="capitalize">
                              {food}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">
                      No foods detected. Please try again.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  {detectedFoods.length > 0 && (
                    <button
                      onClick={handleNextStep}
                      className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Next
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Select specific variations */}
            {modalStep === 2 && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4">
                  Select Specific Items
                </Dialog.Title>

                <p className="text-sm text-gray-600 mb-4">
                  Choose the specific variation for each food:
                </p>

                <div className="space-y-3">
                  {foodVariations.map((foodGroup, foodIndex) => {
                    const isSelected =
                      selectedVariations[foodIndex] !== undefined;
                    const selectedVariant = isSelected
                      ? foodGroup.variants[selectedVariations[foodIndex]]
                      : null;

                    return (
                      <Disclosure key={foodIndex} defaultOpen={foodIndex === 0}>
                        {({ open }) => (
                          <div
                            className={`border rounded-lg overflow-hidden transition-all ${
                              isSelected
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200"
                            }`}
                          >
                            <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold capitalize">
                                  {foodGroup.foodName}
                                </span>
                                {isSelected && (
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                    ✓ Selected
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedVariant && (
                                  <span className="text-sm font-semibold text-green-600">
                                    {selectedVariant.calories} cal
                                  </span>
                                )}
                                <ChevronDownIcon
                                  className={`w-5 h-5 text-gray-500 transition-transform ${
                                    open ? "transform rotate-180" : ""
                                  }`}
                                />
                              </div>
                            </Disclosure.Button>

                            <Disclosure.Panel className="px-4 pb-3 pt-1 bg-white">
                              <div className="space-y-2">
                                {foodGroup.variants.map(
                                  (variant, variantIndex) => (
                                    <label
                                      key={variantIndex}
                                      className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
                                        selectedVariations[foodIndex] ===
                                        variantIndex
                                          ? "bg-blue-50 border-blue-300"
                                          : "hover:bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`food-${foodIndex}`}
                                        value={variantIndex}
                                        checked={
                                          selectedVariations[foodIndex] ===
                                          variantIndex
                                        }
                                        onChange={() =>
                                          handleVariationSelect(
                                            foodIndex,
                                            variantIndex
                                          )
                                        }
                                        className="w-4 h-4 text-blue-500"
                                      />
                                      <span className="flex-1 capitalize">
                                        {variant.name}
                                      </span>
                                      <span className="text-sm font-semibold text-gray-600">
                                        {variant.calories} cal
                                      </span>
                                    </label>
                                  )
                                )}
                              </div>
                            </Disclosure.Panel>
                          </div>
                        )}
                      </Disclosure>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleBackStep}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={
                      Object.keys(selectedVariations).length !==
                      detectedFoods.length
                    }
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Review
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Summary with Expandable Nutrition Stats */}
            {modalStep === 3 && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4">
                  Meal Summary
                </Dialog.Title>

                {/* Selected Items List */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-700 mb-3">
                    Selected Items:
                  </p>
                  <div className="space-y-2">
                    {Object.entries(selectedVariations).map(
                      ([foodIndex, variantIndex]) => {
                        const variant =
                          foodVariations[foodIndex].variants[variantIndex];

                        return (
                          <div
                            key={foodIndex}
                            className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-200"
                          >
                            <div>
                              <p className="font-medium text-gray-800">
                                {variant.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {variant.category}
                              </p>
                            </div>
                            <span className="text-lg font-bold text-blue-600">
                              {variant.calories} cal
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Nutrition Impact - Expandable */}
                {userData && (
                  <Disclosure>
                    {({ open }) => (
                      <div className="border border-gray-200 rounded-lg mb-4">
                        <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors rounded-t-lg">
                          <span className="font-bold text-gray-800">
                            📊 Nutrition Impact
                          </span>
                          <ChevronRightIcon
                            className={`w-5 h-5 text-gray-600 transition-transform ${
                              open ? "transform rotate-90" : ""
                            }`}
                          />
                        </Disclosure.Button>

                        <Disclosure.Panel className="px-4 py-4 bg-white rounded-b-lg">
                          {(() => {
                            const totals = calculateTotals();
                            return (
                              <div className="space-y-4">
                                <NutritionBar
                                  label="Calories"
                                  current={userData?.todayIntake?.calorie || 0}
                                  adding={totals.calories}
                                  goal={userData?.goal?.calorie || 2000}
                                  unit="kcal"
                                />
                                <NutritionBar
                                  label="Protein"
                                  current={userData?.todayIntake?.protein || 0}
                                  adding={totals.protein}
                                  goal={userData?.goal?.protein || 50}
                                  unit="g"
                                />
                                <NutritionBar
                                  label="Carbs"
                                  current={userData?.todayIntake?.carbs || 0}
                                  adding={totals.carbs}
                                  goal={userData?.goal?.carbs || 300}
                                  unit="g"
                                />
                                <NutritionBar
                                  label="Sodium"
                                  current={userData?.todayIntake?.sodium || 0}
                                  adding={totals.sodium}
                                  goal={userData?.goal?.sodium || 2300}
                                  unit="mg"
                                />
                              </div>
                            );
                          })()}
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>
                )}

                {/* Quick Summary Card */}
                <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 mb-6 shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl opacity-90">Total Adding: </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">
                        {calculateTotals().calories} calories
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBackStep}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  >
                    Log Meal
                  </button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

export default QuickRecord;
