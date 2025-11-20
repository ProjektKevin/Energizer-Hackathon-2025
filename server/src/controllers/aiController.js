import { transcribe } from "../services/sttService.js";
import multer from "multer";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Controller to handle speech to text
export const speechToText = async (req, res, next) => {
  try {
    // Check if audio file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided",
      });
    }

    // Get the audio file buffer from multer
    const audioBuffer = req.file.buffer;

    // Call the transcribe service
    const transcriptResult = await transcribe(audioBuffer);

    // Extract the transcript text
    const transcriptText = transcriptResult.text;
    console.log('TRANSCRIPT: ' + transcriptText);

    // Check if this is for food detection
    if (req.path.includes("quickRecordSTT")) {
      res.locals.transcriptText = transcriptText;

      next();
      return;
    } else {
      // Return the response
      return res.status(200).json({
        success: true,
        transcript: transcriptText,
      });
    }
  } catch (error) {
    console.error("Error in speechToText controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process audio",
      error: error.message,
    });
  }
};

export const detectFoodAndCalory = async (req, res) => {
  try {
    const transcriptText = res.locals.transcriptText;
    // let detectedFoodList = [];
    // let foodCaloryMappingList = [];

    // Extract all the detected food

    // Extract all the calory for each detected food using the dataset

    // send back the data to the front end
    let detectedFoodList = ["Apple", "Banana"];
    let foodCaloryMappingList = [
      {
        apple1: 15,
        apple2: 30,
        apple3: 40,
      },
      {
        banana1: 20,
        banana2: 10
      }
    ];

    /* 
    [
      {food1: calory1, food2: calory2}
      {food1}
    ]
    [detected_food_1, detected_food_2]
    */
    res.status(200).json({
      success: true,
      detectedFoodList,
      foodCaloryMappingList
    });
  } catch (error) {
    console.error("Error in speechToText controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process audio",
      error: error.message,
    });
  }
};

// ----- Helper Function -----
const parseFoods = (transcript) => {
  // Simple keyword detection (you can replace this with AI/NLP later)
  const foodKeywords = [
    "chicken rice",
    "nasi lemak",
    "roti prata",
    "laksa",
    "char kway teow",
    "apple",
    "banana",
    "orange",
    "rice",
    "chicken",
    "fish",
    "egg",
    "bread",
    "noodles",
    "pasta",
    "burger",
    "pizza",
    "sandwich",
  ];

  const detectedFoods = [];
  const lowerTranscript = transcript.toLowerCase();

  foodKeywords.forEach((food) => {
    if (lowerTranscript.includes(food)) {
      detectedFoods.push(food);
    }
  });

  return detectedFoods;
};

// Export upload middleware for use in routes
export { upload };
