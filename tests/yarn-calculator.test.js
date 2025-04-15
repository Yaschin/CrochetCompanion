/**
 * Yarn Calculator Tests
 * 
 * This file contains unit tests for the yarn calculation functions.
 * To run the tests:
 * 1. Install Jest: npm install --save-dev jest
 * 2. Add to package.json scripts: "test": "jest"
 * 3. Run: npm test
 */

// Extract these functions for testing
const {
  calculatePatternComplexity,
  extractColorMentions,
  generateDefaultYarnRequirements
} = require('../server/api/generatePattern');

describe('calculatePatternComplexity', () => {
  test('should assign higher complexity to blankets', () => {
    const blanketPattern = {
      sections: [
        { steps: Array(5).fill({}) },
        { steps: Array(5).fill({}) }
      ]
    };
    const hatPattern = {
      sections: [
        { steps: Array(5).fill({}) },
        { steps: Array(5).fill({}) }
      ]
    };
    
    const blanketComplexity = calculatePatternComplexity(blanketPattern, 'blanket');
    const hatComplexity = calculatePatternComplexity(hatPattern, 'hat');
    
    expect(blanketComplexity).toBeGreaterThan(hatComplexity);
  });
  
  test('should increase complexity with more steps', () => {
    const simplePattern = {
      sections: [
        { steps: Array(5).fill({}) }
      ]
    };
    const complexPattern = {
      sections: [
        { steps: Array(50).fill({}) }
      ]
    };
    
    const simpleComplexity = calculatePatternComplexity(simplePattern, 'amigurumi');
    const complexComplexity = calculatePatternComplexity(complexPattern, 'amigurumi');
    
    expect(complexComplexity).toBeGreaterThan(simpleComplexity);
  });
});

describe('extractColorMentions', () => {
  test('should extract color mentions from pattern title', () => {
    const pattern = {
      title: 'Red and Blue Amigurumi Cat',
      description: 'A cute toy',
      sections: []
    };
    
    const colors = extractColorMentions(pattern);
    
    expect(colors).toContain('red');
    expect(colors).toContain('blue');
  });
  
  test('should extract color mentions from section names', () => {
    const pattern = {
      title: 'Amigurumi Cat',
      description: 'A cute toy',
      sections: [
        { name: 'Black Body' },
        { name: 'White Head' }
      ]
    };
    
    const colors = extractColorMentions(pattern);
    
    expect(colors).toContain('black');
    expect(colors).toContain('white');
  });
});

describe('generateDefaultYarnRequirements', () => {
  test('should generate more yarn for blankets', () => {
    const pattern = {
      title: 'Test Pattern',
      sections: []
    };
    
    const blanketYarn = generateDefaultYarnRequirements(pattern, 'blanket', 7);
    const hatYarn = generateDefaultYarnRequirements(pattern, 'hat', 7);
    
    // Extract the volume from the main color and convert to numeric value
    const extractGrams = (volume) => {
      const match = volume.match(/(\d+)g/);
      return match ? parseInt(match[1], 10) : 0;
    };
    
    const blanketGrams = extractGrams(blanketYarn[0].volume);
    const hatGrams = extractGrams(hatYarn[0].volume);
    
    expect(blanketGrams).toBeGreaterThan(hatGrams);
  });
  
  test('should use detected colors when available', () => {
    const patternWithColors = {
      title: 'Blue and Green Scarf',
      sections: []
    };
    
    const requirements = generateDefaultYarnRequirements(patternWithColors, 'scarf', 5);
    
    const colorNames = requirements.map(req => req.color.toLowerCase());
    expect(colorNames).toContain('blue');
    expect(colorNames).toContain('green');
  });
});

// Note: These tests are designed to be illustrative only.
// For actual testing, you would need to:
// 1. Export the functions from generatePattern.ts
// 2. Configure Jest for TypeScript testing
// 3. Use proper type definitions