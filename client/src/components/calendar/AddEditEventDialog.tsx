import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateForInput } from "../../lib/dateUtils";
import { Pattern, ProjectEvent } from "../../lib/types";

interface AddEditEventDialogProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventData: Partial<ProjectEvent> | null;
  setEventData: React.Dispatch<React.SetStateAction<any>>;
  patterns: Pattern[];
  onPatternSelect: (patternId: string) => void;
  onSave: () => void;
  onDelete?: () => void;
}

/**
 * Dialog component for adding/editing calendar events
 */
const AddEditEventDialog: React.FC<AddEditEventDialogProps> = ({
  mode,
  isOpen,
  onOpenChange,
  eventData,
  setEventData,
  patterns,
  onPatternSelect,
  onSave,
  onDelete
}) => {
  if (!eventData) return null;
  
  const isEditMode = mode === "edit";
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Project Event Details" : "Add Project Event"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={eventData.title || ''}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              placeholder="Complete the hat brim..."
            />
          </div>
          
          {isEditMode && eventData.patternTitle ? (
            <div className="grid gap-2">
              <Label>Pattern</Label>
              <div className="px-3 py-2 rounded-md bg-gray-50 text-gray-700">
                {eventData.patternTitle}
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="pattern">Link to Pattern (Optional)</Label>
              <Select 
                onValueChange={onPatternSelect}
                value={eventData.patternId}
              >
                <SelectTrigger id="pattern">
                  <SelectValue placeholder="Select a pattern" />
                </SelectTrigger>
                <SelectContent>
                  {patterns.map((pattern: Pattern) => (
                    <SelectItem key={pattern.id} value={pattern.id}>
                      {pattern.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={
                  eventData.date 
                    ? formatDateForInput(eventData.date) 
                    : formatDateForInput(new Date())
                }
                onChange={(e) => setEventData({ 
                  ...eventData, 
                  date: new Date(e.target.value) 
                })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeEstimate">Time Estimate (minutes)</Label>
              <Input
                id="timeEstimate"
                type="number"
                min="1"
                value={eventData.timeEstimate || 30}
                onChange={(e) => setEventData({ 
                  ...eventData, 
                  timeEstimate: parseInt(e.target.value) || 30 
                })}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={eventData.description || ''}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              placeholder="Add any notes or details about this task..."
              rows={3}
            />
          </div>
          
          {isEditMode && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="completed"
                checked={eventData.completed || false}
                onChange={() => setEventData({ 
                  ...eventData, 
                  completed: !eventData.completed 
                })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="completed" className="text-sm font-medium text-gray-700">
                Mark as completed
              </Label>
            </div>
          )}
        </div>
        
        {isEditMode ? (
          <DialogFooter className="flex justify-between">
            {onDelete && (
              <Button 
                variant="destructive" 
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={onSave}>Save Changes</Button>
            </div>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSave}>Save Event</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditEventDialog;