import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock, PlusCircle } from "lucide-react";
import { ProjectEvent } from "../../lib/types";
import EventCard from "./EventCard";

interface EventsListProps {
  date: Date | undefined;
  events: ProjectEvent[];
  loading: boolean;
  onAddEvent: () => void;
  onViewEvent: (event: ProjectEvent) => void;
  getCompletionDateMessage: (timeEstimate: number | undefined) => string;
}

/**
 * Component to display a list of events for a selected date
 */
const EventsList: React.FC<EventsListProps> = ({
  date,
  events,
  loading,
  onAddEvent,
  onViewEvent,
  getCompletionDateMessage
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
        <Clock className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">No events scheduled for this date.</p>
        <Button onClick={onAddEvent} variant="outline" className="mt-4">
          <PlusCircle className="h-4 w-4 mr-1" /> Add Event
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {events.map((event: ProjectEvent) => (
        <EventCard
          key={event.id}
          event={event}
          onEventClick={onViewEvent}
          getCompletionDateMessage={getCompletionDateMessage}
        />
      ))}
    </div>
  );
};

export default EventsList;