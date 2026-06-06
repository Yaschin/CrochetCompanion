import OpenAI from "openai";
import { YarnRequirement } from "@shared/schema";

// Check if OpenAI API key is available and validate its format
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const API_KEY_AVAILABLE = Boolean(OPENAI_API_KEY);
// Updated regex to support more characters in API keys (newer formats may include hyphens, underscores, etc.)
const API_KEY_VALID_FORMAT = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY.trim());

if (!API_KEY_AVAILABLE) {
  console.error("ERROR: OPENAI_API_KEY environment variable is not set. Using fallback template for pattern generation.");
} else if (!API_KEY_VALID_FORMAT) {
  console.error("ERROR: OPENAI_API_KEY appears to be invalid (should start with 'sk-' followed by at least 32 characters). Using fallback template for pattern generation.");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = (API_KEY_AVAILABLE && API_KEY_VALID_FORMAT)
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

interface PatternInputData {
  prompt: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
  patternId?: string;
  unlockedStepsOnly?: boolean;
  originalPattern?: any;
  sectionImageFocus?: number; // Index of section whose image should influence regeneration
}

export async function generatePattern(inputData: PatternInputData) {
  const {
    prompt,
    projectType,
    skillLevel,
    yarnType,
    size,
    unlockedStepsOnly,
    originalPattern,
  } = inputData;

  // If API key is not available or invalid, return a fallback template pattern
  if (!API_KEY_AVAILABLE || !API_KEY_VALID_FORMAT) {
    console.log("OpenAI API key not available or invalid. Returning fallback pattern template.");
    return getFallbackPatternTemplate(prompt, projectType, skillLevel);
  }

  // Determine if we're regenerating only specific parts of an existing pattern
  const isRegeneration = unlockedStepsOnly && originalPattern;

  // Construct a detailed system prompt for generating crochet patterns
  let systemPrompt = `
    You are an expert crochet pattern designer with years of experience creating clear, detailed patterns.
    ${isRegeneration
      ? `You are updating an existing pattern while keeping some steps exactly as they are.`
      : `Generate a complete crochet pattern for a ${projectType} with a ${skillLevel} skill level.`}

    ${yarnType
      ? `The pattern should use ${yarnType} yarn.`
      : 'If the user has not provided a yarn colour, please recommend suitable wool colours for this crochet project and include them within the instructions.'}

    ${size ? `The finished item should be approximately ${size}.` : ''}

    Include ALL materials needed for the project, including:
    1. Yarn/wool (colors and amounts)
    2. Hook size(s) required
    3. Stuffing (if it's a plushie/amigurumi)
    4. Safety eyes, buttons, or other embellishments
    5. Accessories like zippers, handles, etc. if needed
    6. Any special tools required (tapestry needle, stitch markers, etc.)

    Be comprehensive with materials to ensure the crafter has everything needed before starting.

    Use standard crochet terms: SC (Single Crochet), MR (Magic Ring), INC (Increase), DEC (Decrease).
    Organize the pattern into logical sections (e.g., Head, Body, etc.) with clear, numbered steps.

    For patterns with multiple parts (like amigurumi, stuffed animals, dolls, or multi-piece garments),
    ALWAYS include an "Assembly and Finishing" section at the end with detailed steps on:
    1. How to join the separate parts together
    2. Where to add stuffing, embellishments, or decorative elements
    3. How to weave in ends and finish the project properly
    4. Any blocking or shaping instructions if applicable

    Return the response in JSON format with the following structure:
    {
      "title": "Name of the pattern",
      "sections": [
        {
          "name": "Section name (e.g., Head, Body, etc.)",
          "notes": "",
          "locked": false,
          "steps": [
            {
              "id": 1,
              "text": "Step instruction text"
            },
            ...more steps
          ]
        },
        ...more sections
      ],
      "yarnRequirements": [
        {
          "color": "Color name (e.g., Orange, Black)",
          "volume": "Estimated amount needed (e.g., ~50g or ~80 yards)"
        },
        ...more colors
      ],
      "hookRequirements": [
        {
          "size": "Hook size (e.g., 5.0mm or G/6)",
          "quantity": 1,
          "note": "Optional note about this hook"
        },
        ...more hooks if needed
      ],
      "notionsRequirements": [
        {
          "name": "Item name (e.g., Safety eyes)",
          "description": "Description (e.g., 12mm black)",
          "quantity": 2
        },
        ...more notions if needed
      ],
      "toolRequirements": [
        {
          "name": "Tool name (e.g., Tapestry needle)",
          "description": "Description or purpose",
          "quantity": 1
        },
        ...more tools if needed
      ],
      "needsStuffing": "Polyester Fiberfill Stuffing" // include this for amigurumi/plushies, or empty string if not needed
    }
  `;

  // For regeneration, add the original pattern structure to preserve locked steps
  if (isRegeneration) {
    const lockedStepsInfo = extractLockedStepsInfo(originalPattern);
    systemPrompt += `
      IMPORTANT: You are regenerating a pattern while keeping certain steps exactly as they are.
      The following steps are locked and MUST remain unchanged in your output:

      ${lockedStepsInfo}

      Only rewrite steps that are NOT listed above. Keep the same section structure.
      Your response MUST follow the exact format of the original pattern.
    `;
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = 1000 * Math.pow(2, attempt); // 2s, 4s, 8s
        console.log(`Retrying pattern generation after ${delayMs}ms delay (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      if (!openai) {
        throw new Error("OpenAI client is not initialized - API key missing");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      // Validate the response
      if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
        throw new Error("OpenAI returned an invalid response format");
      }

      let generatedPattern;
      try {
        generatedPattern = JSON.parse(response.choices[0].message.content || "{}");
      } catch (parseError) {
        console.error("Failed to parse OpenAI response as JSON:", parseError);
        throw new Error("Failed to parse AI response as valid JSON");
      }

      // Validate required pattern fields
      if (!generatedPattern.title || !generatedPattern.sections || !Array.isArray(generatedPattern.sections)) {
        throw new Error("Generated pattern is missing required fields (title, sections)");
      }

      // If yarn requirements aren't provided, calculate them
      if (!generatedPattern.yarnRequirements || generatedPattern.yarnRequirements.length === 0) {
        const yarnRequirements = await calculateYarnRequirements(generatedPattern, projectType);
        generatedPattern.yarnRequirements = yarnRequirements;
      }

      // For regeneration, merge with locked steps from the original pattern
      if (isRegeneration) {
        generatedPattern = mergeWithLockedSteps(originalPattern, generatedPattern);
      }
      // Section images are no longer auto-generated here; they are generated
      // on-demand when explicitly requested by the client.

      return generatedPattern;
    } catch (error) {
      lastError = error;
      console.error(`Error generating pattern (attempt ${attempt + 1}/${maxRetries}):`, error);

      // Convert error to string for pattern matching
      const errorMsg = String(error);

      // Classify error types for better handling
      const isRateLimit = errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit');
      const isNetworkError = errorMsg.includes('ECONNREFUSED') ||
                            errorMsg.includes('ETIMEDOUT') ||
                            errorMsg.includes('network') ||
                            errorMsg.includes('socket hang up');
      const isAuthError = errorMsg.includes('401') ||
                          errorMsg.includes('authentication') ||
                          errorMsg.includes('API key') ||
                          errorMsg.includes('auth');
      const isBillingError = errorMsg.includes('billing') ||
                            errorMsg.includes('quota') ||
                            errorMsg.includes('payment required') ||
                            errorMsg.includes('insufficient_quota');
      const isContentPolicyError = errorMsg.includes('content policy') ||
                                  errorMsg.includes('content_policy') ||
                                  errorMsg.includes('violat');
      const isParseError = errorMsg.includes('parse') ||
                          errorMsg.includes('JSON') ||
                          errorMsg.includes('unexpected token');
      const isTimeoutError = errorMsg.includes('timeout') || errorMsg.includes('timed out');

      // Log more specific error details for debugging
      if (isAuthError) {
        console.error("Authentication error with OpenAI API. Check API key.");
      } else if (isRateLimit) {
        console.error(`Rate limit reached on attempt ${attempt + 1}. Will retry with backoff.`);
      } else if (isNetworkError) {
        console.error(`Network error detected on attempt ${attempt + 1}.`);
      } else if (isBillingError) {
        console.error("OpenAI billing error or quota exceeded.");
      } else if (isContentPolicyError) {
        console.error("Content policy violation - prompt may violate OpenAI content policies.");
      } else if (isTimeoutError) {
        console.error(`Request timed out after ${attempt + 1} attempts.`);
      }

      // Determine if we should retry based on error type
      const isRetryableError = isRateLimit || isNetworkError || isTimeoutError;

      // If it's not a retryable error or this is our last attempt, don't retry
      if ((!isRetryableError && attempt === maxRetries - 1) || attempt === maxRetries - 1) {
        // Provide a specific error message based on the error type for better user experience
        if (isAuthError) {
          throw new Error("OpenAI API key is missing, invalid, or expired. Please check your environment variables and ensure your API key is correct.");
        } else if (isBillingError) {
          throw new Error("OpenAI API quota exceeded or billing issue. Please check your account at platform.openai.com.");
        } else if (isContentPolicyError) {
          throw new Error("Your pattern request may contain content that violates OpenAI's content policy. Please modify your prompt.");
        } else if (isParseError) {
          throw new Error("Failed to parse response from AI service. The AI may have returned an invalid format. Try regenerating or simplifying your prompt.");
        } else if (isTimeoutError) {
          throw new Error("The request to OpenAI timed out. Please try again later when the service might be less busy.");
        } else if (isNetworkError) {
          throw new Error("Network error while connecting to OpenAI. Please check your internet connection and try again.");
        } else {
          throw new Error(`Failed to generate pattern with AI: ${errorMsg}`);
        }
      }

      // For retryable errors, continue to next iteration
    }
  }

  // If we've exhausted all retries
  throw new Error(`Failed to generate pattern after ${maxRetries} attempts: ${lastError}`);
}

// Calculate yarn requirements based on the pattern, asking the AI for an
// estimate and falling back to heuristic defaults on failure.
async function calculateYarnRequirements(pattern: any, projectType: string): Promise<YarnRequirement[]> {
  try {
    // Extract pattern summary and complexity metrics for better estimation
    const totalSteps = pattern.sections.reduce((count: number, section: any) =>
      count + section.steps.length, 0);
    const complexityScore = calculatePatternComplexity(pattern, projectType);

    // Create a detailed summary of the pattern including section names and steps
    const patternSummary = pattern.sections.map((section: any) => {
      return `${section.name}: ${section.steps.length} steps`;
    }).join(", ");

    // Extract potential color mentions from pattern title and description
    const colorMentions = extractColorMentions(pattern);
    const colorMentionsText = colorMentions.length > 0
      ? `I found these potential colors mentioned in the pattern: ${colorMentions.join(", ")}.`
      : "";

    console.log(`Calculating yarn requirements for ${projectType} with ${totalSteps} steps (complexity: ${complexityScore})...`);
    console.log(`Detected colors: ${colorMentions.join(", ") || "None detected"}`);

    // Ask the AI to estimate yarn requirements with enhanced context
    if (!openai) {
      throw new Error("OpenAI client is not initialized - API key missing");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in crochet who can accurately estimate yarn requirements.
            Given a pattern structure, estimate the amount of yarn needed for each color.
            Be specific about weights and measurements:
            - For small amigurumi: use grams (usually 10-50g per color)
            - For wearables: use both grams and yards/meters (e.g., "~200g/400yds")
            - For blankets: specify using grams or skeins (e.g., "~400g (4 skeins)")

            Specify yarn weight when relevant (e.g., "~100g worsted weight" or "~50g fingering weight").

            Return a JSON object with a 'yarnRequirements' property that contains an array of objects.
            Each object must have 'color' and 'volume' properties.
            Example response format:
            {
              "yarnRequirements": [
                {"color": "Orange", "volume": "~50g fingering weight"},
                {"color": "Black", "volume": "~20g (1/4 skein)"}
              ]
            }`
        },
        {
          role: "user",
          content: `For a ${projectType} with ${totalSteps} total steps divided into sections (${patternSummary}).
            The pattern has a complexity score of ${complexityScore}/10 (higher means more complex).
            ${colorMentionsText}

            Please estimate the yarn requirements with specific weights and measurements.
            For larger projects, include both weight and yardage estimations.
            Return the result with a 'yarnRequirements' array containing objects with 'color' and 'volume' properties.

            Important: Make sure your response follows this exact format:
            {
              "yarnRequirements": [
                {"color": "Orange", "volume": "~50g fingering weight"},
                {"color": "Black", "volume": "~20g worsted weight (1/4 skein)"}
              ]
            }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    console.log("Enhanced yarn requirements API response:", result);

    // Handle different response formats from the AI
    if (Array.isArray(result)) {
      return result;
    } else if (result.yarnRequirements && Array.isArray(result.yarnRequirements)) {
      return result.yarnRequirements;
    } else if (typeof result === 'object') {
      // Convert flat object to array if needed
      const requirements: YarnRequirement[] = [];
      for (const key in result) {
        if (key !== 'yarnRequirements') {
          const colorMatch = key.match(/color|yarn|wool/i);
          const volumeMatch = key.match(/volume|amount|quantity|yards|grams/i);

          if (colorMatch) {
            requirements.push({
              color: result[key],
              volume: volumeMatch && result[volumeMatch[0]] ? result[volumeMatch[0]] : "~100g"
            });
          }
        }
      }

      if (requirements.length > 0) {
        return requirements;
      }
    }

    // Default fallback with estimated requirements based on project type
    console.warn("AI response parsing failed, using default estimates");
    return generateDefaultYarnRequirements(pattern, projectType, complexityScore);

  } catch (error) {
    console.error("Error calculating yarn requirements:", error);
    // Return estimated requirements instead of throwing an error
    const complexityScore = calculatePatternComplexity(pattern, projectType);
    return generateDefaultYarnRequirements(pattern, projectType, complexityScore);
  }
}

// Helper function to calculate pattern complexity (0-10 scale)
function calculatePatternComplexity(pattern: any, projectType: string): number {
  // Base complexity based on project type
  let baseComplexity = 5;

  // Adjust based on project type
  if (/blanket|afghan|throw/i.test(projectType)) baseComplexity = 7;
  else if (/amigurumi|plush|toy/i.test(projectType)) baseComplexity = 6;
  else if (/hat|beanie/i.test(projectType)) baseComplexity = 4;
  else if (/scarf|cowl/i.test(projectType)) baseComplexity = 3;

  // Count total steps
  const totalSteps = pattern.sections.reduce((total: number, section: any) => total + section.steps.length, 0);

  // Factor in number of steps (more steps = higher complexity)
  const stepComplexity = Math.min(3, Math.floor(totalSteps / 20));

  // Factor in number of sections (more sections = higher complexity)
  const sectionComplexity = Math.min(2, Math.floor(pattern.sections.length / 3));

  // Calculate final score (clamped between 1-10)
  return Math.max(1, Math.min(10, baseComplexity + stepComplexity + sectionComplexity));
}

// Extract color mentions from pattern text
function extractColorMentions(pattern: any): string[] {
  const commonColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black',
    'white', 'gray', 'grey', 'brown', 'beige', 'cream', 'teal', 'navy',
    'turquoise', 'maroon', 'olive', 'mint', 'coral', 'indigo', 'violet'
  ];

  // Text to search for color mentions
  const textToSearch = [
    pattern.title || '',
    pattern.description || '',
    ...(pattern.sections || []).map((s: any) => s.name || '')
  ].join(' ').toLowerCase();

  // Find color mentions
  return commonColors.filter(color =>
    new RegExp(`\\b${color}\\b`, 'i').test(textToSearch)
  );
}

/**
 * Generates default yarn requirements based on project type and complexity.
 * Used as a fallback when the AI estimate is unavailable.
 *
 * @param pattern - The pattern object (for color detection)
 * @param projectType - Type of crochet project
 * @param complexityScore - Complexity score (0-10)
 * @param yarnWeight - Optional yarn weight information to include in the volume description
 * @returns Array of YarnRequirement objects
 */
function generateDefaultYarnRequirements(
  pattern: any,
  projectType: string,
  complexityScore: number = 5,
  yarnWeight: string = ''
): YarnRequirement[] {
  // Extract potential colors or use defaults
  const detectedColors = pattern && typeof pattern === 'object' ? extractColorMentions(pattern) : [];
  const colors = detectedColors.length > 0 ? detectedColors : ['Main Color', 'Contrast Color'];

  // Estimate volume based on project type and complexity
  let mainVolume = '';
  let contrastVolume = '';

  // Determine yarn requirements based on project type and complexity
  if (/blanket|afghan|throw/i.test(projectType)) {
    mainVolume = complexityScore > 7 ? '~800g (8 skeins)' : '~500g (5 skeins)';
    contrastVolume = '~200g (2 skeins)';
  } else if (/sweater|cardigan|jumper|garment/i.test(projectType)) {
    mainVolume = complexityScore > 7 ? '~500g (5 skeins)' : '~400g (4 skeins)';
    contrastVolume = '~100g (1 skein)';
  } else if (/amigurumi|plush|toy/i.test(projectType)) {
    mainVolume = complexityScore > 7 ? '~150g (1-2 skeins)' : '~100g (1 skein)';
    contrastVolume = '~50g (1/2 skein)';
  } else if (/hat|beanie|cap/i.test(projectType)) {
    mainVolume = '~100g (1 skein)';
    contrastVolume = '~50g (1/2 skein)';
  } else if (/scarf|cowl/i.test(projectType)) {
    mainVolume = '~200g (2 skeins)';
    contrastVolume = '~50g (1/2 skein)';
  } else if (/bag|tote|purse/i.test(projectType)) {
    mainVolume = complexityScore > 7 ? '~300g (3 skeins)' : '~200g (2 skeins)';
    contrastVolume = '~100g (1 skein)';
  } else if (/shawl|wrap/i.test(projectType)) {
    mainVolume = complexityScore > 7 ? '~400g (4 skeins)' : '~300g (3 skeins)';
    contrastVolume = '~100g (1 skein)';
  } else {
    // Default for unknown project types
    mainVolume = '~200g (2 skeins)';
    contrastVolume = '~50g (1/2 skein)';
  }

  // Add yarn weight information if provided
  if (yarnWeight) {
    mainVolume += ` of ${yarnWeight}`;
    contrastVolume += ` of ${yarnWeight}`;
  }

  // Create requirements list
  const requirements: YarnRequirement[] = [
    { color: colors[0], volume: mainVolume }
  ];

  // Add contrast colors if available
  if (colors.length > 1) {
    // Only add up to 2 contrast colors to prevent excessive requirements
    const maxContrastColors = Math.min(colors.length - 1, 2);
    for (let i = 1; i <= maxContrastColors; i++) {
      requirements.push({
        color: colors[i],
        volume: contrastVolume
      });
    }
  }

  return requirements;
}

// Helper function to extract information about locked steps
function extractLockedStepsInfo(originalPattern: any): string {
  let lockedStepsInfo = '';

  originalPattern.sections.forEach((section: any) => {
    lockedStepsInfo += `Section: ${section.name}\n`;

    section.steps.forEach((step: any) => {
      if (step.locked) {
        lockedStepsInfo += `  - Step ID ${step.id}: "${step.text}"\n`;
      }
    });
  });

  return lockedStepsInfo;
}

// Helper function to merge regenerated pattern with original locked steps
function mergeWithLockedSteps(originalPattern: any, generatedPattern: any): any {
  const mergedPattern = { ...generatedPattern };

  // Make sure sections match between original and new
  mergedPattern.sections = mergedPattern.sections.map((newSection: any, sectionIndex: number) => {
    const originalSection = originalPattern.sections[sectionIndex] || {
      steps: [],
      notes: "",
      locked: false,
      partImageUrl: null
    };

    // Merge steps, preserving locked ones from original
    const mergedSteps = newSection.steps.map((newStep: any) => {
      const originalStep = originalSection.steps.find((s: any) => s.id === newStep.id);

      // If the step was locked in the original, keep it exactly as it was
      if (originalStep && originalStep.locked) {
        return originalStep;
      }

      // For new or unlocked steps, use the newly generated content
      // but preserve completion status from original if it exists
      if (originalStep) {
        return {
          ...newStep,
          locked: false,
          count: originalStep.count || 0,
          notes: originalStep.notes || '',
          photo: originalStep.photo || null,
          aiStepImage: originalStep.aiStepImage || null,
          completed: originalStep.completed || false
        };
      }

      // Completely new step
      return {
        ...newStep,
        locked: false,
        count: 0,
        notes: '',
        photo: null,
        aiStepImage: null,
        completed: false
      };
    });

    // If the section is locked in the original, preserve all its properties
    if (originalSection.locked) {
      return {
        ...originalSection,
        steps: mergedSteps
      };
    }

    // Otherwise merge the section data
    return {
      name: newSection.name,
      notes: originalSection.notes || newSection.notes || "",
      locked: originalSection.locked || false,
      partImageUrl: originalSection.partImageUrl || null,
      steps: mergedSteps
    };
  });

  // Merge other pattern properties, preserving original material notes
  return {
    ...originalPattern,
    ...mergedPattern,
    materialsNotes: originalPattern.materialsNotes || "",
    yarnRequirements: mergedPattern.yarnRequirements || originalPattern.yarnRequirements || []
  };
}

/**
 * Provides a fallback template pattern when OpenAI API key is not available.
 * This template includes a clear message for the user explaining why AI generation
 * failed and provides a basic pattern structure based on the project type selected.
 *
 * @param prompt User's prompt for pattern
 * @param projectType Type of crochet project
 * @param skillLevel Skill level (beginner, intermediate, advanced)
 * @returns Basic pattern template with a notice about the missing API key
 */
function getFallbackPatternTemplate(prompt: string, projectType: string, skillLevel: string) {
  console.warn("⚠️ Using fallback pattern template because OpenAI API key is not available");

  // Clean and capitalize the prompt and project type for the title
  const cleanPrompt = prompt.trim().replace(/^[a-z]/, c => c.toUpperCase());
  const cleanProjectType = projectType.charAt(0).toUpperCase() + projectType.slice(1).toLowerCase();

  // Create a clear title that indicates this is a template
  const title = `🧶 ${cleanPrompt} ${cleanProjectType} (Template)`;

  // Determine appropriate hook size and yarn weight based on project type
  let hookSize = "5.0mm (H/8)";
  let yarnWeight = "Medium (4) - Worsted weight";
  let extraHooks = [];

  if (/blanket|afghan|throw/i.test(projectType)) {
    hookSize = "6.0mm (J/10)";
    yarnWeight = "Medium (4) - Worsted or Aran weight";
    // For blankets, sometimes a larger hook is needed for the border
    extraHooks.push({ size: "6.5mm (K/10.5)", quantity: 1, note: "Optional - for border" });
  } else if (/amigurumi|toy|plush/i.test(projectType)) {
    hookSize = "3.5mm (E/4)";
    yarnWeight = "Light (3) - DK weight";
    // For amigurumi, sometimes a smaller hook is needed for tight stitches
    extraHooks.push({ size: "2.75mm (C/2)", quantity: 1, note: "Optional - for finer details" });
  } else if (/hat|beanie/i.test(projectType)) {
    hookSize = "5.5mm (I/9)";
    yarnWeight = "Medium (4) - Worsted weight";
    // For hats, sometimes multiple hook sizes are used
    extraHooks.push({ size: "5.0mm (H/8)", quantity: 1, note: "For ribbing" });
  } else if (/scarf|cowl/i.test(projectType)) {
    hookSize = "5.0mm (H/8)";
    yarnWeight = "Medium (4) - Worsted weight";
  } else if (/garment|sweater|cardigan/i.test(projectType)) {
    hookSize = "5.0mm (H/8)";
    yarnWeight = "Medium (4) - Worsted weight";
    // For garments, multiple hook sizes are common
    extraHooks.push({ size: "4.5mm (G/7)", quantity: 1, note: "For ribbing and edges" });
  } else if (/bag|tote|purse/i.test(projectType)) {
    hookSize = "4.0mm (G/6)";
    yarnWeight = "Medium (4) - Worsted weight";
    extraHooks.push({ size: "3.5mm (E/4)", quantity: 1, note: "For firm base and structure" });
  }

  // Generate appropriate yarn requirements using the shared utility function.
  // Create a minimal pattern object with just enough structure for the function to work.
  const templatePattern = {
    title: cleanPrompt,
    description: `${cleanPrompt} ${projectType}`,
    sections: []
  };
  // Use the shared utility function to generate consistent yarn requirements
  const yarnRequirements = generateDefaultYarnRequirements(templatePattern, projectType, 5, yarnWeight);

  // Generate appropriate sections based on project type
  const sections = [];

  if (/amigurumi|toy|plush/i.test(projectType)) {
    sections.push(
      {
        name: "Head",
        notes: "Work in continuous rounds, do not join. ⚠️ ADD API KEY: This is a template pattern with basic instructions only. Get your OpenAI API key to generate a complete custom pattern.",
        locked: false,
        steps: [
          { id: 1, text: "Start with a magic ring", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 2, text: "Round 1: 6 sc into magic ring (6)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Round 2: [inc] around (12)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Round 3: [1 sc, inc] around (18)", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Body",
        notes: "Continue working in rounds. For a complete custom pattern and step-by-step instructions, add your OpenAI API key to environment variables.",
        locked: false,
        steps: [
          { id: 5, text: "Round 1: sc in each st around (18)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Round 2: [2 sc, inc] around (24)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 7, text: "Rounds 3-5: sc in each st around (24)", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Legs (make 4)",
        notes: "Make 4 identical legs. For a complete custom pattern with detailed instructions for each part, add your OpenAI API key.",
        locked: false,
        steps: [
          { id: 8, text: "Start with a magic ring", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 9, text: "Rounds 1-3: 6 sc in ring, then sc around for 2 more rounds (6)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 10, text: "Fasten off, leaving long tail for sewing", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Ears (make 2)",
        notes: "Make 2 identical ears. Shape will depend on your specific animal design.",
        locked: false,
        steps: [
          { id: 11, text: "Start with a magic ring", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 12, text: "Round 1: 6 sc in ring (6)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 13, text: "Round 2: [inc] around (12)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 14, text: "Fasten off, leaving long tail for sewing", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Tail",
        notes: "For the tail of your amigurumi animal.",
        locked: false,
        steps: [
          { id: 15, text: "Start with a magic ring", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 16, text: "Round 1: 6 sc in ring (6)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 17, text: "Rounds 2-4: sc around (6)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 18, text: "Fasten off, leaving long tail for sewing", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Assembly and Finishing",
        notes: "Follow these steps to assemble all parts of your amigurumi.",
        locked: false,
        steps: [
          { id: 19, text: "Stuff head and body firmly with fiberfill", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 20, text: "Sew head to body securely", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 21, text: "Attach legs to bottom of body, evenly spaced", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 22, text: "Sew ears to top of head", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 23, text: "Attach tail to back of body", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 24, text: "Embroider facial features using black yarn", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 25, text: "Add safety eyes if using, or embroider eyes", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 26, text: "Weave in all remaining ends", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      }
    );
  } else if (/hat|beanie/i.test(projectType)) {
    sections.push(
      {
        name: "Crown",
        notes: "Work in continuous rounds. ⚠️ ADD API KEY: This is a basic template - add your OpenAI API key for a complete custom pattern with full instructions for your specific pattern.",
        locked: false,
        steps: [
          { id: 1, text: "Start with a magic ring", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 2, text: "Round 1: 6 sc into magic ring (6)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Round 2: [inc] around (12)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Round 3: [1 sc, inc] around (18)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Round 4: [2 sc, inc] around (24)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Round 5: [3 sc, inc] around (30)", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Body",
        notes: "Work even for desired length. Visit platform.openai.com to obtain an API key for a complete custom pattern with images.",
        locked: false,
        steps: [
          { id: 7, text: "Rounds 6-15: sc in each st around (30)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 8, text: "Rounds 16-20: [3 sc, dec] around for ribbing effect (24)", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      }
    );
  } else if (/garment|sweater|cardigan/i.test(projectType)) {
    sections.push(
      {
        name: "Gauge Swatch",
        notes: "Make a gauge swatch before starting. ⚠️ ADD API KEY: Add your OpenAI API key to generate a complete custom pattern with measurements and sizing options.",
        locked: false,
        steps: [
          { id: 1, text: "Chain 25", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 2, text: "Row 1: sc in 2nd ch from hook and in each ch across (24 sc)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Rows 2-15: ch 1, turn, sc in each sc across (24 sc)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Block swatch and measure: 4 inches should equal approximately 16 sts and 18 rows", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Body (Sample Instructions)",
        notes: "These are very basic steps. Add your OpenAI API key for complete instructions customized to your needs and skill level.",
        locked: false,
        steps: [
          { id: 5, text: "Chain foundation row to desired width", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Work even in pattern stitch until desired length", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      }
    );
  } else {
    // Default sections for other project types
    sections.push(
      {
        name: "Main Section",
        notes: "⚠️ API KEY REQUIRED: This is a basic template pattern. Add an OpenAI API key to generate a complete custom pattern with detailed instructions specifically for your project.",
        locked: false,
        steps: [
          { id: 1, text: "Chain 20 (or desired width)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 2, text: "Row 1: sc in 2nd ch from hook and each ch across (19 sc)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Row 2: ch 1, turn, sc in each sc across (19 sc)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Repeat Row 2 until desired length is reached", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Border (Optional)",
        notes: "Optional finishing touch. For AI-generated custom patterns, add your OpenAI API key to environment variables.",
        locked: false,
        steps: [
          { id: 5, text: "Round 1: sc evenly around all edges, with 3 sc in each corner", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Fasten off and weave in ends", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      }
    );
  }

  // Create the pattern object with clear, actionable messaging about the missing API key
  return {
    title,
    description: `⚠️ AI PATTERN GENERATION UNAVAILABLE

This is a basic ${skillLevel} level ${projectType} template only. To generate a complete custom pattern based on your specific request, please follow these steps:

1. Get an OpenAI API key:
   • Visit https://platform.openai.com to create an account
   • Navigate to the API keys section and create a new secret key
   • Copy the key (starts with "sk-" followed by a string of characters)

2. Add the API key to your environment variables:
   • In the Tools panel, select "Secrets"
   • Add a new secret with:
     - Key: OPENAI_API_KEY
     - Value: your OpenAI key (starting with sk-)
   • Click "Add Secret"

3. Refresh the page after adding the key

Your custom AI-generated pattern will include:
• Detailed step-by-step instructions for your specific ${projectType}
• Custom sizing and measurements
• Accurate material calculations
• Section illustrations and diagrams
• Helpful notes and tips

The template below provides basic guidance but lacks the customization and detail of AI-generated patterns.`,
    projectType,
    skillLevel,
    yarnRequirements,
    hookRequirements: [
      { size: hookSize, quantity: 1, note: "Or size needed to obtain gauge" },
      ...extraHooks
    ],
    notionsRequirements: [
      { name: "Tapestry needle", description: "For weaving in ends", quantity: 1 },
      { name: "Stitch markers", description: "For marking rounds/sections", quantity: 4 },
      ...(/amigurumi|toy|plush|stuffed/i.test(projectType) ? [
        { name: "Safety eyes", description: "12mm - for plushie/amigurumi", quantity: 2 },
        { name: "Embroidery floss", description: "Black - for facial features", quantity: 1 }
      ] : []),
      ...(/garment|sweater|cardigan/i.test(projectType) ? [
        { name: "Buttons", description: "1 inch (25mm) - if making a cardigan", quantity: 5 }
      ] : []),
      ...(/bag|tote|purse/i.test(projectType) ? [
        { name: "Magnetic snap closure", description: "For bag opening", quantity: 1 },
        { name: "Bag handles", description: "Optional - wood or leather", quantity: 2 }
      ] : [])
    ],
    toolRequirements: [
      { name: "Tape measure", description: "For checking gauge and measurements" },
      { name: "Scissors", description: "For cutting yarn" },
      ...(/garment|sweater|cardigan/i.test(projectType) ? [
        { name: "Blocking pins", description: "For blocking garment pieces" }
      ] : []),
      ...(/amigurumi|toy|plush|stuffed/i.test(projectType) ? [
        { name: "Stuffing tool", description: "For inserting stuffing in small areas" }
      ] : [])
    ],
    needsStuffing: /amigurumi|toy|plush|stuffed/i.test(projectType) ? "Polyester fiberfill stuffing (approximately 100g)" : "",
    sections,
    materialsNotes: `⚠️ This is a basic template with estimated materials only. For accurate, custom material calculations based on your specific ${projectType} and requirements, please add your OpenAI API key to your environment variables.

The template suggests using ${yarnWeight} yarn with a ${hookSize} hook as a starting point, but your actual project may require different materials depending on your specific design and preferences.

Once you add your API key, you can regenerate this pattern to get detailed, accurate material requirements customized to your project.`
  };
}
