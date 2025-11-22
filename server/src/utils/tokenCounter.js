// Token counting and estimation utilities

/**
 * Rough token estimation (4 characters ≈ 1 token)
 * This is a simple heuristic, not exact but good enough for our purposes
 */
export const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Count total tokens in conversation history
 * Includes both text content and image tokens
 */
export const countConversationTokens = (messages) => {
  let total = 0;
  
  for (const msg of messages) {
    // Count text tokens
    if (msg.content) {
      total += estimateTokens(msg.content);
    }
    
    // Images add significant tokens
    if (msg.image) {
      total += 1000; // Base64 images ≈ 1000 tokens (rough estimate)
    }
    
    // System messages (summaries) tend to be longer
    if (msg.role === "system" && msg.isSummary) {
      total += estimateTokens(msg.content);
    }
  }
  
  return total;
};

/**
 * Check if conversation needs summarization
 * Returns object with needs flag and token counts
 */
export const needsSummarization = (messages, maxTokens = 8000) => {
  const totalTokens = countConversationTokens(messages);
  
  return {
    needs: totalTokens > maxTokens,
    currentTokens: totalTokens,
    maxTokens,
    percentUsed: Math.round((totalTokens / maxTokens) * 100)
  };
};

/**
 * Calculate cost estimate for a conversation
 * Based on GPT-4o pricing
 */
export const estimateCost = (inputTokens, outputTokens = 500) => {
  const INPUT_COST_PER_1M = 2.50; // $2.50 per 1M input tokens
  const OUTPUT_COST_PER_1M = 10.00; // $10 per 1M output tokens
  
  const inputCost = (inputTokens / 1000000) * INPUT_COST_PER_1M;
  const outputCost = (outputTokens / 1000000) * OUTPUT_COST_PER_1M;
  
  return {
    inputCost: inputCost.toFixed(4),
    outputCost: outputCost.toFixed(4),
    totalCost: (inputCost + outputCost).toFixed(4)
  };
};