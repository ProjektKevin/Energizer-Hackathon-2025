import OpenAI from "openai";
import { CONVERSATION_CONFIG } from "../config/conversationConfig.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build system prompt with user context
 */
const buildSystemPrompt = (userContext, todayIntake) => {
  const { profile, allergies, preferences, conditions } = userContext;

  return `You are a personalized nutrition assistant for ${profile.name}.

USER PROFILE:
- Age: ${profile.age} years old
- Gender: ${profile.gender}
- Height: ${profile.height_cm} cm
- Current Weight: ${profile.weight_kg} kg
- Weight Goal: ${profile.weight_goal} kg

DAILY NUTRITIONAL GOALS:
- Calories: ${profile.calorie_goal} kcal
- Protein: ${profile.protein_goal}g
- Carbs: ${profile.carbs_goal}g
- Fat: ${profile.fat_goal}g
- Sugar: ${profile.sugar_goal}g
- Sodium: ${profile.sodium_goal}mg

TODAY'S INTAKE SO FAR:
- Calories: ${todayIntake?.calories || 0} / ${profile.calorie_goal} kcal (${Math.round(((todayIntake?.calories || 0) / profile.calorie_goal) * 100)}%)
- Protein: ${todayIntake?.protein || 0}g / ${profile.protein_goal}g
- Carbs: ${todayIntake?.carbs || 0}g / ${profile.carbs_goal}g
- Fat: ${todayIntake?.fat || 0}g / ${profile.fat_goal}g

${allergies.length > 0 ? `⚠️ ALLERGIES: ${allergies.join(", ")}` : "ALLERGIES: None"}
${preferences.length > 0 ? `DIETARY PREFERENCES: ${preferences.join(", ")}` : "DIETARY PREFERENCES: None specified"}
${conditions.length > 0 ? `HEALTH CONDITIONS: ${conditions.join(", ")}` : "HEALTH CONDITIONS: None"}

YOUR RESPONSIBILITIES:
1. Classify user intent from their message
2. For food-related requests with images, detect ONLY the food names (not nutrition values)
3. Consider user's allergies, conditions, and preferences in your responses
4. Provide personalized advice based on their goals and current intake
5. NEVER suggest foods containing user's allergens

INTENT CLASSIFICATION:
- FOOD_LOGGING: User wants to track/log their meal (requires image)
- RECIPE_MODE: User wants recipes from ingredients (requires image)
- VIDEO_SEARCH: User asks for video links/tutorials (no image needed)
- GENERAL: General questions or conversation (no image needed)
- NEEDS_IMAGE: User mentions "picture/photo" but no image provided

RESPONSE FORMAT:
Always respond with valid JSON in this structure:
{
  "intent": "FOOD_LOGGING" | "RECIPE_MODE" | "VIDEO_SEARCH" | "GENERAL" | "NEEDS_IMAGE",
  "message": "Your conversational response to the user",
  "detectedFoods": ["food1", "food2"] // Only for FOOD_LOGGING intent
  "ingredients": ["ingredient1", "ingredient2"] // Only for RECIPE_MODE
  "recipes": [{name, description}] // Only for RECIPE_MODE
  "links": [{title, url}] // Only for VIDEO_SEARCH
}

CRITICAL RULES:
- For FOOD_LOGGING: Return ONLY food names you see in the image, not nutrition calculations
- NEVER suggest allergen foods to ${profile.name}
- If allergies detected in food, warn the user immediately
- Be conversational and friendly, use ${profile.name}'s name occasionally
- Consider their current intake when giving advice`;
};

/**
 * Analyze user request with GPT-4o (multimodal)
 * 
 * @param {String} transcript - User's spoken text
 * @param {String} imageBase64 - Base64 encoded image (optional)
 * @param {Object} userContext - User profile, allergies, preferences, conditions
 * @param {Object} todayIntake - User's intake so far today
 * @param {Array} conversationHistory - Previous conversation messages
 * @returns {Object} - Structured JSON response with intent and data
 */
export const analyzeWithGPT4o = async (
  transcript,
  imageBase64,
  userContext,
  todayIntake,
  conversationHistory = []
) => {
  try {
    // Build system prompt with user context
    const systemPrompt = buildSystemPrompt(userContext, todayIntake);

    // Prepare messages array
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      // Add conversation history (without images to save tokens)
      ...conversationHistory
        .filter((msg) => !msg.isSummary) // Summaries already included in system
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      // Current user message
      {
        role: "user",
        content: imageBase64
          ? [
              { type: "text", text: transcript },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ]
          : transcript,
      },
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: CONVERSATION_CONFIG.OPENAI_MODEL,
      messages,
      response_format: { type: "json_object" },
      max_tokens: CONVERSATION_CONFIG.MAX_RESPONSE_TOKENS,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content);

    console.log("✅ OpenAI response:", result.intent);

    return result;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
};

/**
 * Check for allergens in detected foods
 */
export const checkForAllergens = (detectedFoods, userAllergies) => {
  const warnings = [];

  for (const food of detectedFoods) {
    for (const allergen of userAllergies) {
      if (food.toLowerCase().includes(allergen.toLowerCase())) {
        warnings.push({
          food,
          allergen,
          warning: `⚠️ ${food} may contain ${allergen}`,
        });
      }
    }
  }

  return warnings;
};

export default {
  analyzeWithGPT4o,
  checkForAllergens,
};