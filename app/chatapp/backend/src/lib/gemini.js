import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./env.js";

let genAI;
let model;

// Initialize Gemini AI
export const initializeGemini = () => {
    try {
        if (!ENV.GEMINI_API_KEY) {
            console.warn("QuackAI not found");
            return false;
        }

        genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        console.log("QuackAI initialized");
        return true;
    } catch (error) {
        console.error("Error initializing QuackAI:", error);
        return false;
    }
};

// Generate AI response
export const generateAIResponse = async (userMessage, conversationHistory = []) => {
    try {
        if (!model) {
            return "I'm currently unavailable!";
        }

        // Build conversation context
        let prompt = `You are QuackAI, a friendly and helpful AI assistant in a chat application called QuackChat. 
Use emojis frequently to make responses more expressive and fun! Use duck emojis 🦆, sparkles ✨, hearts ❤️, and other relevant emojis.
User message: ${userMessage}`;

        // Add conversation context if available
        // if (conversationHistory.length > 0) {
        //     prompt += `\n\nRecent conversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n')}`;
        // }

        const result = await model.generateContent(prompt);
        const text = await result.response.text();

        return text ? text : "Quack! I'm thinking... ";
    } catch (error) {
        console.error("Error generating AI response:", error);

        // Fallback responses on error
        const fallbackResponses = [
            "Quack! Sorry, I'm having trouble thinking right now. Can you try again?",
            "My AI brain is a bit overloaded at the moment. Please try again in a moment!",
            "Oops! Something went wrong on my end. Let's try that again!"
        ];

        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
};
