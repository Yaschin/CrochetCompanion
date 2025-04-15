import React from 'react';
import { StashItem } from '../lib/types';
import { Badge } from './ui/badge';
import { Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface StashUsageIndicatorProps {
  item: StashItem;
  patterns: any[];
}

/**
 * Component that displays which patterns use a particular stash item
 */
export function StashUsageIndicator({ item, patterns }: StashUsageIndicatorProps) {
  // Find patterns that use this item
  const matchingPatterns = patterns.filter((pattern: any) => {
    // For yarn items
    if (item.type === 'yarn' && pattern.yarnRequirements) {
      return pattern.yarnRequirements.some((yarn: any) => 
        (yarn.color && item.color && 
          yarn.color.toLowerCase().includes(item.color.toLowerCase())) || 
        (yarn.color && item.name && 
          yarn.color.toLowerCase().includes(item.name.toLowerCase()))
      );
    }
    
    // For hook items
    if (item.type === 'hook' && pattern.hookRequirements) {
      return pattern.hookRequirements.some((hook: any) => 
        hook.size === item.name || 
        (hook.size && item.description && hook.size.includes(item.description))
      );
    }
    
    // For notions
    if (item.type === 'notion' && pattern.notionsRequirements) {
      return pattern.notionsRequirements.some((notion: any) => 
        notion.name === item.name ||
        (notion.description && item.description && 
          notion.description.toLowerCase().includes(item.description.toLowerCase()))
      );
    }
    
    // For tools
    if (item.type === 'tool' && pattern.toolRequirements) {
      return pattern.toolRequirements.some((tool: any) => 
        tool.name === item.name ||
        (tool.description && item.description && 
          tool.description.toLowerCase().includes(item.description.toLowerCase()))
      );
    }
    
    return false;
  });

  if (matchingPatterns.length === 0) {
    return (
      <span className="text-gray-500 text-xs">Not used in any project</span>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 cursor-help">
              <div className="flex items-center">
                <Info className="h-3 w-3 mr-1" />
                {matchingPatterns.length === 1 
                  ? 'Used in 1 project' 
                  : `Used in ${matchingPatterns.length} projects`}
              </div>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" className="max-w-xs">
            <div className="text-xs">
              <p className="font-medium mb-1">Used in:</p>
              <ul className="list-disc pl-4">
                {matchingPatterns.slice(0, 5).map((pattern, index) => (
                  <li key={index} className="text-xs">{pattern.title}</li>
                ))}
                {matchingPatterns.length > 5 && (
                  <li className="text-xs">...and {matchingPatterns.length - 5} more</li>
                )}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}