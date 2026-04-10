import { generateAIResponse } from "../lib/gemini.js";
import { getQuackAI } from "../lib/seed.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";

//Process AI message - called when user sends message to QuackAI
export const processAIMessage = async (userMessage, senderId) => {
    try {
        const quackAI = await getQuackAI();
        if (!quackAI) {
            console.error("QuackAI user not found");
            return;
        }

        // Get recent conversation history for context (last 5 messages)
        const recentMessages = await Message.find({
            $or: [
                { senderId: senderId, receiverId: quackAI._id },
                { senderId: quackAI._id, receiverId: senderId },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Format conversation history for AI
        const conversationHistory = recentMessages.reverse().map((msg) => ({
            role: msg.senderId.toString() === quackAI._id.toString() ? "ai" : "user",
            text: msg.text + (msg.image ? " User sent an image with url: " + msg.image : ""),
        }));

        // Generate AI response
        const aiResponseText = await generateAIResponse(
            userMessage.text + (userMessage.image ? " User sent an image with url: " + userMessage.image : ""),
            conversationHistory,
        );

        // Create and save AI response message
        const aiMessage = new Message({
            senderId: quackAI._id,
            receiverId: senderId,
            text: aiResponseText,
        });

        await aiMessage.save();

        // Send AI response to user via socket
        const userSocketIds = getReceiverSocketId(senderId);
        if (userSocketIds) {
            userSocketIds.forEach((socketId) => {
                io.to(socketId).emit("newMessage", aiMessage);
            });
        }

        return aiMessage;
    } catch (error) {
        console.error("Error processing AI message:", error);
    }
};
