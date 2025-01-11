import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_ENDPOINT
});

export async function getSongSuggestions(mood, count = 5) {
  console.log("Prompting AI");

  try {
    const response = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a music expert who suggests songs based on moods. Always respond with valid JSON arrays containing song objects with 'title' and 'artist' properties."
        },
        { 
          role: "user", 
          content: `Suggest ${count} songs that match the mood: ${mood}`
        }
      ],
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.7,
      max_tokens: 10000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log("AI response received:", content);

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.songs)) {
        return parsed.songs;
      }
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Invalid response format from AI service");
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get song suggestions from AI");
  }
}