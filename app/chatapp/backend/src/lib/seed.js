import User from "../models/User.js";
import { ENV } from "./env.js";

// "https://res.cloudinary.com/drgv8fstg/image/upload/v1771088414/duck_mae7mz.png"
const QUACK_AI_DATA = {
    email: ENV.QUACKAI_EMAIL,
    fullName: "QuackAI",
    profilePic:
        "https://res.cloudinary.com/drgv8fstg/image/upload/v1771162044/duck_mbds8d.png",
    isAI: true,
    password: ENV.QUACKAI_PASSWORD, // No password for AI user
};

export const seedQuackAI = async () => {
    try {
        // Check if QuackAI already exists
        const existingAI = await User.findOne({ email: QUACK_AI_DATA.email });

        if (existingAI) {
            console.log("QuackAI user already exists");
            return existingAI;
        }

        // Create QuackAI user
        const quackAI = new User(QUACK_AI_DATA);
        await quackAI.save();

        console.log("QuackAI user initialized successfully");
        return quackAI;
    } catch (error) {
        console.error("Error seeding QuackAI:", error);
        // Don't throw - allow server to continue even if seeding fails
    }
};

export const getQuackAI = async () => {
    try {
        const quackAI = await User.findOne({ email: QUACK_AI_DATA.email });
        return quackAI;
    } catch (error) {
        console.error("Error getting QuackAI:", error);
        return null;
    }
};
