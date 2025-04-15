import OpenAI from "openai";

// Check if OpenAI API key is available and validate its format
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const API_KEY_AVAILABLE = Boolean(OPENAI_API_KEY);
const API_KEY_VALID_FORMAT = /^sk-[A-Za-z0-9]{32,}$/.test(OPENAI_API_KEY);

if (!API_KEY_AVAILABLE) {
  console.error("ERROR: OPENAI_API_KEY environment variable is not set. Using fallback placeholders for all images.");
} else if (!API_KEY_VALID_FORMAT) {
  console.error("ERROR: OPENAI_API_KEY appears to be invalid (should start with 'sk-' followed by at least 32 characters). Using fallback placeholders for all images.");
}

// Initialize OpenAI only if API key is available and valid
const openai = (API_KEY_AVAILABLE && API_KEY_VALID_FORMAT) 
  ? new OpenAI({ apiKey: OPENAI_API_KEY }) 
  : null;

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
    // For final product images, create a more detailed prompt that emphasizes crochet aesthetic
    // and includes multiple views (front, side, back)
    enhancedPrompt = `Create a detailed digital illustration showing exactly three views (front, side, and back) of ${prompt} ${projectType ? `(a crocheted ${projectType})` : ""}.
      Use a cute, hand-crafted style with warm pastel tones and a clean, light background.
      ${yarnType ? `Made with ${yarnType} wool. ` : ""} 
      Important: Place the three views side by side in this exact order: front view on the left, side view in the middle, and back view on the right.
      Add clear labels directly below each view saying "Front", "Side", and "Back" respectively.
      Show detailed crochet stitches and yarn texture to make it obviously a crocheted item.
      Use consistent lighting across all three views to ensure they look like the same object.
      Make all three views the exact same scale and from the same distance.
      Make the image clean, professional, and suitable for a crochet pattern guide.`;
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
      const requestTimeout = 30000; // 30 seconds timeout
      const response = await Promise.race([
        openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
        timeout(requestTimeout)
      ]);

      return response.data[0].url || "";
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
 * Get appropriate placeholder image based on image type
 */
function getPlaceholderImage(type: string, prompt: string, partName?: string): string {
  const baseUrl = "https://placehold.co";
  
  switch (type) {
    case "final":
      return `${baseUrl}/1024x1024/f2e6ff/6c4ea6?text=AI+Image+Generation+Unavailable%0AAdd+OpenAI+API+Key+to+Enable%0AVisit+platform.openai.com`;
    case "part":
      const partText = partName ? partName.replace(/\s+/g, '+') : 'Part';
      return `${baseUrl}/400x400/f8f9fa/6c757d?text=${partText}+Image%0AAdd+Valid+OpenAI+API+Key%0A(See+Secret+Environment+Variables)`;
    case "diagram":
      return `${baseUrl}/600x600/fffcf0/8a7340?text=Stitch+Diagram%0AAdd+OpenAI+API+Key+to+Enable%0AGet+Key+at+platform.openai.com`;
    case "step":
    default:
      return `${baseUrl}/600x400/f0f6ff/3a5c8a?text=Step+Image+Unavailable%0AAdd+OpenAI+API+Key+to+Enable%0ACheck+Your+Environment+Variables`;
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