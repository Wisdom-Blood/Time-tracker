import React, { useState } from 'react';
import { format, subWeeks, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';

interface DayStats {
  sent: number;
  chat: number;
  offer: number;
}

interface PlatformStats {
  [userName: string]: {
    [date: string]: DayStats;
  };
}

interface Stats {
  freelancer: PlatformStats;
  upwork: PlatformStats;
}

interface WeeklyBidStatsProps {
  stats: Stats | null;
  weekStart: Date;
  weekEnd: Date;
  weekDays: Date[];
  handlePreviousWeek: () => void;
  handleNextWeek: () => void;
  getStatsForDate: (date: Date, platform: 'freelancer' | 'upwork', userName: string) => DayStats;
}

const formatValue = (value: number): string => {
  return value === 0 ? '-' : value.toString();
};

const getChatClassName = (value: number): string => {
  const baseClass = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm";
  return value === 0 
    ? `${baseClass} text-gray-500 dark:text-gray-400` 
    : `${baseClass} text-green-600 dark:text-green-400 font-medium`;
};

const getOfferClassName = (value: number): string => {
  const baseClass = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm";
  return value === 0 
    ? `${baseClass} text-gray-500 dark:text-gray-400` 
    : `${baseClass} text-red-600 dark:text-red-400 font-medium`;
};

export const WeeklyBidStats: React.FC<WeeklyBidStatsProps> = ({
  stats,
  weekStart,
  weekEnd,
  weekDays,
  handlePreviousWeek,
  handleNextWeek,
  getStatsForDate,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleQuickSelect = (weeks: number) => {
    const newDate = subWeeks(new Date(), weeks);
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
    handlePreviousWeek();
    setIsDropdownOpen(false);
  };

  const renderTable = (platform: 'freelancer' | 'upwork', title: string) => {
    const users = stats ? Object.keys(stats[platform]).sort() : [];
    
    return (
      <div className="mb-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {title}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
              Weekly Report
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Quick Select
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleQuickSelect(1)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Last Week
                    </button>
                    <button
                      onClick={() => handleQuickSelect(2)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      2 Weeks Ago
                    </button>
                    <button
                      onClick={() => handleQuickSelect(4)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      1 Month Ago
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
              <button
                onClick={handlePreviousWeek}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              <div className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white border-l border-r border-gray-200 dark:border-gray-700">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </div>
              <button
                onClick={handleNextWeek}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-600">
            <thead>
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2"></th>
                {weekDays.map((day: Date) => (
                  <th key={day.toISOString()} colSpan={3} className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">
                    {format(day, 'EEE').toUpperCase()} ({format(day, 'd')})
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Name
                </th>
                {weekDays.map((day: Date) => (
                  <React.Fragment key={day.toISOString()}>
                    <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Sent</th>
                    <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Chat</th>
                    <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Offer</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
              {users.map((userName) => (
                <tr key={userName} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {userName}
                  </td>
                  {weekDays.map((day: Date) => {
                    const dayStats = getStatsForDate(day, platform, userName);
                    return (
                      <React.Fragment key={day.toISOString()}>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                          {formatValue(dayStats.sent)}
                        </td>
                        <td className={getChatClassName(dayStats.chat)}>
                          {formatValue(dayStats.chat)}
                        </td>
                        <td className={getOfferClassName(dayStats.offer)}>
                          {formatValue(dayStats.offer)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={22} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderTable('freelancer', 'Freelancer Bid History')}
      {renderTable('upwork', 'Upwork Bid History')}
    </div>
  );
}; 