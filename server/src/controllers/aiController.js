import { transcribe } from "../services/sttService.js";
import { detectFoods } from "../services/nlpService.js";
import { analyzeWithGPT4o, checkForAllergens } from "../services/openaiService.js";
import { getFoodByFoodList, getUserDailyIntakeWithGoalByUserId } from "../models/foodModel.js";
import { getUserCompleteContext } from "../models/userModel.js";
import { summarizeConversation } from "../services/conversationSummaryService.js";
import { needsSummarization } from "../utils/tokenCounter.js";

import multer from "multer";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({
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


// --------------------------------------------------
export const processMultimodalRequest = async (req, res) => {
  try {
    const { transcript, image, conversationHistory = [] } = req.body;

    // For now, hardcode userId = 1 (you can get this from auth middleware later)
    const userId = 1;

    // Validate transcript
    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: "Transcript is required",
      });
    }

    console.log(`\n📥 Processing request for user ${userId}`);
    console.log(`Transcript: "${transcript}"`);
    console.log(`Image: ${image ? "Yes" : "No"}`);
    console.log(`History length: ${conversationHistory.length} messages`);

    // ===== VALIDATION: Check if image is required but missing =====
    const imageRequiredKeywords = [
      "this picture",
      "this photo",
      "this image",
      "the picture",
      "the photo",
      "use this",
      "from this",
      "in this picture",
      "what i'm eating",
      "what i ate",
      "detect",
      "ingredients",
      "log this",
      "track this",
    ];

    const needsImage = imageRequiredKeywords.some((keyword) =>
      transcript.toLowerCase().includes(keyword)
    );

    if (needsImage && !image) {
      console.log("⚠️ User mentioned image keywords but no image provided");
      return res.status(200).json({
        success: true,
        intent: "NEEDS_IMAGE",
        message:
          "I'd be happy to help! Please capture an image first by clicking the Capture button, then tell me what you'd like me to do with it.",
      });
    }

    // ===== TOKEN MANAGEMENT: Check if summarization needed =====
    let processedHistory = conversationHistory;
    const tokenCheck = needsSummarization(conversationHistory, 8000);

    if (tokenCheck.needs) {
      console.log(
        `⚠️ Conversation exceeds token limit (${tokenCheck.currentTokens} tokens)`
      );
      console.log("📝 Summarizing conversation...");
      processedHistory = await summarizeConversation(conversationHistory, 20);
      console.log(
        `✅ Summarized to ${processedHistory.length} messages (from ${conversationHistory.length})`
      );
    }

    // ===== GET USER CONTEXT =====
    console.log("📊 Fetching user context...");
    const userContext = await getUserCompleteContext(userId);

    // Get today's intake
    const todayIntake = await getUserDailyIntakeWithGoalByUserId(userId);

    console.log(`User: ${userContext.profile.name}`);
    console.log(`Allergies: ${userContext.allergies.join(", ") || "None"}`);

    // ===== CALL OPENAI FOR INTENT AND ANALYSIS =====
    console.log("🤖 Calling OpenAI GPT-4o...");
    const openAIResponse = await analyzeWithGPT4o(
      transcript,
      image,
      userContext,
      todayIntake,
      processedHistory
    );

    // ===== HANDLE DIFFERENT INTENTS =====

    // Intent: FOOD_LOGGING
    if (openAIResponse.intent === "FOOD_LOGGING") {
      console.log("🍽️ Intent: FOOD_LOGGING");
      console.log(
        `Detected foods: ${openAIResponse.detectedFoods?.join(", ")}`
      );

      if (!openAIResponse.detectedFoods || openAIResponse.detectedFoods.length === 0) {
        return res.status(200).json({
          success: true,
          intent: "FOOD_LOGGING",
          message: "I couldn't detect any specific foods in the image. Could you describe what you're eating?",
        });
      }

      // Check for allergens
      const allergenWarnings = checkForAllergens(
        openAIResponse.detectedFoods,
        userContext.allergies
      );

      if (allergenWarnings.length > 0) {
        console.log("⚠️ ALLERGEN WARNING:", allergenWarnings);
        return res.status(200).json({
          success: true,
          intent: "ALLERGEN_WARNING",
          message: `⚠️ WARNING: I detected foods that may contain your allergens!\n\n${allergenWarnings.map((w) => w.warning).join("\n")}\n\nPlease verify before consuming!`,
          warnings: allergenWarnings,
        });
      }

      // Query database for food variants
      const foodCaloryMappingList = [];

      for (const foodName of openAIResponse.detectedFoods) {
        try {
          const variants = await getFoodByFoodList(foodName);

          if (variants && variants.length > 0) {
            foodCaloryMappingList.push({
              foodName,
              variants: variants.map((item) => ({
                food_id: item.food_id,
                name: item.food_name,
                category: item.category,
                calories: item.calories,
                protein: item.protein_g,
                carbs: item.carbs_g,
                fat: item.fat_g,
                fiber: item.fiber_g,
                sugars: item.sugars_g,
                sodium: item.sodium_mg,
                cholesterol: item.cholesterol_mg,
              })),
            });
          } else {
            console.log(`⚠️ No variants found for: ${foodName}`);
          }
        } catch (error) {
          console.error(`Error fetching variants for ${foodName}:`, error);
        }
      }

      if (foodCaloryMappingList.length === 0) {
        return res.status(200).json({
          success: true,
          intent: "FOOD_LOGGING",
          message: "I detected some foods but couldn't find them in the database. Could you be more specific about what you're eating?",
        });
      }

      // Return food logging data
      return res.status(200).json({
        success: true,
        intent: "FOOD_LOGGING",
        message: openAIResponse.message,
        foodCaloryMappingList,
        userData: {
          userName: userContext.profile.name,
          userId: userContext.profile.user_id,
          goal: {
            calorie: userContext.profile.calorie_goal,
            sodium: userContext.profile.sodium_goal,
            carbs: userContext.profile.carbs_goal,
            protein: userContext.profile.protein_goal,
            fat: userContext.profile.fat_goal,
          },
          todayIntake: {
            calorie: todayIntake?.calories_intake || 0,
            sodium: todayIntake?.sodium_intake || 0,
            carbs: todayIntake?.carbs_intake || 0,
            protein: todayIntake?.protein_intake || 0,
            fat: todayIntake?.fat_intake || 0,
          },
        },
        conversationSummarized: tokenCheck.needs,
      });
    }

    // Intent: VIDEO_SEARCH
    if (openAIResponse.intent === "VIDEO_SEARCH") {
      console.log("🎥 Intent: VIDEO_SEARCH");
      return res.status(200).json({
        success: true,
        intent: "VIDEO_SEARCH",
        message: openAIResponse.message,
        links: openAIResponse.links || [],
        conversationSummarized: tokenCheck.needs,
      });
    }

    // Intent: RECIPE_MODE
    if (openAIResponse.intent === "RECIPE_MODE") {
      console.log("👨‍🍳 Intent: RECIPE_MODE");
      return res.status(200).json({
        success: true,
        intent: "RECIPE_MODE",
        message: openAIResponse.message,
        ingredients: openAIResponse.ingredients || [],
        recipes: openAIResponse.recipes || [],
        conversationSummarized: tokenCheck.needs,
      });
    }

    // Intent: NEEDS_IMAGE
    if (openAIResponse.intent === "NEEDS_IMAGE") {
      console.log("📷 Intent: NEEDS_IMAGE");
      return res.status(200).json({
        success: true,
        intent: "NEEDS_IMAGE",
        message: openAIResponse.message,
        conversationSummarized: tokenCheck.needs,
      });
    }

    // Intent: GENERAL (default)
    console.log("💬 Intent: GENERAL");
    return res.status(200).json({
      success: true,
      intent: "GENERAL",
      message: openAIResponse.message,
      text: openAIResponse.message,
      conversationSummarized: tokenCheck.needs,
    });
  } catch (error) {
    console.error("❌ Error in processMultimodalRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: error.message,
    });
  }
};

