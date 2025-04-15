import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PatternInputData {
  prompt: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
}

export async function generatePattern(inputData: PatternInputData) {
  const { prompt, projectType, skillLevel, yarnType, size } = inputData;
  
  // Construct a detailed system prompt for generating crochet patterns
  const systemPrompt = `
    You are an expert crochet pattern designer with years of experience creating clear, detailed patterns.
    Generate a complete crochet pattern for a ${projectType} with a ${skillLevel} skill level.
    ${yarnType ? `The pattern should use ${yarnType} yarn.` : 'Please recommend appropriate yarn colors for this project and include them in the instructions.'}
    ${size ? `The finished item should be approximately ${size}.` : ''}
    
    Use standard crochet terms: SC (Single Crochet), MR (Magic Ring), INC (Increase), DEC (Decrease).
    Organize the pattern into logical sections (e.g., Head, Body, Arms, etc.) with clear, numbered steps.
    
    Return the response in JSON format with the following structure:
    {
      "title": "Name of the pattern",
      "sections": [
        {
          "name": "Section name (e.g., Head, Body, etc.)",
          "steps": [
            {
              "id": 1,
              "text": "Step instruction text"
            },
            ...more steps
          ]
        },
        ...more sections
      ]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating pattern:", error);
    throw new Error("Failed to generate pattern with AI");
  }
}
