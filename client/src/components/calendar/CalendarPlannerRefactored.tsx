import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Pattern, ProjectEvent, ViewType } from "../../lib/types";
import { formatDateForDisplay, formatDateForInput } from "../../lib/dateUtils";
import { 
  calculateTimeEstimate, 
  calculateCompletionDate, 
  getEventsForDate, 
  isWeekend
} from "../../lib/patternUtils";

// Component imports
import CrochetTimeSlider from "./CrochetTimeSlider";
import DayAvailabilityManager from "./DayAvailabilityManager";
import EventsList from "./EventsList";
import ActiveProjectsDialog from "./ActiveProjectsDialog";
import AddEditEventDialog from "./AddEditEventDialog";

interface CalendarPlannerProps {
  onNavigate?: (view: ViewType) => void;
}

/**
 * Calendar planning component for scheduling crochet projects
 */
const CalendarPlannerRefactored: React.FC<CalendarPlannerProps> = (props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
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
  
  // Queries
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
  
  // Mutations
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
  
  // Memoized values
  const selectedDateEvents = useMemo(() => 
    getEventsForDate(events, date), 
    [events, date]
  );
  
  // Helper functions
  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      description: '',
      date: date || new Date(),
      completed: false,
      timeEstimate: 30
    });
  };
  
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
  
  const handleViewEvent = (event: ProjectEvent) => {
    setSelectedEvent(event);
    setIsViewEventOpen(true);
  };
  
  const handleUpdateEvent = () => {
    if (selectedEvent) {
      updateEventMutation.mutate(selectedEvent as ProjectEvent);
    }
  };
  
  const getCompletionDateMessage = (timeEstimate: number | undefined) => {
    if (!timeEstimate) return "No time estimate available";
    
    const completionDate = calculateCompletionDate(
      new Date(), 
      timeEstimate, 
      dailyCrochetTime,
      dayAvailability
    );
    
    return `Expected completion: ${formatDateForDisplay(completionDate)}`;
  };
  
  const toggleDayAvailability = (date: Date) => {
    if (!date) return;
    
    // Create a consistent date string format
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
  
  const getDayAvailability = (date: Date): 'blocked' | 'half' | 'full' => {
    if (!date) return 'full';
    
    // Create a consistent date string format
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
  
  const handleAutoFillCalendar = () => {
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
  };
  
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
          <CrochetTimeSlider 
            dailyCrochetTime={dailyCrochetTime} 
            onTimeChange={setDailyCrochetTime} 
          />

          {/* Calendar with day availability management */}
          <DayAvailabilityManager
            date={date}
            setDate={setDate}
            dayAvailability={dayAvailability}
            toggleDayAvailability={toggleDayAvailability}
            getDayAvailability={getDayAvailability}
          />
        </div>

        {/* Events for selected date */}
        <div className="lg:w-1/2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {date ? formatDateForDisplay(date) : "Select a date"}
            </h3>
            
            {/* Active projects dialog */}
            <ActiveProjectsDialog
              patterns={patterns}
              activeProjects={activeProjects}
              setActiveProjects={setActiveProjects}
              onNavigate={props.onNavigate}
              onAutoFill={handleAutoFillCalendar}
            />
          </div>
          
          {/* Events list */}
          <EventsList
            date={date}
            events={selectedDateEvents}
            loading={eventsLoading}
            onAddEvent={() => {
              resetNewEvent();
              setIsAddEventOpen(true);
            }}
            onViewEvent={handleViewEvent}
            getCompletionDateMessage={getCompletionDateMessage}
          />
        </div>
      </div>

      {/* Add Event Dialog */}
      <AddEditEventDialog
        mode="add"
        isOpen={isAddEventOpen}
        onOpenChange={setIsAddEventOpen}
        eventData={newEvent}
        setEventData={setNewEvent}
        patterns={patterns}
        onPatternSelect={handlePatternSelect}
        onSave={handleAddEvent}
      />

      {/* View/Edit Event Dialog */}
      <AddEditEventDialog
        mode="edit"
        isOpen={isViewEventOpen}
        onOpenChange={setIsViewEventOpen}
        eventData={selectedEvent}
        setEventData={setSelectedEvent}
        patterns={patterns}
        onPatternSelect={handlePatternSelect}
        onSave={handleUpdateEvent}
        onDelete={() => deleteEventMutation.mutate(selectedEvent?.id as string)}
      />
    </div>
  );
};

export default CalendarPlannerRefactored;