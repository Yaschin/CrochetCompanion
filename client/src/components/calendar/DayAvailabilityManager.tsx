import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { isWeekend } from "../../lib/patternUtils";
import DayAvailabilityLegend from "./DayAvailabilityLegend";

interface DayAvailabilityManagerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  dayAvailability: Record<string, 'blocked' | 'half' | 'full'>;
  toggleDayAvailability: (date: Date) => void;
  getDayAvailability: (date: Date) => 'blocked' | 'half' | 'full';
}

/**
 * Component for managing day availability with calendar
 */
const DayAvailabilityManager: React.FC<DayAvailabilityManagerProps> = ({
  date,
  setDate,
  dayAvailability,
  toggleDayAvailability,
  getDayAvailability
}) => {
  return (
    <>
      <DayAvailabilityLegend />
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
    </>
  );
};

export default DayAvailabilityManager;