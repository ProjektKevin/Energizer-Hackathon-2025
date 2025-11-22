// Conversation memory and token management configuration

export const CONVERSATION_CONFIG = {
  // Token management
  MAX_CONTEXT_TOKENS: 8000, // Trigger summarization after this
  KEEP_RECENT_MESSAGES: 20, // Always keep last N messages
  
  // Summarization settings
  ENABLE_AUTO_SUMMARY: true,
  SUMMARY_MODEL: "gpt-4o-mini", // Cheaper model for summaries
  SUMMARY_MAX_TOKENS: 500,
  
  // History limits
  MAX_HISTORY_LENGTH: 200, // Hard cap on message count
  
  // Image handling in conversation history
  INCLUDE_IMAGES_IN_HISTORY: false, // Don't send old images to save tokens
  CURRENT_IMAGE_ONLY: true,
  
  // API settings
  OPENAI_MODEL: "gpt-4o",
  MAX_RESPONSE_TOKENS: 1000,
};

export default CONVERSATION_CONFIG;