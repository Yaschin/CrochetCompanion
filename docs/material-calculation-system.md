# Material Calculation System Documentation

## Overview

The Material Calculation System is responsible for estimating the amount of yarn and other materials needed for crochet patterns. This system uses various factors including project type, complexity, number of steps, and color mentions to provide accurate material estimates.

## Components

### 1. Yarn Requirement Calculation

The `calculateYarnRequirements` function in `server/api/generatePattern.ts` is the main entry point that:
- Calculates pattern complexity using `calculatePatternComplexity`
- Detects color mentions using `extractColorMentions`
- Uses AI to generate detailed yarn requirements
- Falls back to `generateDefaultYarnRequirements` if the AI response fails

```typescript
async function calculateYarnRequirements(pattern: any, projectType: string): Promise<YarnRequirement[]>
```

### 2. Pattern Complexity Evaluation

The `calculatePatternComplexity` function in `server/api/generatePattern.ts` assigns a complexity score (1-10) based on:
- Project type (blankets score higher than small items)
- Total number of steps
- Number of sections

```typescript
function calculatePatternComplexity(pattern: any, projectType: string): number
```

### 3. Color Detection

The `extractColorMentions` function analyzes pattern text to find color mentions:
- Scans pattern title, description, and section names
- Matches against a list of common color names
- Returns a list of unique color names found

```typescript
function extractColorMentions(pattern: any): string[]
```

### 4. Default Requirement Estimation

The `generateDefaultYarnRequirements` function provides fallback estimates when AI processing fails:
- Uses project type and complexity to determine base volumes
- Incorporates detected colors or uses defaults
- Estimates in terms of grams and/or skeins based on project type

```typescript
function generateDefaultYarnRequirements(pattern: any, projectType: string, complexityScore: number): YarnRequirement[]
```

### 5. Stash Usage Tracking

The `estimateUsage` function in `client/src/components/YarnStash.tsx` connects stash items to patterns:
- Matches stash items to pattern requirements based on type (yarn, hook, notion, tool)
- Compares colors, sizes, and names to find relevant patterns
- Returns usage information for each stash item

```typescript
const estimateUsage = (item: StashItem) => {...}
```

## Volume Estimation Logic

### For Different Project Types:

1. **Amigurumi/Toys**:
   - Small: ~50-100g per color
   - Medium: ~100-150g main color, ~30-50g accent colors
   - Complex: ~150-200g main color, ~50g per accent color

2. **Wearables (Hats, Scarves, etc.)**:
   - Hats: ~100g (1 skein)
   - Scarves: ~200g (2 skeins)
   - Sweaters: ~400-500g (4-5 skeins)

3. **Blankets**:
   - Small: ~500g (5 skeins)
   - Large/Complex: ~800g+ (8+ skeins)

### Complexity Factors:

1. **Base complexity** is determined by project type:
   - Blankets: 7/10
   - Amigurumi: 6/10
   - Hats: 4/10
   - Scarves: 3/10

2. **Adjusted** based on:
   - Number of steps (+1 for every 20 steps, max +3)
   - Number of sections (+1 for every 3 sections, max +2)

## Extending The System

To extend or modify the material calculation system:

1. **Add New Material Types**:
   - Add appropriate interfaces in `shared/schema.ts`
   - Update the pattern generation prompts in `server/api/generatePattern.ts`
   - Add UI components in `client/src/components/EnhancedMaterialsList.tsx`

2. **Adjust Volume Calculations**:
   - Modify the complexity scores in `calculatePatternComplexity`
   - Update the volume logic in `generateDefaultYarnRequirements`

3. **Improve Color Detection**:
   - Expand the `commonColors` array in `extractColorMentions`
   - Enhance the text matching algorithm for better detection

## Common Issues and Solutions

1. **Inaccurate Volume Estimates**:
   - Check the complexity score calculation
   - Verify project type is being correctly identified
   - Ensure pattern structure is complete with proper sections and steps

2. **Missing Colors**:
   - Colors may not be mentioned in the text scanned by `extractColorMentions`
   - Verify color names match those in the `commonColors` list
   - Consider adding color hints in pattern title or description

3. **Stash Usage Not Showing**:
   - Ensure color names in stash match those in patterns
   - Check if patterns have proper material requirements defined
   - Verify the pattern query is fetching data correctly