import { useState, useRef } from "react";
import { Dialog, Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import api from "../api/axios";

function QuickRecord() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedFoods, setDetectedFoods] = useState([]); // ["Apple", "Banana"]
  const [foodVariations, setFoodVariations] = useState([]); // Array of variation objects
  const [selectedVariations, setSelectedVariations] = useState({}); // {0: "apple2", 1: "banana1"}
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Detected foods, 2: Select variations, 3: Summary
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // --- Start recording
  const startRecording = async () => {
    setTranscript("");
    setDetectedFoods([]);
    setFoodVariations([]);
    setSelectedVariations({});
    setModalStep(1);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await detectFood(blob);
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.start();
    setRecording(true);
  };

  // --- Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // --- Toggle recording
  const handleRecordClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // --- Send audio to backend
  const detectFood = async (audioBlob) => {
    try {
      // Create FormData to send audio file
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      console.log("Calling backend now!");
      // Make API call to backend
      const response = await api.post("/api/ai/quickRecordSTT", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update state with response data
      // Backend returns: { detectedFoodList: ["Apple", "Banana"], foodCaloryMappingList: [{apple1: 15, apple2: 30}, {banana1: 20}] }
      setDetectedFoods(response.data.detectedFoodList || []);
      setFoodVariations(response.data.foodCaloryMappingList || []);
      setModalStep(1);
      setIsModalOpen(true);

    } catch (error) {
      console.error("Error detecting food:", error);
      // Show error to user
      setDetectedFoods([]);
      setFoodVariations([]);
      setIsModalOpen(true);
    }
  };

  // --- Handle variation selection
  const handleVariationSelect = (foodIndex, variationKey) => {
    setSelectedVariations(prev => ({
      ...prev,
      [foodIndex]: variationKey
    }));
  };

  // --- Proceed to next step
  const handleNextStep = () => {
    setModalStep(modalStep + 1);
  };

  // --- Go back to previous step
  const handleBackStep = () => {
    setModalStep(modalStep - 1);
  };

  // --- Confirm and save selections
  const handleConfirm = async () => {
    // Prepare final data to save
    const finalSelections = detectedFoods.map((food, index) => {
      const selectedKey = selectedVariations[index];
      const calories = foodVariations[index]?.[selectedKey] || 0;
      return {
        foodName: food,
        variation: selectedKey,
        calories: calories
      };
    });

    console.log("Final selections:", finalSelections);
    
    try {
      // Send to backend to save the meal record
      const response = await api.post("/api/meals", { foods: finalSelections });
      console.log("response: " + response.message);
      
      // Close modal and reset
      setIsModalOpen(false);
      setSelectedVariations({});
    } catch (error) {
      console.error("Error saving meal:", error);
    }
  };

  // Calculate total calories
  const getTotalCalories = () => {
    return detectedFoods.reduce((total, food, index) => {
      const selectedKey = selectedVariations[index];
      const calories = foodVariations[index]?.[selectedKey] || 0;
      return total + calories;
    }, 0);
  };

  return (
    <>
      <div className="flex flex-col items-center w-full max-w-md">
        <button
          onClick={handleRecordClick}
          className={`w-full bg-blue-500 text-white py-4 rounded-xl text-lg font-semibold transition-colors ${
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
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Full-screen container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* Modal panel */}
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
                            <li key={i} className="capitalize">{food}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">No foods detected. Please try again.</p>
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

            {/* Step 2: Select specific variations with Accordions */}
            {modalStep === 2 && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4">
                  Select Specific Items
                </Dialog.Title>

                <p className="text-sm text-gray-600 mb-4">
                  Choose the specific variation for each food:
                </p>

                <div className="space-y-3">
                  {detectedFoods.map((food, foodIndex) => {
                    const isSelected = selectedVariations[foodIndex];
                    const selectedCalories = isSelected ? foodVariations[foodIndex]?.[isSelected] : null;
                    
                    return (
                      <Disclosure key={foodIndex} defaultOpen={foodIndex === 0}>
                        {({ open }) => (
                          <div className={`border rounded-lg overflow-hidden transition-all ${
                            isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          }`}>
                            <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold capitalize">{food}</span>
                                {isSelected && (
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                    ✓ Selected
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedCalories && (
                                  <span className="text-sm font-semibold text-green-600">
                                    {selectedCalories} cal
                                  </span>
                                )}
                                <ChevronDownIcon
                                  className={`w-5 h-5 text-gray-500 transition-transform ${
                                    open ? 'transform rotate-180' : ''
                                  }`}
                                />
                              </div>
                            </Disclosure.Button>
                            
                            <Disclosure.Panel className="px-4 pb-3 pt-1 bg-white">
                              <div className="space-y-2">
                                {foodVariations[foodIndex] && Object.entries(foodVariations[foodIndex]).map(([key, calories]) => (
                                  <label
                                    key={key}
                                    className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
                                      selectedVariations[foodIndex] === key
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'hover:bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`food-${foodIndex}`}
                                      value={key}
                                      checked={selectedVariations[foodIndex] === key}
                                      onChange={() => handleVariationSelect(foodIndex, key)}
                                      className="w-4 h-4 text-blue-500"
                                    />
                                    <span className="flex-1 capitalize">
                                      {key.replace(/(\d+)$/, ' $1')}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-600">
                                      {calories} cal
                                    </span>
                                  </label>
                                ))}
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
                    disabled={Object.keys(selectedVariations).length !== detectedFoods.length}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Review
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Summary */}
            {modalStep === 3 && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4">
                  Summary
                </Dialog.Title>

                <p className="text-sm text-gray-600 mb-4">
                  Review your meal before confirming:
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
                  {detectedFoods.map((food, index) => {
                    const selectedKey = selectedVariations[index];
                    const calories = foodVariations[index]?.[selectedKey] || 0;
                    
                    return (
                      <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-semibold capitalize">{food}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {selectedKey?.replace(/(\d+)$/, ' $1')}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-gray-700">
                          {calories} cal
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Total Calories */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-900">Total Calories</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {getTotalCalories()} cal
                    </span>
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
                    Confirm & Save
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