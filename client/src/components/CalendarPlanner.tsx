import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';
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
import { 
  CalendarIcon, 
  PlusCircle, 
  Clock, 
  ClipboardList, 
  ChevronUp, 
  ChevronDown, 
  MoveUp, 
  MoveDown 
} from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { Pattern } from '../lib/types';
import { isWeekend, formatTimeEstimate, formatDateForDisplay, isSameDay } from '../lib/dateUtils';

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
  
  // Set default values for undefined properties
  const projectType = pattern.projectType || 'other';
  const speed = CROCHET_SPEEDS[projectType] || CROCHET_SPEEDS.other;
  
  // Count total steps - with extensive null checking
  let totalSteps = 0;
  if (pattern.sections && Array.isArray(pattern.sections)) {
    pattern.sections.forEach(section => {
      if (section && section.steps && Array.isArray(section.steps)) {
        totalSteps += section.steps.length;
      }
    });
  }
  
  // Ensure at least some estimated time even if no steps are defined
  const minTime = 60; // 1 hour minimum
  
  // Base time: 30 min per step (simplified model)
  let baseTime = Math.max(totalSteps * 30, minTime);
  
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

// Using formatTimeEstimate from dateUtils.ts instead of local implementation

// Calculate completion date based on time estimate and daily crochet time
function calculateCompletionDate(
  startDate: Date, 
  timeEstimate: number, 
  dailyCrochetTime: number,
  dayAvailabilityMap?: Record<string, 'blocked' | 'half' | 'full'>
): Date {
  // If no daily time set, assume it takes one day
  if (!dailyCrochetTime || dailyCrochetTime <= 0) {
    const result = new Date(startDate);
    result.setDate(result.getDate() + 1);
    return result;
  }
  
  // Track remaining minutes
  let remainingMinutes = timeEstimate;
  
  // Clone start date to use as current position
  const currentDate = new Date(startDate);
  let completionDate = new Date(startDate);
  
  // Loop until all time is accounted for
  while (remainingMinutes > 0) {
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Determine available time based on day and availability settings
    let availableMinutes = dailyCrochetTime;
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if we have explicit availability settings for this day
    if (dayAvailabilityMap && dateStr in dayAvailabilityMap) {
      const availability = dayAvailabilityMap[dateStr];
      
      if (availability === 'blocked') {
        availableMinutes = 0;
      } else if (availability === 'half') {
        availableMinutes = Math.floor(dailyCrochetTime / 2);
      }
    } else {
      // If not explicitly set, check if it's a weekend
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = Sunday, 6 = Saturday
        availableMinutes = 0; // Weekends blocked by default
      }
    }
    
    // Subtract available time from remaining work
    if (availableMinutes > 0) {
      remainingMinutes -= availableMinutes;
      
      // Update completion date if progress was made
      if (remainingMinutes <= 0) {
        completionDate = new Date(currentDate);
      }
    }
  }
  
  return completionDate;
}

interface CalendarPlannerProps {
  onNavigate?: (view: 'input' | 'viewer' | 'library' | 'stash' | 'calendar') => void;
}

export default function CalendarPlanner(props: CalendarPlannerProps = {}) {
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
  const [dailyCrochetTime, setDailyCrochetTime] = useState<number>(120); // Default 2 hours per day
  const [dayAvailability, setDayAvailability] = useState<Record<string, 'blocked' | 'half' | 'full'>>({});
  const [activeProjects, setActiveProjects] = useState<Array<Pattern & { priority: number }>>([]);
  
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
      dailyCrochetTime,
      dayAvailability // Pass the day availability map for accurate estimates
    );
    
    return `Expected completion: ${formatDateForDisplay(completionDate)}`;
  };

  // Helper function to toggle day availability
  const toggleDayAvailability = (date: Date) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const currentStatus = dayAvailability[dateStr] || 'full';
    
    // Cycle through: full -> half -> blocked -> full
    let newStatus: 'full' | 'half' | 'blocked';
    if (currentStatus === 'full') {
      newStatus = 'half';
    } else if (currentStatus === 'half') {
      newStatus = 'blocked';
    } else {
      newStatus = 'full';
    }
    
    setDayAvailability({
      ...dayAvailability,
      [dateStr]: newStatus
    });
  };
  
  // Using isWeekend from dateUtils.ts instead of local implementation
  
  // Determine the availability status for a date
  const getDayAvailability = (date: Date): 'blocked' | 'half' | 'full' => {
    if (!date) return 'full';
    
    const dateStr = date.toISOString().split('T')[0];
    
    // If explicitly set in state, use that
    if (dateStr in dayAvailability) {
      return dayAvailability[dateStr];
    }
    
    // Default weekends to blocked unless overridden
    if (isWeekend(date)) {
      return 'blocked';
    }
    
    return 'full';
  };
  
  // Get effective crochet time for a date based on availability
  const getEffectiveCrochetTime = (date: Date): number => {
    const availability = getDayAvailability(date);
    
    switch (availability) {
      case 'full':
        return dailyCrochetTime;
      case 'half':
        return Math.floor(dailyCrochetTime / 2);
      case 'blocked':
        return 0;
      default:
        return dailyCrochetTime;
    }
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
            <Label htmlFor="dailyCrochetTimeHours" className="text-sm font-medium text-gray-700 mb-2 block">
              Daily Crochet Time: {dailyCrochetTime / 60} hours
            </Label>
            <input
              id="dailyCrochetTimeHours"
              type="range"
              min="60"
              max="600"
              step="30"
              value={dailyCrochetTime}
              onChange={(e) => setDailyCrochetTime(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1 hour</span>
              <span>5 hours</span>
              <span>10 hours</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setDailyCrochetTime(60)}>1h</Button>
              <Button variant="outline" size="sm" onClick={() => setDailyCrochetTime(120)}>2h</Button>
              <Button variant="outline" size="sm" onClick={() => setDailyCrochetTime(180)}>3h</Button>
              <Button variant="outline" size="sm" onClick={() => setDailyCrochetTime(300)}>5h</Button>
              <Button variant="outline" size="sm" onClick={() => setDailyCrochetTime(480)}>8h</Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Set your typical daily crochet time to estimate project completion dates.
            </p>
          </div>

          {/* Calendar component */}
          <div className="mb-2 bg-gray-50 p-3 rounded-lg text-sm">
            <div className="flex justify-start items-center gap-x-4 gap-y-1 flex-wrap">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-1"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded mr-1"></div>
                <span className="text-gray-600">Half Day</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 border border-gray-300 rounded mr-1"></div>
                <span className="text-gray-600">Not Available</span>
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-500">Click on a day to toggle: Full Day → Half Day → Not Available → Full Day</p>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiersClassNames={{
              selected: 'bg-primary text-primary-foreground',
            }}
            modifiers={{
              blocked: (date) => getDayAvailability(date) === 'blocked',
              half: (date) => getDayAvailability(date) === 'half',
            }}
            modifiersStyles={{
              blocked: { backgroundColor: 'rgba(156, 163, 175, 0.7)', color: '#fff', opacity: '0.8' },
              half: { backgroundColor: 'rgba(229, 231, 235, 0.7)', color: '#374151' },
            }}
            className="rounded-md border"
            onDayClick={(day) => {
              // Toggle day availability on click
              toggleDayAvailability(day);
            }}
          />
        </div>

        {/* Events for selected date */}
        <div className="lg:w-1/2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {date ? formatDateForDisplay(date) : "Select a date"}
            </h3>
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
                          // Use consistent navigation pattern with App's navigateToView
                          if (typeof props.onNavigate === 'function') {
                            props.onNavigate('library');
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
                  <Button type="button" onClick={() => {
                    // Auto-fill calendar functionality
                    if (activeProjects.length === 0) {
                      toast({
                        title: "No Active Projects",
                        description: "Please select at least one project to add to your calendar.",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    // Sort by priority (lower number = higher priority)
                    const sortedProjects = [...activeProjects].sort((a, b) => a.priority - b.priority);
                    
                    // Starting from tomorrow
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() + 1);
                    
                    // Schedule each project
                    const newEvents: Partial<ProjectEvent>[] = [];
                    
                    // Track the current date for scheduling
                    let currentDate = new Date(startDate);
                    
                    // For each project, create events based on pattern sections
                    for (const project of sortedProjects) {
                      if (project.sections && project.sections.length > 0) {
                        // Calculate total time estimate for pattern
                        const totalTimeEstimate = calculateTimeEstimate(project);
                        
                        // Add a main project event
                        newEvents.push({
                          title: `Start ${project.title}`,
                          patternId: project.id,
                          patternTitle: project.title,
                          date: new Date(currentDate),
                          timeEstimate: totalTimeEstimate,
                          completed: false,
                          description: `Begin working on ${project.title}`
                        });
                        
                        // Advance the date based on time estimate and daily availability
                        currentDate = calculateCompletionDate(
                          currentDate,
                          totalTimeEstimate,
                          dailyCrochetTime,
                          dayAvailability
                        );
                        
                        // Add buffer day
                        currentDate.setDate(currentDate.getDate() + 1);
                      }
                    }
                    
                    // Batch add all new events
                    const addAllEvents = async () => {
                      for (const eventData of newEvents) {
                        try {
                          await apiRequest('POST', '/api/project-events', eventData);
                        } catch (error) {
                          console.error('Error adding event:', error);
                        }
                      }
                      
                      // Refresh events list
                      queryClient.invalidateQueries({ queryKey: ['projectEvents'] });
                      
                      toast({
                        title: "Calendar Auto-Filled",
                        description: `Added ${newEvents.length} events to your calendar based on project priorities.`,
                      });
                    };
                    
                    addAllEvents();
                  }}>
                    Auto-Fill Calendar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
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