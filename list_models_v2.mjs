import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Gemini 1.5 Flash accessed successfully via direct SDK");

        // Actually list them
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
        const data = await response.json();
        console.log("Available Models:", data.models?.map(m => m.name).join(', '));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

listModels();
