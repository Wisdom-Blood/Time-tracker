export interface UpworkBidData {
  id: string;
  userId: string | number;
  bidDate: string;
  clientName: string;
  country: string;
  totalSpent: number;
  averageHourlyRate: number;
  spentBidAmount: number;
  accountName: string;
  status: 'chat' | 'client_view' | 'offer' | 'reject';
  createdAt: string;
  updatedAt: string;
}

export interface NewUpworkBidData {
  bidDate: string;
  clientName: string;
  country: string;
  totalSpent: number;
  averageHourlyRate: number;
  spentBidAmount: number;
  accountName: string;
  status: 'chat' | 'client_view' | 'offer' | 'reject';
}

export interface Country {
  code: string;
  flag: string;
  name: string;
}

export class UpworkBidService {
  private static API_URL = 'http://localhost:5000/api/upwork';

  static async getBids(id: string): Promise<UpworkBidData[]> {
    try {
      const response = await fetch(`${this.API_URL}/upwork_bids/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching bids:', error);
      throw error;
    }
  }

  static async createBid(bid: NewUpworkBidData): Promise<UpworkBidData> {
    try {
      const response = await fetch(`${this.API_URL}/upwork_bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bid),
      });
      if (!response.ok) {
        throw new Error('Failed to create bid');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating bid:', error);
      throw error;
    }
  }

  static async updateBid(id: string, bid: NewUpworkBidData): Promise<UpworkBidData> {
    try {
      const response = await fetch(`${this.API_URL}/upwork_bids/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bid),
      });
      if (!response.ok) {
        throw new Error('Failed to update bid');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating bid:', error);
      throw error;
    }
  }

  static async deleteBid(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_URL}/upwork_bids/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete bid');
      }
    } catch (error) {
      console.error('Error deleting bid:', error);
      throw error;
    }
  }

  static async getCountries(): Promise<Country[]> {
    try {
      const response = await fetch(`${this.API_URL}/countries`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }
} 