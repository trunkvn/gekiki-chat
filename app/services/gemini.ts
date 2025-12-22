import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initializing with process.env.API_KEY directly as per guidelines
    this.ai = new GoogleGenAI({
      apiKey: "AIzaSyDkveypj9vDnKDGjiOd1oeGG0vTQlovTYs",
    });
  }

  async *streamChat(history: Message[], userInput: string, modelId: string = "gemini-2.5-flash") {
    // Transform our history to Gemini format
    const contents = history.map((msg) => ({
      role: msg.role === Role.USER ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: userInput }],
    });

    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: modelId,
        contents: contents,
        config: {
          temperature: 0.6,
          topP: 0.9,
          topK: 40,
        },
      });
      console.log('responseStream', responseStream)

      for await (const chunk of responseStream) {
        console.log('chunk', chunk)
        const chunkResponse = chunk as GenerateContentResponse;
        // Accessing the .text property directly instead of calling it as a method
        yield chunkResponse.text || "";
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
