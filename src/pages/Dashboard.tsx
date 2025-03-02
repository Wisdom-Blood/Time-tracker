import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, Target, Award } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import WeeklyWorkingTimeTable from '../components/dashboard/WeeklyWorkingTimeTable';
import EarningChart from '../components/dashboard/EarningChart';
import { WeeklyBidStats } from '../components/dashboard/WeeklyBidStats';
import { startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';

interface WorkingTimeData {
  userId: number;
  userName: string;
  weeklyHours: {
    [key: string]: number | null;
  };
  totalHours: number;
}

interface DayStats {
  sent: number;
  chat: number;
  offer: number;
}

interface DashboardStats {
  totalUsers: number;
  monthlyPlan: number;
  monthlyProgress: number;
  totalEarnings: number;
  topUser: {
    name: string;
    amount: number;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workingTimeData, setWorkingTimeData] = useState<WorkingTimeData[]>([]);
  const [earningData, setEarningData] = useState([]);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [bidStats, setBidStats] = useState<BidStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    monthlyPlan: 0,
    monthlyProgress: 0,
    totalEarnings: 0,
    topUser: {
      name: 'N/A',
      amount: 0
    }
  });

  // Calculate week dates
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start from Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchBidStats = async (date: Date) => {
    try {
      const formattedDate = date.toISOString();
      const response = await axios.get(
        `http://localhost:5000/api/bids/stats/weekly?date=${formattedDate}`,
        { withCredentials: true }
      );
      setBidStats(response.data);
    } catch (err) {
      console.error('Failed to fetch bid stats:', err);
      setError('Failed to load bid statistics');
    }
  };

  const fetchDashboardData = async (date: Date) => {
    try {
      setLoading(true);
      setError('');

      // Format date for the API
      const formattedDate = date.toISOString();
      
      console.log('Fetching data for date:', formattedDate);
      
      const workingTimeRes = await axios.get(
        `http://localhost:5000/api/reports/weekly?date=${formattedDate}`,
        { withCredentials: true }
      );
      setWorkingTimeData(workingTimeRes.data);

      // Fetch bid stats
      await fetchBidStats(date);

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/transactions/dashboard-stats/${currentYear}/${currentMonth + 1}`,
        { withCredentials: true }
      );
      console.log(res.data);
      setDashboardStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData(currentWeek);
    fetchDashboardStats();
  }, [currentWeek]);

  const handleWeekChange = (date: Date) => {
    setCurrentWeek(date);
  };

  const getStatsForDate = (date: Date, platform: 'freelancer' | 'upwork', userName: string): DayStats => {
    if (!bidStats || !bidStats[platform][userName]) {
      return { sent: 0, chat: 0, offer: 0 };
    }

    const formattedDate = date.toISOString().split('T')[0];
    return bidStats[platform][userName][formattedDate] || { sent: 0, chat: 0, offer: 0 };
  };

  const stats = [
    { 
      icon: Users,
      title: 'Total Users',
      value: dashboardStats.totalUsers.toString(),
      subtitle: 'Active users'
    },
    {
      icon: DollarSign,
      title: 'Monthly Plan',
      value: `$${dashboardStats.monthlyPlan.toLocaleString()}`,
      subtitle: 'Total users plan'
    },
    {
      icon: Target,
      title: 'Current Status',
      value: `${dashboardStats.monthlyProgress}%`,
      subtitle: 'Monthly progress'
    },
    {
      icon: Award,
      title: 'Top Performer',
      value: dashboardStats.topUser.name,
      subtitle: `$${dashboardStats.topUser.amount.toLocaleString()}`
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      {error && (
        <div className="mb-8 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
                {React.createElement(stat.icon, {
                  className: "h-6 w-6 text-blue-600 dark:text-blue-400"
                })}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <WeeklyWorkingTimeTable
            data={workingTimeData}
            loading={loading}
            currentWeek={currentWeek}
            onWeekChange={handleWeekChange}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
            Monthly Earnings
          </h2>
        <EarningChart data={earningData} />
        </div>

      </div>
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
          <WeeklyBidStats
            stats={bidStats}
            weekStart={weekStart}
            weekEnd={weekEnd}
            weekDays={weekDays}
            handlePreviousWeek={() => handleWeekChange(addDays(currentWeek, -7))}
            handleNextWeek={() => handleWeekChange(addDays(currentWeek, 7))}
            getStatsForDate={getStatsForDate}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;