import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ImageGenerationRequest {
  prompt: string;
  type: "final" | "step" | "part";
  projectType?: string;
  yarnType?: string;
  partName?: string;
}

export async function generateImage({ prompt, type, projectType, yarnType, partName }: ImageGenerationRequest): Promise<string> {
  let enhancedPrompt = prompt;

  if (type === "final") {
    // For final product images, create a more detailed prompt that emphasizes crochet aesthetic
    enhancedPrompt = `Generate a digital illustration of ${prompt} ${projectType ? `(a crocheted ${projectType})` : ""} 
      in a cute, hand-crafted style with warm pastel tones. 
      ${yarnType ? `Made with ${yarnType} wool. ` : ""} 
      Include visible crochet stitches and wool textures to clearly show this is a crocheted item. 
      Use a soft, warm lighting and neutral background to highlight the details of the crochet work.
      Make the image detailed enough to show the texture of the yarn.`;
  } else if (type === "part") {
    // For part images, create a focused view of just that part
    enhancedPrompt = `Generate a simplified illustration of the ${partName?.toLowerCase() || prompt} 
      part of a crocheted ${projectType || "item"}. 
      Focus only on this specific part, using a simple, clean style with a white or light background.
      Show the texture and stitches that make it recognizably crocheted.
      Make the image easy to understand at a small thumbnail size.`;
  } else {
    // For step images, create instructional, diagrammatic visuals
    enhancedPrompt = `Generate a clear, instructional diagram illustrating: '${prompt}' 
      for a crochet pattern step. Use a simple, clean style with clear outlines. 
      Include arrows or numbering if needed to show the sequence of actions.
      Focus on making the technique clearly visible and easy to understand for a beginner.
      Show hands performing the stitch if appropriate.`;
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

// Generate an image for a specific part of the pattern
export async function generatePartImage(prompt: string, partName: string, projectType: string): Promise<string> {
  return generateImage({
    prompt,
    type: "part",
    projectType,
    partName
  });
}
