import React from 'react';

/**
 * Component to display a visual legend for day availability statuses
 */
const DayAvailabilityLegend: React.FC = () => {
  return (
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
      <p className="text-xs mt-2 text-gray-500">
        Click on a day to toggle: Full Day → Half Day → Not Available → Full Day
      </p>
    </div>
  );
};

export default DayAvailabilityLegend;