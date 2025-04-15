import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { ProjectEvent } from "../../lib/types";
import { formatTimeEstimate } from "../../lib/dateUtils";

interface EventCardProps {
  event: ProjectEvent;
  onEventClick: (event: ProjectEvent) => void;
  getCompletionDateMessage: (timeEstimate: number | undefined) => string;
}

/**
 * Card component to display a single project event in the calendar
 */
const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onEventClick, 
  getCompletionDateMessage 
}) => {
  return (
    <Card 
      key={event.id} 
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        event.completed ? 'bg-gray-50 border-gray-200' : 'border-primary/20'
      }`}
      onClick={() => onEventClick(event)}
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
  );
};

export default EventCard;