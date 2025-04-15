import OpenAI from "openai";

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
      : 'If the user has not provided a yarn colour, please recommend a suitable wool colour for this crochet project and include it within the instructions.'}
    
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

    const generatedPattern = JSON.parse(response.choices[0].message.content || "{}");
    
    // For regeneration, merge with locked steps from the original pattern
    if (isRegeneration) {
      return mergeWithLockedSteps(originalPattern, generatedPattern);
    }
    
    return generatedPattern;
  } catch (error) {
    console.error("Error generating pattern:", error);
    throw new Error("Failed to generate pattern with AI");
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
    const originalSection = originalPattern.sections[sectionIndex] || { steps: [] };
    
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
        completed: false
      };
    });
    
    return {
      name: newSection.name,
      steps: mergedSteps
    };
  });
  
  return {
    ...originalPattern,
    ...mergedPattern
  };
}
