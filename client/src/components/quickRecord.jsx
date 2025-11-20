import { useState, useRef } from "react";
import { Dialog } from "@headlessui/react";

function QuickRecord() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [foods, setFoods] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // --- Start recording
  const startRecording = async () => {
    setTranscript("");
    setFoods([]);
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

  // --- Send audio to backend (placeholder for now)
  const detectFood = async (audioBlob) => {
    // Replace this with your AssemblyAI or backend endpoint
    // For now, we simulate detection
    const fakeTranscript = "I ate chicken rice and an apple";
    const fakeFoods = ["chicken rice", "apple"];

    setTranscript(fakeTranscript);
    setFoods(fakeFoods);
    setIsModalOpen(true);
    // setCalories();

    // Example for backend call:
    // const formData = new FormData();
    // formData.append("audio", audioBlob);
    // const res = await axios.post("/api/stt/speech", formData);
    // setTranscript(res.data.text);
    // setFoods([...parseFoodsFromTranscript(res.data.text)]);
  };

  return (
    <>
      <div className="flex flex-col items-center w-full max-w-md">
        <button
          onClick={handleRecordClick}
          className={`w-full bg-blue-500 text-white py-4 rounded-xl text-lg font-semibold ${
            recording ? "bg-red-500" : ""
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
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold mb-4">
              Detected Foods
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Transcript:</p>
                <p className="text-gray-700">{transcript}</p>
              </div>

              <div>
                <p className="font-semibold mb-2">Detected Foods:</p>
                <ul className="list-disc ml-6 text-gray-700">
                  {foods.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

export default QuickRecord;
