import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ImageGenerationRequest {
  prompt: string;
  type: "final" | "step" | "part" | "diagram";
  projectType?: string;
  yarnType?: string;
  partName?: string;
}

export async function generateImage({ prompt, type, projectType, yarnType, partName }: ImageGenerationRequest): Promise<string> {
  let enhancedPrompt = prompt;

  if (type === "final") {
    // For final product images, create a more detailed prompt that emphasizes crochet aesthetic
    // and includes multiple views (front, side, back)
    enhancedPrompt = `Generate a digital illustration showing three views (front, side, and back) of ${prompt} ${projectType ? `(a crocheted ${projectType})` : ""} 
      in a cute, hand-crafted style with warm pastel tones. 
      ${yarnType ? `Made with ${yarnType} wool. ` : ""} 
      Arrange the three views side by side in a single image to show how the item looks from different angles.
      Label each view discreetly with "Front View", "Side View", and "Back View".
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
  } else if (type === "diagram") {
    // For stitch diagrams, create a technical diagram with standard crochet notation
    enhancedPrompt = `Create a clear, technical crochet stitch diagram for: "${prompt}".
      Use standard crochet diagram notation (symbols) on a grid background.
      Include a legend explaining the symbols used.
      Make the diagram clean, precise, and professional looking with black symbols on white background.
      Arrange the stitches to show the pattern repeat clearly.
      Label the diagram with the stitch name.
      This should be a top-down technical diagram, not a realistic image of yarn.
      Add row numbers on the left side if showing multiple rows.`;
  } else {
    // For step images, create instructional, diagrammatic visuals
    enhancedPrompt = `Generate a clear, instructional diagram illustrating: '${prompt}' 
      for a crochet pattern step. Use a simple, clean style with clear outlines. 
      Include arrows or numbering if needed to show the sequence of actions.
      Focus on making the technique clearly visible and easy to understand for a beginner.
      Show hands performing the stitch if appropriate.`;
  }

  // Retry logic with exponential backoff
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // If this isn't the first attempt, add a delay with exponential backoff
      if (attempt > 0) {
        const delayMs = 1000 * Math.pow(2, attempt); // 2s, 4s, 8s
        console.log(`Retrying image generation after ${delayMs}ms delay (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return response.data[0].url || "";
    } catch (err) {
      console.error(`Image generation attempt ${attempt + 1}/${maxRetries} failed:`, err);
      
      // Convert error to string to check if it's a rate limit issue
      const errorStr = String(err);
      const isRateLimit = errorStr.includes('429') || errorStr.toLowerCase().includes('rate limit');
      
      // If it's not a rate limit error or this is our last attempt, don't retry
      if (!isRateLimit || attempt === maxRetries - 1) {
        // For part images, we can gracefully degrade by returning empty string
        if (type === "part") {
          console.log("Using fallback for part image due to generation failures");
          return ""; // Return empty string for part images, as they're not critical
        }
        
        // For main product images, we need to fail
        throw new Error("Failed to generate image with AI");
      }
      
      // Otherwise, we'll continue to the next iteration and retry
    }
  }
  
  // For type safety, even though this code is unreachable
  throw new Error("Failed to generate image with AI after retries");
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

// Generate a stitch diagram for a crochet step
export async function generateStitchDiagram(stepText: string): Promise<string> {
  return generateImage({
    prompt: stepText,
    type: "diagram"
  });
}
