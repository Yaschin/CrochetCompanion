import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ClipboardList, ChevronUp, ChevronDown } from "lucide-react";
import { Pattern } from "../../lib/types";
import { toast } from "@/hooks/use-toast";

interface ActiveProjectsDialogProps {
  patterns: Pattern[];
  activeProjects: Array<Pattern & { priority: number }>;
  setActiveProjects: React.Dispatch<React.SetStateAction<Array<Pattern & { priority: number }>>>;
  onNavigate?: (view: 'input' | 'viewer' | 'library' | 'stash' | 'calendar') => void;
  onAutoFill: () => void;
}

/**
 * Dialog for managing active projects and their priorities
 */
const ActiveProjectsDialog: React.FC<ActiveProjectsDialogProps> = ({
  patterns,
  activeProjects,
  setActiveProjects,
  onNavigate,
  onAutoFill
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardList className="h-4 w-4 mr-1" />
          Active Projects
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Active Projects</DialogTitle>
          <DialogDescription>
            Select the projects you're actively working on and set their priority.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Available Patterns</h3>
            <span className="text-xs text-gray-500">Higher priority projects are scheduled first</span>
          </div>
          
          {patterns.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">No patterns available.</p>
              <Button 
                variant="link" 
                className="mt-2 text-primary"
                onClick={() => {
                  if (typeof onNavigate === 'function') {
                    onNavigate('library');
                  }
                }}
              >
                Go to Pattern Library
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {patterns.map((pattern: Pattern) => {
                const isActive = activeProjects.some(p => p.id === pattern.id);
                const activePriority = activeProjects.findIndex(p => p.id === pattern.id) + 1;
                
                return (
                  <div 
                    key={pattern.id}
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      isActive ? 'border-primary/30 bg-primary/5' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={`pattern-${pattern.id}`}
                        checked={isActive}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Add to active projects with lowest priority
                            setActiveProjects([
                              ...activeProjects, 
                              { ...pattern, priority: activeProjects.length + 1 }
                            ]);
                          } else {
                            // Remove from active projects
                            setActiveProjects(activeProjects.filter(p => p.id !== pattern.id));
                          }
                        }}
                      />
                      <Label htmlFor={`pattern-${pattern.id}`} className="cursor-pointer">
                        <span className="font-medium">{pattern.title}</span>
                      </Label>
                    </div>
                    
                    {isActive && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          Priority: {activePriority}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // Move up in priority (lower number = higher priority)
                            if (activePriority > 1) {
                              const newProjects = [...activeProjects];
                              const currentIndex = activePriority - 1;
                              const temp = newProjects[currentIndex];
                              newProjects[currentIndex] = newProjects[currentIndex - 1];
                              newProjects[currentIndex - 1] = temp;
                              setActiveProjects(newProjects);
                            }
                          }}
                          disabled={activePriority === 1}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // Move down in priority
                            if (activePriority < activeProjects.length) {
                              const newProjects = [...activeProjects];
                              const currentIndex = activePriority - 1;
                              const temp = newProjects[currentIndex];
                              newProjects[currentIndex] = newProjects[currentIndex + 1];
                              newProjects[currentIndex + 1] = temp;
                              setActiveProjects(newProjects);
                            }
                          }}
                          disabled={activePriority === activeProjects.length}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            onClick={() => {
              if (activeProjects.length === 0) {
                toast({
                  title: "No Active Projects",
                  description: "Please select at least one project to add to your calendar.",
                  variant: "destructive"
                });
                return;
              }
              
              onAutoFill();
            }}
          >
            Auto-Fill Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActiveProjectsDialog;