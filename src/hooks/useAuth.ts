import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Here you would typically check for an existing session or token
    // and fetch the user data from your authentication service
    const checkAuth = async () => {
      try {
        // For now, we'll use mock data. Replace this with your actual auth logic
        const mockUser = {
          id: '123', // This should come from your actual auth system
          email: 'user@example.com',
          name: 'John Doe'
        };
        setUser(mockUser);
      } catch (error) {
        console.error('Auth error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user
  };
}; 