interface WeeklyStats {
  sent: number;
  chat: number;
  offer: number;
}

interface UserStats {
  [date: string]: WeeklyStats;
}

interface PlatformStats {
  [userName: string]: UserStats;
}

interface WeeklyBidStats {
  freelancer: PlatformStats;
  upwork: PlatformStats;
}

export class DashboardService {
  private static API_URL = 'http://localhost:5000/api/dashboard';

  static async getWeeklyBidStats(startDate: string, endDate: string): Promise<WeeklyBidStats> {
    try {
      const response = await fetch(
        `${this.API_URL}/weekly-bids?startDate=${startDate}&endDate=${endDate}`,
        {
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly bid statistics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weekly bid statistics:', error);
      throw error;
    }
  }
} 