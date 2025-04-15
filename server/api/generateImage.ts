import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ImageGenerationRequest {
  prompt: string;
  type: "final" | "step";
}

export async function generateImage({ prompt, type }: ImageGenerationRequest): Promise<string> {
  let enhancedPrompt = prompt;

  if (type === "final") {
    enhancedPrompt = `Generate a digital illustration of ${prompt} in a cute, hand-crafted style with warm pastel tones. Include crochet and wool textures to emphasize it's a crocheted item.`;
  } else {
    enhancedPrompt = `Generate an image illustrating: '${prompt}' in a diagrammatic, cute style. Make it clear and instructional for crochet pattern steps.`;
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url || "";
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image with AI");
  }
}
