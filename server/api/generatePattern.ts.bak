import OpenAI from "openai";
import { generatePartImage } from "./generateImage";
import { YarnRequirement } from "@shared/schema";

// Check if OpenAI API key is available
const API_KEY_AVAILABLE = Boolean(process.env.OPENAI_API_KEY);

if (!API_KEY_AVAILABLE) {
  console.error("ERROR: OPENAI_API_KEY environment variable is not set. Using fallback template for pattern generation.");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = API_KEY_AVAILABLE ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface PatternInputData {
  prompt: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
  patternId?: string;
  unlockedStepsOnly?: boolean;
  originalPattern?: any;
}

export async function generatePattern(inputData: PatternInputData) {
  const { 
    prompt, 
    projectType, 
    skillLevel, 
    yarnType, 
    size, 
    patternId, 
    unlockedStepsOnly, 
    originalPattern 
  } = inputData;

  // If API key is not available, return a fallback template pattern
  if (!API_KEY_AVAILABLE) {
    console.log("OpenAI API key not available. Returning fallback pattern template.");
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
      ]
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
      // We're no longer auto-generating section images
      // Instead, they'll be generated on-demand when requested

      return generatedPattern;
    } catch (error) {
      lastError = error;
      console.error(`Error generating pattern (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      // Check if this is a rate limit error
      const errorMsg = String(error);
      const isRateLimit = errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit');
      
      // If it's not a rate limit error or this is our last attempt, don't retry
      if (!isRateLimit && attempt === maxRetries - 1) {
        // Provide a more specific error message based on the type of error
        if (errorMsg.includes('API key')) {
          throw new Error("OpenAI API key is missing or invalid. Please check your environment variables.");
        } else if (errorMsg.includes('parse')) {
          throw new Error("Failed to parse response from AI service. The AI may have returned an invalid format.");
        } else {
          throw new Error(`Failed to generate pattern with AI: ${errorMsg}`);
        }
      }
      
      // For rate limit or other retryable errors, continue to next iteration
    }
  }
  
  // If we've exhausted all retries
  throw new Error(`Failed to generate pattern after ${maxRetries} attempts: ${lastError}`);
}
  
  // Function to generate images for each pattern section
  async function generatePartImages(pattern: any, projectType: string): Promise<any> {
    const updatedPattern = { ...pattern };

    try {
      // Generate part images sequentially to avoid rate limiting
      const updatedSections = [];

      // Process sections one at a time with a delay between each
      for (const section of pattern.sections) {
        // Extract colors from yarn requirements if available
        const colors = pattern.yarnRequirements 
          ? pattern.yarnRequirements.map((req: any) => req.color).join(", ") 
          : "";

        const prompt = `A detailed illustration of the ${section.name.toLowerCase()} part of a crocheted ${projectType}${
          colors ? ` using these colors: ${colors}` : ""
        }`;

        try {
          // Add a delay between image generations to avoid rate limits
          // We'll only delay after the first section
          if (updatedSections.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay between requests
          }

          const imageUrl = await generatePartImage(prompt, section.name, projectType);
          updatedSections.push({
            ...section,
            partImageUrl: imageUrl
          });
        } catch (error) {
          console.error(`Error generating image for section ${section.name}:`, error);
          updatedSections.push({ 
            ...section, 
            partImageUrl: null 
          });
        }
      }

      updatedPattern.sections = updatedSections;
      return updatedPattern;
    } catch (error) {
      console.error("Error generating part images:", error);
      return pattern; // Return original pattern if image generation fails
    }
  }

  // Calculate yarn requirements based on the pattern
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
        const requirements = [];
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

// Generate default yarn requirements when AI fails
function generateDefaultYarnRequirements(pattern: any, projectType: string, complexityScore: number): YarnRequirement[] {
  // Extract potential colors or use defaults
  const detectedColors = extractColorMentions(pattern);
  const colors = detectedColors.length > 0 ? detectedColors : ['Main Color', 'Contrast Color'];
  
  // Estimate volume based on project type and complexity
  let mainVolume = '';
  
  if (/blanket|afghan|throw/i.test(projectType)) {
    mainVolume = complexityScore > 7 ? '~800g (8 skeins)' : '~500g (5 skeins)';
  } else if (/sweater|cardigan|jumper/i.test(projectType)) {
    mainVolume = complexityScore > 7 ? '~500g (5 skeins)' : '~400g (4 skeins)';
  } else if (/amigurumi|plush|toy/i.test(projectType)) {
    mainVolume = complexityScore > 7 ? '~150g' : '~100g';
  } else if (/hat|beanie/i.test(projectType)) {
    mainVolume = '~100g (1 skein)';
  } else if (/scarf|cowl/i.test(projectType)) {
    mainVolume = '~200g (2 skeins)';
  } else {
    // Default for unknown project types
    mainVolume = '~200g (2 skeins)';
  }
  
  // Create requirements list
  const requirements: YarnRequirement[] = [
    { color: colors[0], volume: mainVolume }
  ];
  
  // Add contrast colors if detected
  if (colors.length > 1) {
    for (let i = 1; i < colors.length && i < 3; i++) {
      requirements.push({
        color: colors[i],
        volume: '~50g (1/2 skein)'
      });
    }
  }
  
  return requirements;
}

// Helper function to extract information about locked steps
function extractLockedStepsInfo(originalPattern: any): string {
  let lockedStepsInfo = '';

  originalPattern.sections.forEach((section: any, sectionIndex: number) => {
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
    const mergedSteps = newSection.steps.map((newStep: any, stepIndex: number) => {
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
 * Provides a fallback template pattern when OpenAI API key is not available
 * This template includes a clear message for the user explaining why AI generation failed
 * and provides basic pattern structure based on the project type selected
 * 
 * @param prompt User's prompt for pattern
 * @param projectType Type of crochet project
 * @param skillLevel Skill level (beginner, intermediate, advanced)
 * @returns Basic pattern template with a notice about missing API key
 */
function getFallbackPatternTemplate(prompt: string, projectType: string, skillLevel: string) {
  console.warn("⚠️ Using fallback pattern template because OpenAI API key is not available");
  
  // Create a title that indicates this is a template
  const title = `Template: ${prompt} ${projectType.charAt(0).toUpperCase() + projectType.slice(1)}`;
  
  // Determine appropriate hook size based on project type
  let hookSize = "5.0mm (H/8)";
  if (/blanket|afghan/i.test(projectType)) {
    hookSize = "6.0mm (J/10)";
  } else if (/amigurumi|toy/i.test(projectType)) {
    hookSize = "3.5mm (E/4)";
  } else if (/hat|beanie/i.test(projectType)) {
    hookSize = "5.5mm (I/9)";
  }
  
  // Generate yarn requirements based on project type
  const yarnRequirements = [
    { color: "Main Color", volume: /blanket|afghan/i.test(projectType) ? "~500g (5 skeins)" : "~100g (1 skein)" },
    { color: "Contrast Color", volume: "~50g (1/2 skein)" }
  ];
  
  // Generate appropriate sections based on project type
  const sections = [];
  
  if (/amigurumi|toy/i.test(projectType)) {
    sections.push(
      {
        name: "Head",
        notes: "Work in continuous rounds, do not join.",
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
        notes: "Continue working in rounds",
        locked: false,
        steps: [
          { id: 5, text: "Round 1: sc in each st around (18)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Round 2: [2 sc, inc] around (24)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 7, text: "Rounds 3-5: sc in each st around (24)", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      }
    );
  } else if (/hat|beanie/i.test(projectType)) {
    sections.push(
      {
        name: "Crown",
        notes: "Work in continuous rounds",
        locked: false,
        steps: [
          { id: 1, text: "Start with a magic ring", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 2, text: "Round 1: 6 sc into magic ring (6)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Round 2: [inc] around (12)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Round 3: [1 sc, inc] around (18)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Round 4: [2 sc, inc] around (24)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Round 5: [3 sc, inc] around (30)", locked: false, count: 0, notes: "", photo: null, completed: false },
        ]
      },
      {
        name: "Body",
        notes: "Work even for desired length",
        locked: false,
        steps: [
          { id: 7, text: "Rounds 6-15: sc in each st around (30)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 8, text: "Rounds 16-20: [3 sc, dec] around for ribbing effect (24)", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      }
    );
  } else {
    // Default sections for other project types
    sections.push(
      {
        name: "Main Section",
        notes: "Basic pattern structure - please add OpenAI API key for full pattern generation",
        locked: false,
        steps: [
          { id: 1, text: "Chain 20 (or desired width)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 2, text: "Row 1: sc in 2nd ch from hook and each ch across (19 sc)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Row 2: ch 1, turn, sc in each sc across (19 sc)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Repeat Row 2 until desired length is reached", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      },
      {
        name: "Border",
        notes: "Optional finishing touch",
        locked: false,
        steps: [
          { id: 5, text: "Round 1: sc evenly around all edges, with 3 sc in each corner", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Fasten off and weave in ends", locked: false, count: 0, notes: "", photo: null, completed: false }
        ]
      }
    );
  }
  
  // Create the pattern object
  return {
    title,
    description: `A ${skillLevel} level ${projectType} pattern. This is a template - for complete patterns, add an OpenAI API key.`,
    projectType,
    skillLevel,
    yarnRequirements,
    hookRequirements: [
      { size: hookSize, quantity: 1 }
    ],
    notionsRequirements: [
      { name: "Tapestry needle", description: "For weaving in ends", quantity: 1 }
    ],
    sections,
    materialsNotes: `You'll need worsted weight yarn and a ${hookSize} hook. This is a basic template - add your OpenAI API key for a complete custom pattern.`
  };
}