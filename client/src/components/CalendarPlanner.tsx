import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { CalendarIcon, PlusCircle, Clock } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { Pattern } from '../lib/types';

// Types for project events
interface ProjectEvent {
  id: string;
  title: string;
  patternId?: string;
  patternTitle?: string;
  date: Date | string;
  description?: string;
  completed: boolean;
  timeEstimate?: number; // in minutes
}

// Average crocheting speeds per project type (stitches per minute)
const CROCHET_SPEEDS: Record<string, number> = {
  'amigurumi': 10,
  'blanket': 15,
  'scarf': 12,
  'hat': 12,
  'sweater': 8,
  'toy': 10,
  'home': 12,
  'accessory': 14,
  'other': 12
};

// Calculate time estimate based on pattern complexity
function calculateTimeEstimate(pattern: Pattern): number {
  if (!pattern) return 0;
  
  const projectType = pattern.projectType || 'other';
  const speed = CROCHET_SPEEDS[projectType] || CROCHET_SPEEDS.other;
  
  // Count total steps
  let totalSteps = 0;
  if (pattern.sections) {
    pattern.sections.forEach(section => {
      totalSteps += section.steps?.length || 0;
    });
  }
  
  // Base time: 30 min per step (simplified model)
  let baseTime = totalSteps * 30;
  
  // Adjust based on difficulty
  switch (pattern.skillLevel) {
    case 'beginner':
      baseTime = baseTime * 1.2;
      break;
    case 'intermediate':
      baseTime = baseTime * 1.0;
      break;
    case 'advanced':
      baseTime = baseTime * 0.8; // Skilled crafters are faster
      break;
    default:
      baseTime = baseTime * 1.0;
  }
  
  return Math.round(baseTime);
}

// Format minutes into hours and minutes
function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} minutes`;
}

// Calculate completion date based on time estimate and daily crochet time
function calculateCompletionDate(
  startDate: Date, 
  timeEstimate: number, 
  dailyCrochetTime: number
): Date {
  // If no daily time set, assume it takes one day
  if (!dailyCrochetTime || dailyCrochetTime <= 0) {
    const result = new Date(startDate);
    result.setDate(result.getDate() + 1);
    return result;
  }
  
  // Calculate how many days it will take
  const daysNeeded = Math.ceil(timeEstimate / dailyCrochetTime);
  
  // Create a new date object for the result
  const result = new Date(startDate);
  result.setDate(result.getDate() + daysNeeded);
  
  return result;
}

export default function CalendarPlanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isViewEventOpen, setIsViewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ProjectEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<ProjectEvent>>({
    title: '',
    description: '',
    date: new Date(),
    completed: false,
    timeEstimate: 30
  });
  const [dailyCrochetTime, setDailyCrochetTime] = useState<number>(60); // Default 60 minutes per day
  
  // Fetch events from the server
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['projectEvents'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/project-events');
        return response.json();
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Failed to Load Events",
          description: "There was an error loading your project events.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Fetch patterns for linking to events
  const { data: patterns = [] } = useQuery({
    queryKey: ['patterns'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/patterns');
        return response.json();
      } catch (error) {
        console.error('Error fetching patterns:', error);
        return [];
      }
    }
  });

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (eventData: Partial<ProjectEvent>) => {
      const res = await apiRequest('POST', '/api/project-events', eventData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectEvents'] });
      setIsAddEventOpen(false);
      resetNewEvent();
      toast({
        title: "Event Added",
        description: "Your project event has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Event",
        description: "There was an error adding your event.",
        variant: "destructive",
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: ProjectEvent) => {
      const res = await apiRequest('PUT', `/api/project-events/${eventData.id}`, eventData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectEvents'] });
      setIsViewEventOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Event Updated",
        description: "Your project event has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Update Event",
        description: "There was an error updating your event.",
        variant: "destructive",
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/project-events/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectEvents'] });
      setIsViewEventOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Event Deleted",
        description: "Your project event has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "There was an error removing your event.",
        variant: "destructive",
      });
    }
  });

  // Filter events by selected date
  const getEventsForDate = (date: Date | undefined) => {
    if (!date || !events.length) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return events.filter((event: ProjectEvent) => {
      const eventDate = new Date(event.date);
      return eventDate.toISOString().split('T')[0] === dateString;
    });
  };

  // Reset new event form
  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      description: '',
      date: date || new Date(),
      completed: false,
      timeEstimate: 30
    });
  };

  // Handle selecting a pattern for the event
  const handlePatternSelect = (patternId: string) => {
    const selectedPattern = patterns.find((p: Pattern) => p.id === patternId);
    if (selectedPattern) {
      const timeEstimate = calculateTimeEstimate(selectedPattern);
      setNewEvent({
        ...newEvent,
        patternId,
        patternTitle: selectedPattern.title,
        timeEstimate
      });
    }
  };

  // Handle adding a new event
  const handleAddEvent = () => {
    if (!newEvent.title) {
      toast({
        title: "Title Required",
        description: "Please provide a title for your event.",
        variant: "destructive"
      });
      return;
    }
    
    addEventMutation.mutate(newEvent as ProjectEvent);
  };

  // Handle viewing an event
  const handleViewEvent = (event: ProjectEvent) => {
    setSelectedEvent(event);
    setIsViewEventOpen(true);
  };

  // Handle updating an event
  const handleUpdateEvent = () => {
    if (selectedEvent) {
      updateEventMutation.mutate(selectedEvent as ProjectEvent);
    }
  };

  // Handle toggling event completion
  const handleToggleComplete = (event: ProjectEvent) => {
    const updatedEvent = { ...event, completed: !event.completed };
    updateEventMutation.mutate(updatedEvent);
  };

  // Calculate the expected completion date based on time estimate and daily crochet time
  const getCompletionDateMessage = (timeEstimate: number | undefined) => {
    if (!timeEstimate) return "No time estimate available";
    
    const completionDate = calculateCompletionDate(
      new Date(), 
      timeEstimate, 
      dailyCrochetTime
    );
    
    return `Expected completion: ${completionDate.toLocaleDateString()}`;
  };

  // Events for the selected date
  const selectedDateEvents = getEventsForDate(date);

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar and Settings */}
        <div className="lg:w-1/2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-secondary-600 font-heading flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
              Project Planner
            </h2>
            <Button 
              onClick={() => {
                resetNewEvent();
                setIsAddEventOpen(true);
              }}
              className="shrink-0"
            >
              <PlusCircle className="h-5 w-5 mr-1" /> Add Event
            </Button>
          </div>

          {/* Daily crochet time setting */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <Label htmlFor="dailyCrochetTime" className="text-sm font-medium text-gray-700 mb-2 block">
              Daily Crochet Time (minutes)
            </Label>
            <div className="flex gap-2">
              <Input
                id="dailyCrochetTime"
                type="number"
                min="5"
                max="480"
                value={dailyCrochetTime}
                onChange={(e) => setDailyCrochetTime(parseInt(e.target.value) || 60)}
                className="w-32"
              />
              <Button variant="outline" onClick={() => setDailyCrochetTime(30)}>30m</Button>
              <Button variant="outline" onClick={() => setDailyCrochetTime(60)}>1h</Button>
              <Button variant="outline" onClick={() => setDailyCrochetTime(120)}>2h</Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This helps estimate when your projects will be completed.
            </p>
          </div>

          {/* Calendar component */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>

        {/* Events for selected date */}
        <div className="lg:w-1/2">
          <h3 className="text-lg font-medium mb-4">
            {date ? date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : "Select a date"}
          </h3>
          
          {eventsLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : selectedDateEvents.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
              <Clock className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No events scheduled for this date.</p>
              <Button onClick={() => {
                resetNewEvent();
                setIsAddEventOpen(true);
              }} variant="outline" className="mt-4">
                <PlusCircle className="h-4 w-4 mr-1" /> Add Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateEvents.map((event: ProjectEvent) => (
                <Card 
                  key={event.id} 
                  className={`cursor-pointer transition-shadow hover:shadow-md ${
                    event.completed ? 'bg-gray-50 border-gray-200' : 'border-primary/20'
                  }`}
                  onClick={() => handleViewEvent(event)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className={`text-lg ${event.completed ? 'text-gray-500 line-through' : ''}`}>
                        {event.title}
                      </CardTitle>
                      <div 
                        className={`h-3 w-3 rounded-full ${event.completed ? 'bg-green-500' : 'bg-amber-500'}`}
                        title={event.completed ? 'Completed' : 'In Progress'}
                      ></div>
                    </div>
                    {event.patternTitle && (
                      <CardDescription>
                        Pattern: {event.patternTitle}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {event.timeEstimate && (
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{formatTimeEstimate(event.timeEstimate)}</span>
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-700 line-clamp-2">{event.description}</p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-gray-500">
                    {event.timeEstimate && getCompletionDateMessage(event.timeEstimate)}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Project Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Complete the hat brim..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pattern">Link to Pattern (Optional)</Label>
              <Select 
                onValueChange={handlePatternSelect}
                value={newEvent.patternId}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date instanceof Date 
                    ? newEvent.date.toISOString().split('T')[0] 
                    : new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timeEstimate">Time Estimate (minutes)</Label>
                <Input
                  id="timeEstimate"
                  type="number"
                  min="1"
                  value={newEvent.timeEstimate}
                  onChange={(e) => setNewEvent({ ...newEvent, timeEstimate: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Add any notes or details about this task..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEvent}>Save Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Event Dialog */}
      <Dialog open={isViewEventOpen} onOpenChange={setIsViewEventOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Project Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                />
              </div>
              {selectedEvent.patternTitle && (
                <div className="grid gap-2">
                  <Label>Pattern</Label>
                  <div className="px-3 py-2 rounded-md bg-gray-50 text-gray-700">
                    {selectedEvent.patternTitle}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editDate">Date</Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={
                      selectedEvent.date instanceof Date 
                        ? selectedEvent.date.toISOString().split('T')[0] 
                        : new Date(selectedEvent.date).toISOString().split('T')[0]
                    }
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, date: new Date(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editTimeEstimate">Time Est. (minutes)</Label>
                  <Input
                    id="editTimeEstimate"
                    type="number"
                    min="1"
                    value={selectedEvent.timeEstimate}
                    onChange={(e) => setSelectedEvent({ 
                      ...selectedEvent, 
                      timeEstimate: parseInt(e.target.value) || 30 
                    })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={selectedEvent.description}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="completed"
                  checked={selectedEvent.completed}
                  onChange={() => setSelectedEvent({ 
                    ...selectedEvent, 
                    completed: !selectedEvent.completed 
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="completed" className="text-sm font-medium text-gray-700">
                  Mark as completed
                </Label>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => deleteEventMutation.mutate(selectedEvent?.id as string)}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsViewEventOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateEvent}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}