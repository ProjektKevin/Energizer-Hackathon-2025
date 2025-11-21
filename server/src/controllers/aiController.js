import { transcribe } from "../services/sttService.js";
import { detectFoods } from "../services/nlpService.js";
import { getFoodByFoodList, getUserDailyIntakeWithGoalByUserId } from "../models/foodModel.js";
import multer from "multer";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
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
    console.log("TRANSCRIPT: " + transcriptText);

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
    console.log("\n\nThis is what i hear: " + transcriptText);

    let foodCaloryMappingList = [];

    // Get foodlist
    const foodList = JSON.parse(fs.readFileSync("./src/data/food.json", "utf8"));

    // Extract all the detected food
    const detectedFoodList = detectFoods(transcriptText, foodList);
    console.log("Here are all the food that got detected: " + detectedFoodList);

    // Extract all the calory for each detected food using the dataset
    // Extract all the nutrition info for each detected food
    for (let i = 0; i < detectedFoodList.length; i++) {
      const response = await getFoodByFoodList(detectedFoodList[i]);

      foodCaloryMappingList.push({
        foodName: detectedFoodList[i],
        variants: response.map((item) => ({
          food_id: item.food_id,
          name: item.food_name,
          category: item.category,
          calories: item.calories,
          protein: item.protein_g,
          carbs: item.carbs_g,
          fiber: item.fiber_g,
          sugars: item.sugars_g,
          sodium: item.sodium_mg,
          cholesterol: item.cholesterol_mg,
        })),
      });
    }

    // Get today's calory and goals for the user
    const userStats = await getUserDailyIntakeWithGoalByUserId(1);
    if (!userStats) {
      return res.status(500).json({
        success: false,
        message: "No Data Found!",
        error: error.message,
      });
    }

    // send back the data to the front end
    // foodCaloryMappingList = [
    //   {
    //     foodName: "apple",
    //     variants: [
    //       {
    //         id: "apple1",
    //         name: "Small Apple",
    //         calories: 15,
    //         carbs: 4,
    //         fat: 0.1,
    //         protein: 0.3,
    //       },
    //       {
    //         id: "apple2",
    //         name: "Medium Apple",
    //         calories: 30,
    //         carbs: 8,
    //         fat: 0.2,
    //         protein: 0.6,
    //       },
    //     ],
    //   },
    //   {
    //     foodName: "banana",
    //     variants: [
    //       {
    //         id: "banana1",
    //         name: "Small Banana",
    //         calories: 20,
    //         carbs: 5,
    //         fat: 0.1,
    //         protein: 0.3,
    //       },
    //     ],
    //   },
    // ];

    res.status(200).json({
      success: true,
      foodCaloryMappingList,
      userData: {
        userName: userStats.name,
        userId: userStats.id,
        goal: {
          calorie: userStats.calorie_goal,
          sodium: userStats.sodium_goal,
          carbs: userStats.carbs_goal,
          protein: userStats.protein_goal,
          fat: userStats.fat_goal,
        },
        todayIntake: {
          calorie: userStats.calories_intake,
          sodium: userStats.sodium_intake,
          carbs: userStats.carbs_intake,
          protein: userStats.protein_intake,
          fat: userStats.fat_intake,
        }
      },
    });
  } catch (error) {
    console.error("Error in speechToText controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to Detect Food and Calory",
      error: error.message,
    });
  }
};

// Export upload middleware for use in routes
export { upload };
