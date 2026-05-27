const CONFUSION_KEYWORDS = [
  "who are you", "where am i", "i'm scared", "i am scared", "i'm lost",
  "i am lost", "i don't know", "i dont know", "i don't understand",
  "i dont understand", "help me", "i'm confused", "i am confused",
  "where is", "what is happening", "i'm afraid", "i am afraid",
  "i want to go home", "who is this", "leave me alone", "go away",
  "i don't remember", "i cant remember", "i can't remember",
  "i feel sick", "something is wrong", "i'm not okay", "i am not okay",
  "i'm frightened", "i am frightened", "stop", "no no no",
];

const NEGATIVE_EMOTIONS = [
  "scared", "lost", "confused", "afraid", "frightened", "worried",
  "upset", "sad", "angry", "hurt", "sick", "terrible", "awful",
  "bad", "wrong", "help", "pain", "hurt",
];

function analyzeDistress(message, conversationHistory = []) {
  const msg = message.toLowerCase().trim();
  let score = 0;
  const triggers = [];

  // 1. Short response (< 3 words)
  const wordCount = msg.split(/\s+/).filter(Boolean).length;
  if (wordCount < 3) {
    score += 2;
    triggers.push("short_response");
  }

  // 2. Confusion keywords
  const hasConfusionKeyword = CONFUSION_KEYWORDS.some((kw) => msg.includes(kw));
  if (hasConfusionKeyword) {
    score += 4;
    triggers.push("confusion_keyword");
  }

  // 3. Negative emotion words
  const negativeCount = NEGATIVE_EMOTIONS.filter((e) => msg.includes(e)).length;
  if (negativeCount >= 2) {
    score += 3;
    triggers.push("negative_emotion");
  } else if (negativeCount === 1) {
    score += 1;
  }

  // 4. Repeated question (same message in last 3)
  const recentMessages = conversationHistory
    .filter((m) => m.role === "patient")
    .slice(-3)
    .map((m) => m.content.toLowerCase().trim());

  const isRepeated = recentMessages.includes(msg);
  if (isRepeated) {
    score += 3;
    triggers.push("repeated_question");
  }

  // 5. Question marks suggesting confusion
  if ((msg.match(/\?/g) || []).length >= 2) {
    score += 1;
  }

  return {
    score: Math.min(score, 10),
    isDistressed: score >= 5,
    triggers,
  };
}

module.exports = { analyzeDistress };
