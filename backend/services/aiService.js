// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const STAGE_PROMPTS = {
//   mild: `Use short, clear sentences (under 15 words). You may ask one simple question at a time. Be warm and encouraging.`,
//   moderate: `Use very simple sentences (under 8 words). Only ask yes/no questions. Repeat information calmly if needed. Be patient and reassuring.`,
//   severe: `Give only one simple instruction or statement at a time. Be extremely warm and reassuring. Never ask questions. Focus on comfort and safety.`,
// };

// function buildSystemPrompt(patient, storedFacts = []) {
//   const familyList =
//     patient.familyMembers?.map((f) => `${f.name} (${f.relation})`).join(", ") || "no family members listed";

//   const facts =
//     storedFacts.length > 0
//       ? `\nThings you know about ${patient.name} from past conversations:\n${storedFacts.slice(-10).map((f) => `- ${f.fact}`).join("\n")}`
//       : "";

//   return `You are a compassionate, patient AI companion for ${patient.name}, who is ${patient.age} years old and has Alzheimer's disease at the ${patient.cognitiveStage} stage.

// Their family members are: ${familyList}.

// Tone: ${patient.aiTone || "warm"}
// Communication rules: ${STAGE_PROMPTS[patient.cognitiveStage] || STAGE_PROMPTS.mild}

// IMPORTANT RULES:
// - Never express frustration or impatience
// - If the patient seems confused, gently redirect with comfort
// - Keep responses SHORT and simple
// - Never give complex instructions
// - If asked who you are, say you are their friendly AI companion
// - Refer to family members by name when relevant
// - Always end with something warm and comforting if the patient seems anxious
// ${facts}

// Remember: You are talking to someone who needs patience, warmth, and simplicity.`;
// }

// async function getAIResponse(patient, conversationHistory, userMessage, isDistressed = false) {
//   try {
//     let systemPrompt = buildSystemPrompt(patient, patient.storedFacts);
//     if (isDistressed) {
//       systemPrompt += `\n\nIMPORTANT: The patient seems distressed or confused right now. Be extra gentle, reassuring, and calm. Say something like "I'm here with you. You are safe."`;
//     }

//     // Convert conversation history to Gemini format
//     const contents = conversationHistory
//       .slice(-6) // last 3 exchanges
//       .map((msg) => ({
//         role: msg.role === "patient" ? "user" : "model",
//         parts: [{ text: msg.content }],
//       }));

//     // Add the current user message
//     contents.push({
//       role: "user",
//       parts: [{ text: userMessage }],
//     });

//     const model = genAI.getGenerativeModel({
//       model: "gemini-2.5-flash",
//       systemInstruction: systemPrompt,
//     });

//     const result = await model.generateContent({ contents });
//     const response = await result.response;
//     console.log("this is the gemini response");
//     console.log(response.text());
//     return response.text().trim();
//   } catch (err) {
//     console.error("Gemini API error:", err);
//     return "I'm here with you. How are you feeling right now?";
//   }
// }

// async function extractFacts(patientName, conversationHistory) {
//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     const conversationText = conversationHistory
//       .map((m) => `${m.role}: ${m.content}`)
//       .join("\n");

//     const prompt = `From this conversation with an Alzheimer's patient named ${patientName}, extract any meaningful personal facts (preferences, family mentions, feelings, activities, memories). Return ONLY a JSON array of strings. Example: ["Patient likes tea", "Patient mentioned daughter visited"]. If no meaningful facts, return [].

// Conversation:
// ${conversationText}

// JSON array:`;

//     const result = await model.generateContent(prompt);
//     const text = result.response.text().trim();
//     const clean = text.replace(/```json|```/g, "").trim();
//     return JSON.parse(clean);
//   } catch (err) {
//     console.error("Extract facts error:", err);
//     return [];
//   }
// }

// module.exports = { getAIResponse, extractFacts };
const { CohereClient } = require("cohere-ai");

// Initialize Cohere with your API Key
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const STAGE_PROMPTS = {
  mild: `Use short, clear sentences (under 15 words). You may ask one simple question at a time. Be warm and encouraging.`,
  moderate: `Use very simple sentences (under 8 words). Only ask yes/no questions. Repeat information calmly if needed. Be patient and reassuring.`,
  severe: `Give only one simple instruction or statement at a time. Be extremely warm and reassuring. Never ask questions. Focus on comfort and safety.`,
};

/**
 * Builds the system prompt using your original logic and rules.
 */
function buildSystemPrompt(patient, storedFacts = []) {
  const familyList =
    patient.familyMembers?.map((f) => `${f.name} (${f.relation})`).join(", ") ||
    "no family members listed";

  const facts =
    storedFacts.length > 0
      ? `\nThings you know about ${patient.name} from past conversations:\n${storedFacts
          .slice(-10)
          .map((f) => `- ${f.fact}`)
          .join("\n")}`
      : "";

  return `You are a compassionate, patient AI companion for ${patient.name}, who is ${patient.age} years old and has Alzheimer's disease at the ${patient.cognitiveStage} stage.

Their family members are: ${familyList}.

Tone: ${patient.aiTone || "warm"}
Communication rules: ${STAGE_PROMPTS[patient.cognitiveStage] || STAGE_PROMPTS.mild}

IMPORTANT RULES:
- Never express frustration or impatience
- If the patient seems confused, gently redirect with comfort
- Keep responses SHORT and simple
- Never give complex instructions
- If asked who you are, say you are their friendly AI companion
- Refer to family members by name when relevant
- Always end with something warm and comforting if the patient seems anxious
${facts}

Remember: You are talking to someone who needs patience, warmth, and simplicity.`;
}

/**
 * Generates a chat response using Cohere's command-r-plus model.
 */
async function getAIResponse(
  patient,
  conversationHistory,
  userMessage,
  isDistressed = false,
) {
  try {
    let systemPrompt = buildSystemPrompt(patient, patient.storedFacts);
    if (isDistressed) {
      systemPrompt += `\n\nIMPORTANT: The patient seems distressed or confused right now. Be extra gentle, reassuring, and calm. Say something like "I'm here with you. You are safe."`;
    }

    // Convert conversation history to Cohere format
    const chatHistory = conversationHistory.slice(-6).map((msg) => ({
      role: msg.role === "patient" ? "USER" : "CHATBOT",
      message: msg.content,
    }));

    const response = await cohere.chat({
      model: "command-r-plus-08-2024", // Specific version to avoid 404
      message: userMessage,
      preamble: systemPrompt,
      chatHistory: chatHistory,
    });

    console.log("Cohere response received:");
    console.log(response.text);

    return response.text.trim();
  } catch (err) {
    console.error("Cohere AI error:", err);
    // Your original fallback message
    return "I'm here with you. How are you feeling right now?";
  }
}

/**
 * Extracts facts from the conversation using your original extraction prompt.
 */
async function extractFacts(patientName, conversationHistory) {
  try {
    const conversationText = conversationHistory
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `From this conversation with an Alzheimer's patient named ${patientName}, extract any meaningful personal facts (preferences, family mentions, feelings, activities, memories). Return ONLY a JSON array of strings. Example: ["Patient likes tea", "Patient mentioned daughter visited"]. If no meaningful facts, return [].

Conversation:
${conversationText}

JSON array:`;

    const response = await cohere.chat({
      model: "command-r-08-2024", // Using command-r for faster extraction
      message: prompt,
    });

    const text = response.text.trim();

    // Clean JSON: Cohere sometimes adds markdown blocks like ```json
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (err) {
    console.error("Extract facts error:", err);
    return [];
  }
}

module.exports = { getAIResponse, extractFacts };
