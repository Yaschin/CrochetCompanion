import OpenAI from "openai";
import { uploadFromUrl, uploadBuffer } from "../objectStorage";

// Check if OpenAI API key is available and validate its format
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const API_KEY_AVAILABLE = Boolean(OPENAI_API_KEY);
// Updated regex to support more characters in API keys (newer formats may include hyphens, underscores, etc.)
const API_KEY_VALID_FORMAT = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY.trim());

if (!API_KEY_AVAILABLE) {
  console.error("ERROR: OPENAI_API_KEY environment variable is not set. Using fallback placeholders for all images.");
} else if (!API_KEY_VALID_FORMAT) {
  console.error("ERROR: OPENAI_API_KEY appears to be invalid (should start with 'sk-' followed by at least 32 characters). Using fallback placeholders for all images.");
}

// Initialize OpenAI only if API key is available and valid
const openai = (API_KEY_AVAILABLE && API_KEY_VALID_FORMAT)
  ? new OpenAI({ apiKey: OPENAI_API_KEY.trim() })
  : null;

// Image model. dall-e-3 was retired from the OpenAI API; default to a current
// image model. Override via OPENAI_IMAGE_MODEL (e.g. "gpt-image-1-mini", "gpt-image-2").
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

interface ImageGenerationRequest {
  prompt: string;
  type: "final" | "step" | "part" | "diagram";
  projectType?: string;
  yarnType?: string;
  partName?: string;
}

export async function generateImage({ prompt, type, projectType, yarnType, partName }: ImageGenerationRequest): Promise<string> {
  // If API key is not available or invalid, return appropriate placeholder based on image type
  if (!API_KEY_AVAILABLE || !API_KEY_VALID_FORMAT) {
    console.log(`OpenAI API key not available or invalid. Returning placeholder for ${type} image.`);
    return getPlaceholderImage(type, prompt, partName);
  }
  
  let enhancedPrompt = prompt;

  if (type === "final") {
    // Extract color information from the pattern if available
    const extractedColors = prompt.match(/colors?:?\s*([^.]+)/i);
    const recommendedColors = extractedColors ? extractedColors[1].trim() : "";
    
    // For final product images, create a detailed prompt focusing on just the front view
    enhancedPrompt = `Generate a high-quality, real-life photographic image showing a single front view of a crocheted ${projectType || "item"} based on the pattern: ${prompt}. 
      The project is crafted using ${yarnType || "appropriate"} yarn${recommendedColors ? `, with recommended colors being ${recommendedColors}` : ""}.
      
      Display only the front view at a straight-on angle to show the most defining features of the pattern.
      
      Use a simple, neutral background and professional lighting to emphasize the detailed texture and true colors of the piece. 
      The style should be natural and realistic, not stylized as cartoon, and reflect the actual design and wool type used in the pattern.
      
      Show fine details of the crochet stitches, texture patterns, and any special features like embellishments or color changes.
      
      The image should realistically capture the texture, colors, and look of the finished piece as it would appear in real life - 
      similar to a professional product photograph that would be used in a pattern book or craft store display.
      
      It should fully be based on the generated pattern details and be suitable for a pattern thumbnail.`;
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

      if (!openai) {
        throw new Error("OpenAI client is not initialized - API key missing");
      }

      // Create a promise that rejects after a timeout
      const timeout = (ms: number) => {
        return new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
        });
      };

      // Race the actual API call against the timeout
      const requestTimeout = 60000; // 60s — current image models can be slower than dall-e-3
      const response = await Promise.race([
        openai.images.generate({
          model: IMAGE_MODEL,
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: (type === "final" ? "high" : "medium") as any,
        }),
        timeout(requestTimeout)
      ]);

      // gpt-image-1 returns base64 image data (not a hosted URL like dall-e-3 did),
      // so decode and store it durably in object storage. Fall back to URL if present.
      const img = response.data?.[0] as any;
      if (img?.b64_json) {
        const buffer = Buffer.from(img.b64_json, "base64");
        return await uploadBuffer(buffer, "image/png");
      }
      if (img?.url) {
        return await uploadFromUrl(img.url);
      }
      return "";
    } catch (err) {
      console.error(`Image generation attempt ${attempt + 1}/${maxRetries} failed:`, err);
      
      // Convert error to string to check for specific error types
      const errorStr = String(err);
      
      // Identify specific error types for better error handling
      const isRateLimit = errorStr.includes('429') || errorStr.toLowerCase().includes('rate limit');
      const isTimeout = errorStr.includes('timed out') || errorStr.includes('timeout');
      const isAuthError = errorStr.includes('401') || errorStr.includes('authentication') || 
                         errorStr.includes('OPENAI_API_KEY') || errorStr.includes('API key');
      const isBillingError = errorStr.includes('billing') || errorStr.includes('quota') || 
                            errorStr.includes('payment');
      const isContentPolicyError = errorStr.includes('content policy') || errorStr.includes('safety');
      
      // Log more specific error details for debugging
      if (isAuthError) {
        console.error("Authentication error with OpenAI API. Check API key.");
      } else if (isRateLimit) {
        console.error(`Rate limit reached on attempt ${attempt + 1}. Will retry with backoff.`);
      } else if (isTimeout) {
        console.error(`Request timed out after ${attempt + 1} attempts.`);
      } else if (isBillingError) {
        console.error("OpenAI billing error or quota exceeded.");
      } else if (isContentPolicyError) {
        console.error("Content policy violation - the image prompt may violate OpenAI content policies.");
      }
      
      // Determine if we should retry
      const shouldRetry = isRateLimit || isTimeout;
      
      // If we shouldn't retry or this is our last attempt, use fallback
      if (!shouldRetry || attempt === maxRetries - 1) {
        // Return appropriate placeholder based on image type
        console.log(`Using fallback for ${type} image due to generation failures. Error type: ${
          isAuthError ? "Authentication" : 
          isRateLimit ? "Rate limit" : 
          isTimeout ? "Timeout" : 
          isBillingError ? "Billing" : 
          isContentPolicyError ? "Content policy" : 
          "Unknown"
        }`);
        return getPlaceholderImage(type, prompt, partName);
      }
      
      // Otherwise, we'll continue to the next iteration and retry
    }
  }
  
  // For type safety, even though this code is unreachable
  return getPlaceholderImage(type, prompt, partName);
}

/**
 * Get appropriate placeholder image based on image type with improved messaging
 * @param type - The type of image being generated
 * @param prompt - The original prompt for context
 * @param partName - Optional part name for part-specific placeholders
 * @returns URL to an appropriate placeholder image
 */
function getPlaceholderImage(type: string, prompt: string, partName?: string): string {
  const baseUrl = "https://placehold.co";
  
  // Create a truncated prompt for display (if relevant)
  const shortPrompt = prompt && prompt.length > 20 
    ? prompt.substring(0, 20).replace(/\s+/g, '+') + '...' 
    : (prompt || '').replace(/\s+/g, '+');
    
  // Format part name for URL if provided
  const partText = partName ? partName.replace(/\s+/g, '+') : 'Part';
  
  switch (type) {
    case "final":
      return `${baseUrl}/1024x1024/f2e6ff/6c4ea6?text=Pattern+Image+Unavailable%0A%0ATo+enable+AI+image+generation:%0A1.+Get+OpenAI+API+key+at+platform.openai.com%0A2.+Add+key+to+environment+variables`;
    case "part":
      return `${baseUrl}/400x400/f8f9fa/6c757d?text=${partText}+Image%0A%0ATo+generate+this+image:%0A1.+Add+a+valid+OpenAI+API+key%0A2.+Check+environment+variables`;
    case "diagram":
      return `${baseUrl}/600x600/fffcf0/8a7340?text=Stitch+Diagram+Unavailable%0A%0ATo+enable+stitch+diagrams:%0A1.+Get+OpenAI+API+key%0A2.+Add+to+your+environment+variables`;
    case "step":
    default:
      return `${baseUrl}/600x400/f0f6ff/3a5c8a?text=Step+Image+Unavailable%0A%0ATo+enable+step+images:%0A1.+Get+OpenAI+API+key+at+platform.openai.com%0A2.+Add+to+environment+variables`;
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

// Generate a stitch diagram for a crochet step
export async function generateStitchDiagram(stepText: string): Promise<string> {
  return generateImage({
    prompt: stepText,
    type: "diagram"
  });
}