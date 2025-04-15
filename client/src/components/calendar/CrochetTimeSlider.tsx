import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CrochetTimeSliderProps {
  dailyCrochetTime: number;
  onTimeChange: (minutes: number) => void;
}

/**
 * Component for selecting daily crochet time with slider and preset buttons
 */
const CrochetTimeSlider: React.FC<CrochetTimeSliderProps> = ({ 
  dailyCrochetTime, 
  onTimeChange 
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <Label 
        htmlFor="dailyCrochetTimeHours" 
        className="text-sm font-medium text-gray-700 mb-2 block"
      >
        Daily Crochet Time: {dailyCrochetTime / 60} hours
      </Label>
      <input
        id="dailyCrochetTimeHours"
        type="range"
        min="60"
        max="600"
        step="30"
        value={dailyCrochetTime}
        onChange={(e) => onTimeChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>1 hour</span>
        <span>5 hours</span>
        <span>10 hours</span>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={() => onTimeChange(60)}>1h</Button>
        <Button variant="outline" size="sm" onClick={() => onTimeChange(120)}>2h</Button>
        <Button variant="outline" size="sm" onClick={() => onTimeChange(180)}>3h</Button>
        <Button variant="outline" size="sm" onClick={() => onTimeChange(300)}>5h</Button>
        <Button variant="outline" size="sm" onClick={() => onTimeChange(480)}>8h</Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Set your typical daily crochet time to estimate project completion dates.
      </p>
    </div>
  );
};

export default CrochetTimeSlider;