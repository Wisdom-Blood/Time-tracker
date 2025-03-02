export interface BidData {
  id: string;
  userId: string | number;
  skill: string;
  bidNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewBidData {
  skill: string;
  bidNumber: number;
  updatedAt?: string;
}

export interface ChatData {
  id: string;
  userId: string | number;
  projectTitle: string;
  clientName: string;
  clientCountry: string;
  review: number;
  reviewNumber: number;
  spentMoney: number;
  isAwarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewChatData {
  projectTitle: string;
  clientName: string;
  clientCountry: string;
  review: number;
  reviewNumber: number;
  spentMoney: number;
  isAwarded: boolean;
}

export interface Country {
  code: string;
  flag: string;
  name: string;
}

export class FreelancerBidService {
  private static API_URL = 'http://localhost:5000/api/freelancer';

  // Bid operations
  static async getBids(id: string | number): Promise<BidData[]> {
    try {
      const response = await fetch(`${this.API_URL}/freelancer_bids/${id}`, {
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

  static async createBid(bid: NewBidData): Promise<BidData> {
    try {
      const response = await fetch(`${this.API_URL}/freelancer_bids`, {
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

  static async updateBid(id: string, bid: NewBidData): Promise<BidData> {
    try {
      const response = await fetch(`${this.API_URL}/freelancer_bids/${id}`, {
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
      const response = await fetch(`${this.API_URL}/freelancer_bids/${id}`, {
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

  // Chat operations
  static async getChats(id: string | number): Promise<ChatData[]> {
    try {
      const response = await fetch(`${this.API_URL}/freelancer_chat/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  static async createChat(chat: NewChatData): Promise<ChatData> {
    try {
      const response = await fetch(`${this.API_URL}/freelancer_chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(chat),
      });
      if (!response.ok) {
        throw new Error('Failed to create chat');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  static async updateChat(id: string, chat: ChatData): Promise<ChatData> {
    try {
      const response = await fetch(`${this.API_URL}/freelancer_chat/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(chat),
      });
      if (!response.ok) {
        throw new Error('Failed to update chat');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating chat:', error);
      throw error;
    }
  }

  static async deleteChat(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_URL}/freelancer_chat/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  // Countries with flags
  static async getCountries(): Promise<Country[]> {
    try {
      console.log('Fetching countries from:', `${this.API_URL}/countries`);
      const response = await fetch(`${this.API_URL}/countries`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch countries. Status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to fetch countries: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Countries data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }
} 