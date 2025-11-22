import OpenAI from "openai";
import { CONVERSATION_CONFIG } from "../config/conversationConfig.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Summarize older conversation messages while preserving key information
 * 
 * @param {Array} messages - Full conversation history
 * @param {Number} keepRecentCount - How many recent messages to keep unsummarized
 * @returns {Array} - Summarized history (summary + recent messages)
 */
export const summarizeConversation = async (messages, keepRecentCount = 20) => {
  try {
    // Split messages: older to summarize, recent to keep
    const messagesToSummarize = messages.slice(0, -keepRecentCount);
    const recentMessages = messages.slice(-keepRecentCount);

    // If nothing to summarize, return as-is
    if (messagesToSummarize.length === 0) {
      console.log("No messages to summarize, keeping all");
      return messages;
    }

    console.log(`Summarizing ${messagesToSummarize.length} older messages...`);

    // Convert messages to readable text
    const conversationText = messagesToSummarize
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");

    // Call OpenAI to create intelligent summary
    const summaryResponse = await openai.chat.completions.create({
      model: CONVERSATION_CONFIG.SUMMARY_MODEL,
      messages: [
        {
          role: "system",
          content: `You are summarizing a nutrition tracking conversation. 

CRITICAL: Preserve ALL of these details:
- Every food item logged or discussed
- All calorie and nutrition values mentioned
- User's dietary preferences, restrictions, or goals mentioned
- Any allergies or health conditions discussed
- Important questions the user asked
- Key advice or recommendations given

Create a concise but comprehensive summary. Format as bullet points for clarity.
Do NOT lose any factual information about foods, quantities, or nutrition data.`,
        },
        {
          role: "user",
          content: `Summarize this conversation:\n\n${conversationText}`,
        },
      ],
      max_tokens: CONVERSATION_CONFIG.SUMMARY_MAX_TOKENS,
    });

    const summary = summaryResponse.choices[0].message.content;

    console.log("✅ Conversation summarized successfully");

    // Return: [summary message] + recent messages
    return [
      {
        role: "system",
        content: `Previous conversation summary:\n${summary}`,
        isSummary: true,
        timestamp: new Date().toISOString(),
        summarizedCount: messagesToSummarize.length,
      },
      ...recentMessages,
    ];
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    // On error, just keep recent messages without summary
    return messages.slice(-keepRecentCount);
  }
};

/**
 * Check if a summary already exists in the conversation
 */
export const hasSummary = (messages) => {
  return messages.some((msg) => msg.isSummary === true);
};

/**
 * Get summary statistics
 */
export const getSummaryStats = (messages) => {
  const summaries = messages.filter((msg) => msg.isSummary === true);
  const regularMessages = messages.filter((msg) => !msg.isSummary);

  return {
    totalMessages: messages.length,
    summaryCount: summaries.length,
    regularMessageCount: regularMessages.length,
    hasSummary: summaries.length > 0,
  };
};

export default {
  summarizeConversation,
  hasSummary,
  getSummaryStats,
};