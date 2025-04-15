import OpenAI from "openai";
import { generatePartImage } from "./generateImage";
import { YarnRequirement } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    
    Use standard crochet terms: SC (Single Crochet), MR (Magic Ring), INC (Increase), DEC (Decrease).
    Organize the pattern into logical sections (e.g., Head, Body, Arms, etc.) with clear, numbered steps.
    
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

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    let generatedPattern = JSON.parse(response.choices[0].message.content || "{}");

    // If yarn requirements aren't provided, calculate them
    if (!generatedPattern.yarnRequirements || generatedPattern.yarnRequirements.length === 0) {
      const yarnRequirements = await calculateYarnRequirements(generatedPattern, projectType);
      generatedPattern.yarnRequirements = yarnRequirements;
    }
    
    // For regeneration, merge with locked steps from the original pattern
    if (isRegeneration) {
      generatedPattern = mergeWithLockedSteps(originalPattern, generatedPattern);
    } else {
      // Generate part images for each section (only for new patterns)
      generatedPattern = await generatePartImages(generatedPattern, projectType);
    }
    
    return generatedPattern;
  } catch (error) {
    console.error("Error generating pattern:", error);
    throw new Error("Failed to generate pattern with AI");
  }
}

// Function to generate images for each pattern section
async function generatePartImages(pattern: any, projectType: string): Promise<any> {
  const updatedPattern = { ...pattern };
  
  try {
    // Generate part images for each section in parallel
    const sectionPromises = pattern.sections.map(async (section: any) => {
      const prompt = `A simple illustration of the ${section.name.toLowerCase()} part of a crocheted ${projectType}`;
      
      try {
        const imageUrl = await generatePartImage(prompt, section.name, projectType);
        return {
          ...section,
          partImageUrl: imageUrl
        };
      } catch (error) {
        console.error(`Error generating image for section ${section.name}:`, error);
        return { ...section, partImageUrl: null };
      }
    });
    
    updatedPattern.sections = await Promise.all(sectionPromises);
    return updatedPattern;
  } catch (error) {
    console.error("Error generating part images:", error);
    return pattern; // Return original pattern if image generation fails
  }
}

// Calculate yarn requirements based on the pattern
async function calculateYarnRequirements(pattern: any, projectType: string): Promise<YarnRequirement[]> {
  try {
    // Count total steps and extract the pattern structure
    const totalSteps = pattern.sections.reduce((count: number, section: any) => 
      count + section.steps.length, 0);
    
    const patternSummary = pattern.sections.map((section: any) => {
      return `${section.name}: ${section.steps.length} steps`;
    }).join(", ");
    
    // Ask the AI to estimate yarn requirements
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are an expert in crochet who can accurately estimate yarn requirements.
            Given a pattern structure, estimate the amount of yarn needed for each color.
            Return a JSON object with a 'yarnRequirements' property that contains an array of objects.
            Each object must have 'color' and 'volume' properties.
            Example response format:
            {
              "yarnRequirements": [
                {"color": "Orange", "volume": "~50g"},
                {"color": "Black", "volume": "~20g"}
              ]
            }` 
        },
        { 
          role: "user", 
          content: `For a ${projectType} with ${totalSteps} total steps divided into sections (${patternSummary}),
            please estimate the yarn requirements. Return the result in the exact format I specified, with a 'yarnRequirements' array 
            containing objects that have 'color' and 'volume' properties.
            
            Important: Make sure to return the response in this exact format:
            {
              "yarnRequirements": [
                {"color": "Orange", "volume": "~50g"},
                {"color": "Black", "volume": "~20g"}
              ]
            }` 
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    console.log("Yarn requirements API response:", result);
    
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
    
    // Default fallback if we couldn't parse the response properly
    return [{ color: "Main Color", volume: "~100g" }];
  } catch (error) {
    console.error("Error calculating yarn requirements:", error);
    // Return a default requirement if calculation fails
    return [{ color: "Main Color", volume: "~100g" }];
  }
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
