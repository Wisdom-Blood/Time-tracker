import { useState, useEffect, useRef } from 'react';
import { BidData, ChatData, NewBidData, NewChatData, FreelancerBidService, Country } from '../services/freelancerBidService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BidFormModal from '../components/modals/BidFormModal';
import ChatFormModal from '../components/modals/ChatFormModal';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';
import Notification from '../components/Notification';
import DatePicker from '../components/DatePicker';
import { Filter, Plus, Pencil, Trash2, Calendar } from 'lucide-react';

interface NotificationState {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

interface FilterState {
  skill: string;
  minBidNumber: string;
  maxBidNumber: string;
  dateFrom: string;
  dateTo: string;
  projectTitle: string;
  clientName: string;
  minReview: string;
  minReviewNumber: string;
  minSpentMoney: string;
  isAwarded: string;
  chatDateFrom: string;
  chatDateTo: string;
  clientCountry: string;
}

const FreelancerBidHistory = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'bid' | 'chat'>('bid');
  const [bidData, setBidData] = useState<BidData[]>([]);
  const [chatData, setChatData] = useState<ChatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    skill: '',
    minBidNumber: '',
    maxBidNumber: '',
    dateFrom: '',
    dateTo: '',
    projectTitle: '',
    clientName: '',
    minReview: '',
    minReviewNumber: '',
    minSpentMoney: '',
    isAwarded: '',
    chatDateFrom: '',
    chatDateTo: '',
    clientCountry: ''
  });
  
  // Modal states
  const [isBidFormOpen, setIsBidFormOpen] = useState(false);
  const [isChatFormOpen, setIsChatFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<BidData | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const [deleteType, setDeleteType] = useState<'bid' | 'chat' | null>(null);

  // Animation states
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);
  const [animationType, setAnimationType] = useState<'add' | 'remove' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  // Add new state for filter visibility
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  // Add new state for country dropdown visibility
  const [isCountryDropdownVisible, setIsCountryDropdownVisible] = useState(false);

  // Add state for countries
  const [countries, setCountries] = useState<Country[]>([]);

  // Add state for date objects
  const [dateFromObj, setDateFromObj] = useState<Date | null>(null);
  const [dateToObj, setDateToObj] = useState<Date | null>(null);
  const [chatDateFromObj, setChatDateFromObj] = useState<Date | null>(null);
  const [chatDateToObj, setChatDateToObj] = useState<Date | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) {
          setError('Please log in to view your bid history.');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        const [bids, chats] = await Promise.all([
          FreelancerBidService.getBids(user.id),
          FreelancerBidService.getChats(user.id),
        ]);
        setBidData(bids);
        setChatData(chats);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Add useEffect to fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countriesData = await FreelancerBidService.getCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  // Update useEffect for date initialization
  useEffect(() => {
    if (filters.dateFrom) {
      setDateFromObj(new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      setDateToObj(new Date(filters.dateTo));
    }
    if (filters.chatDateFrom) {
      setChatDateFromObj(new Date(filters.chatDateFrom));
    }
    if (filters.chatDateTo) {
      setChatDateToObj(new Date(filters.chatDateTo));
    }
  }, [filters.dateFrom, filters.dateTo, filters.chatDateFrom, filters.chatDateTo]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      message,
      type,
      isVisible: true,
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Bid handlers
  const handleCreateBid = async (newBid: NewBidData) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const bidWithDates = {
        ...newBid,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const createdBid = await FreelancerBidService.createBid(bidWithDates);
      setBidData([createdBid, ...bidData]);
      setAnimatingItemId(createdBid.id);
      setAnimationType('add');
      timeoutRef.current = setTimeout(() => {
        setAnimatingItemId(null);
        setAnimationType(null);
      }, 300);
      showNotification('Bid created successfully', 'success');
    } catch (error) {
      console.error('Error creating bid:', error);
      showNotification('Failed to create bid', 'error');
    }
  };

  const handleUpdateBid = async (id: string, newBid: NewBidData) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const updatedBid = await FreelancerBidService.updateBid(id, {
        ...newBid,
        updatedAt: new Date().toISOString()
      });
      const updatedBids = bidData.map(b => b.id === id ? updatedBid : b);
      setBidData(updatedBids);
      setSelectedBid(null);
      showNotification('Bid updated successfully', 'success');
    } catch (error) {
      console.error('Error updating bid:', error);
      showNotification('Failed to update bid', 'error');
    }
  };

  // Chat handlers
  const handleCreateChat = async (newChat: NewChatData) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating new chat with data:', newChat);
      const selectedCountry = countries.find(c => c.code === newChat.clientCountry);
      
      if (!selectedCountry) {
        throw new Error('Selected country not found');
      }
      
      const chatWithDates = {
        ...newChat,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientCountry: selectedCountry.code
      };
      
      console.log('Sending to API:', chatWithDates);
      const createdChat = await FreelancerBidService.createChat(chatWithDates);
      console.log('API Response:', createdChat);
      
      setChatData([createdChat, ...chatData]);
      setAnimatingItemId(createdChat.id);
      setAnimationType('add');
      timeoutRef.current = setTimeout(() => {
        setAnimatingItemId(null);
        setAnimationType(null);
      }, 300);
      showNotification('Chat created successfully', 'success');
    } catch (error) {
      console.error('Error creating chat:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        showNotification(`Failed to create chat: ${error.message}`, 'error');
      } else {
        showNotification('Failed to create chat', 'error');
      }
    }
  };

  const handleUpdateChat = async (id: string, newChat: NewChatData) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Updating chat with data:', newChat);
      const selectedCountry = countries.find(c => c.code === newChat.clientCountry);
      
      if (!selectedCountry) {
        throw new Error('Selected country not found');
      }

      const updatedChat = await FreelancerBidService.updateChat(id, {
        ...newChat,
        id,
        userId: user.id,
        createdAt: selectedChat?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientCountry: selectedCountry.code
      });
      console.log('API Response:', updatedChat);
      
      const updatedChats = chatData.map(c => c.id === id ? updatedChat : c);
      setChatData(updatedChats);
      setSelectedChat(null);
      showNotification('Chat updated successfully', 'success');
    } catch (error) {
      console.error('Error updating chat:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        showNotification(`Failed to update chat: ${error.message}`, 'error');
      } else {
        showNotification('Failed to update chat', 'error');
      }
    }
  };

  // Delete handler
  const handleDelete = async () => {
    try {
      if (!selectedBid && !selectedChat || !deleteType) return;

      setAnimatingItemId(selectedBid?.id || selectedChat?.id || '');
      setAnimationType('remove');

      if (deleteType === 'bid') {
        await FreelancerBidService.deleteBid(selectedBid?.id || '');
        timeoutRef.current = setTimeout(() => {
          const updatedBids = bidData.filter(b => b.id !== selectedBid?.id);
          setBidData(updatedBids);
          setAnimatingItemId(null);
          setAnimationType(null);
        }, 300);
      } else {
        await FreelancerBidService.deleteChat(selectedChat?.id || '');
        timeoutRef.current = setTimeout(() => {
          const updatedChats = chatData.filter(c => c.id !== selectedChat?.id);
          setChatData(updatedChats);
          setAnimatingItemId(null);
          setAnimationType(null);
        }, 300);
      }

      setSelectedBid(null);
      setSelectedChat(null);
      setDeleteType(null);
      setIsDeleteModalOpen(false);
      showNotification('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('Failed to delete item', 'error');
    }
  };

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getRowClassName = (id: string) => {
    let className = 'table-row-animate';
    if (id === animatingItemId) {
      if (animationType === 'add') {
        className += ' animate-slide-in-right';
      } else if (animationType === 'remove') {
        className += ' animate-slide-out-left';
      }
    }
    return className;
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-';
      
      // First try to parse the ISO string directly
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) return '-';
      
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const filteredBidData = bidData.filter(bid => {
    const createdDate = new Date(bid.createdAt);
    const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
    
    const dateMatch = (!fromDate || createdDate >= fromDate) && 
                     (!toDate || createdDate <= toDate);

    return (
      bid.skill.toLowerCase().includes(filters.skill.toLowerCase()) &&
      (!filters.minBidNumber || bid.bidNumber >= parseFloat(filters.minBidNumber)) &&
      (!filters.maxBidNumber || bid.bidNumber <= parseFloat(filters.maxBidNumber)) &&
      dateMatch
    );
  });

  const filteredChatData = chatData.filter(chat => {
    const createdDate = new Date(chat.createdAt);
    const fromDate = filters.chatDateFrom ? new Date(filters.chatDateFrom) : null;
    const toDate = filters.chatDateTo ? new Date(filters.chatDateTo) : null;
    
    const dateMatch = (!fromDate || createdDate >= fromDate) && 
                     (!toDate || createdDate <= toDate);
    const reviewMatch = !filters.minReview || chat.review >= parseFloat(filters.minReview);
    const reviewNumberMatch = !filters.minReviewNumber || chat.reviewNumber >= parseInt(filters.minReviewNumber);
    const spentMoneyMatch = !filters.minSpentMoney || chat.spentMoney >= parseFloat(filters.minSpentMoney);
    const awardedMatch = !filters.isAwarded || chat.isAwarded === (filters.isAwarded === 'true');
    const countryMatch = !filters.clientCountry || chat.clientCountry === filters.clientCountry;
    
    return (
      chat.projectTitle.toLowerCase().includes(filters.projectTitle.toLowerCase()) &&
      chat.clientName.toLowerCase().includes(filters.clientName.toLowerCase()) &&
      reviewMatch &&
      reviewNumberMatch &&
      spentMoneyMatch &&
      awardedMatch &&
      dateMatch &&
      countryMatch
    );
  });

  // Add reset filters function
  const resetFilters = () => {
    setFilters({
      skill: '',
      minBidNumber: '',
      maxBidNumber: '',
      dateFrom: '',
      dateTo: '',
      projectTitle: '',
      clientName: '',
      minReview: '',
      minReviewNumber: '',
      minSpentMoney: '',
      isAwarded: '',
      chatDateFrom: '',
      chatDateTo: '',
      clientCountry: ''
    });
  };

  // Add helper function to render flag
  const renderFlag = (flag: string) => {
    if (flag.startsWith('<svg')) {
      return <span dangerouslySetInnerHTML={{ __html: flag }} className="h-4 w-5 flex-shrink-0" />;
    }
    return <img src={flag} alt="" className="h-4 w-5 flex-shrink-0" />;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-center">
          <p className="text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded bg-red-100 dark:bg-red-800 px-4 py-2 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('bid')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'bid'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Bids
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'chat'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Chats
          </button>
        </nav>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </button>
          <button
            onClick={() => {
              setSelectedBid(null);
              setSelectedChat(null);
              activeTab === 'bid' ? setIsBidFormOpen(true) : setIsChatFormOpen(true);
            }}
            className="inline-flex items-center rounded-md bg-blue-600 dark:bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-400"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New {activeTab === 'bid' ? 'Bid' : 'Chat'}
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div 
        className={`mb-6 overflow-hidden transition-all duration-300 ease-in-out ${
          isFilterVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Reset filters
            </button>
          </div>
          {activeTab === 'bid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Skill</label>
                <input
                  type="text"
                  placeholder="Filter by skill"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.skill}
                  onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bid Number Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min bid"
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={filters.minBidNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, minBidNumber: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Max bid"
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={filters.maxBidNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxBidNumber: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Calendar className="w-4 h-4 mr-2 inline" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <DatePicker
                      selectedDate={dateFromObj}
                      onChange={(date) => {
                        setDateFromObj(date);
                        setFilters(prev => ({
                          ...prev,
                          dateFrom: date ? date.toISOString().split('T')[0] : ''
                        }));
                      }}
                      placeholder="Start date"
                      isDark={theme === 'dark'}
                    />
                  </div>
                  <div>
                    <DatePicker
                      selectedDate={dateToObj}
                      onChange={(date) => {
                        setDateToObj(date);
                        setFilters(prev => ({
                          ...prev,
                          dateTo: date ? date.toISOString().split('T')[0] : ''
                        }));
                      }}
                      placeholder="End date"
                      isDark={theme === 'dark'}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Project Title</label>
                <input
                  type="text"
                  placeholder="Filter by project"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.projectTitle}
                  onChange={(e) => setFilters(prev => ({ ...prev, projectTitle: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client Name</label>
                <input
                  type="text"
                  placeholder="Filter by client"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.clientName}
                  onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Review</label>
                <input
                  type="number"
                  placeholder="Min review"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.minReview}
                  onChange={(e) => setFilters(prev => ({ ...prev, minReview: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Review Number</label>
                <input
                  type="number"
                  placeholder="Min number"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.minReviewNumber}
                  onChange={(e) => setFilters(prev => ({ ...prev, minReviewNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Spent Money</label>
                <input
                  type="number"
                  placeholder="Min spent"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.minSpentMoney}
                  onChange={(e) => setFilters(prev => ({ ...prev, minSpentMoney: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Awarded Status</label>
                <select
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 px-4 py-2.5 shadow-sm transition-all duration-200 text-gray-700 dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 hover:border-gray-400 dark:hover:border-gray-500 sm:text-sm bg-white dark:bg-gray-700"
                  value={filters.isAwarded}
                  onChange={(e) => setFilters(prev => ({ ...prev, isAwarded: e.target.value }))}
                >
                  <option value="" className="dark:bg-gray-700">All</option>
                  <option value="true" className="dark:bg-gray-700">Awarded</option>
                  <option value="false" className="dark:bg-gray-700">Not Awarded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownVisible(prev => !prev)}
                    className="relative w-full cursor-pointer rounded-md bg-white dark:bg-gray-700 px-4 py-2.5 text-left border border-gray-300 dark:border-gray-600 shadow-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 sm:text-sm"
                  >
                    <span className="flex items-center">
                      {filters.clientCountry ? (
                        <>
                          {renderFlag(countries.find(c => c.code === filters.clientCountry)?.flag || '')}
                          <span className="ml-2 truncate">
                            {countries.find(c => c.code === filters.clientCountry)?.name || 'All Countries'}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">All Countries</span>
                      )}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </button>

                  {isCountryDropdownVisible && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      <div
                        className="relative cursor-pointer select-none px-4 py-2.5 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-800"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, clientCountry: '' }));
                          setIsCountryDropdownVisible(false);
                        }}
                      >
                        <span className="text-gray-500 dark:text-gray-400">All Countries</span>
                      </div>
                      {countries.map((country) => (
                        <div
                          key={country.code}
                          className={`relative cursor-pointer select-none px-4 py-2.5 transition-colors duration-200 ${
                            filters.clientCountry === country.code ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-blue-50 dark:hover:bg-blue-800'
                          }`}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, clientCountry: country.code }));
                            setIsCountryDropdownVisible(false);
                          }}
                        >
                          <div className="flex items-center">
                            {renderFlag(country.flag)}
                            <span className="ml-2 truncate">{country.name}</span>
                          </div>
                          {filters.clientCountry === country.code && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 dark:text-blue-400">
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chat Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <DatePicker
                      selectedDate={chatDateFromObj}
                      onChange={(date) => {
                        setChatDateFromObj(date);
                        setFilters(prev => ({
                          ...prev,
                          chatDateFrom: date ? date.toISOString().split('T')[0] : ''
                        }));
                      }}
                      placeholder="Start date"
                      isDark={theme === 'dark'}
                    />
                  </div>
                  <div>
                    <DatePicker
                      selectedDate={chatDateToObj}
                      onChange={(date) => {
                        setChatDateToObj(date);
                        setFilters(prev => ({
                          ...prev,
                          chatDateTo: date ? date.toISOString().split('T')[0] : ''
                        }));
                      }}
                      placeholder="End date"
                      isDark={theme === 'dark'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'bid' ? (
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black dark:ring-gray-700 ring-opacity-5 dark:ring-opacity-20 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Skill</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Bid Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {filteredBidData.map((bid) => (
                      <tr key={bid.id} className={`${getRowClassName(bid.id)} hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{bid.skill}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{bid.bidNumber}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{formatDate(bid.createdAt)}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                setSelectedBid(bid);
                                setIsBidFormOpen(true);
                              }}
                              className="inline-flex items-center rounded-md p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                              title="Edit bid"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBid(bid);
                                setDeleteType('bid');
                                setIsDeleteModalOpen(true);
                              }}
                              className="inline-flex items-center rounded-md p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-800 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                              title="Delete bid"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black dark:ring-gray-700 ring-opacity-5 dark:ring-opacity-20 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Project Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Client Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Review</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Review Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Spent Money</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Awarded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {filteredChatData.map((chat) => (
                      <tr key={chat.id} className={`${getRowClassName(chat.id)} hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{chat.projectTitle}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{chat.clientName}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          <div className="flex items-center">
                            {chat.clientCountry && countries.find(c => c.code === chat.clientCountry) && (
                              <>
                                {renderFlag(countries.find(c => c.code === chat.clientCountry)?.flag || '')}
                                <span className="ml-2">
                                  {countries.find(c => c.code === chat.clientCountry)?.name}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{chat.review.toFixed(1)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{chat.reviewNumber}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">${chat.spentMoney.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {chat.isAwarded ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800/30 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                              No
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{formatDate(chat.createdAt)}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                setSelectedChat(chat);
                                setIsChatFormOpen(true);
                              }}
                              className="inline-flex items-center rounded-md p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                              title="Edit chat"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedChat(chat);
                                setDeleteType('chat');
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Delete chat"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BidFormModal
        isOpen={isBidFormOpen}
        onClose={() => {
          setIsBidFormOpen(false);
          setSelectedBid(null);
        }}
        onSubmit={selectedBid 
          ? (newBid: NewBidData) => handleUpdateBid(selectedBid.id, newBid)
          : handleCreateBid
        }
        initialData={selectedBid}
      />

      <ChatFormModal
        isOpen={isChatFormOpen}
        onClose={() => {
          setIsChatFormOpen(false);
          setSelectedChat(null);
        }}
        onSubmit={selectedChat
          ? (newChat: NewChatData) => handleUpdateChat(selectedChat.id, newChat)
          : handleCreateChat
        }
        initialData={selectedChat}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBid(null);
          setSelectedChat(null);
          setDeleteType(null);
        }}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === 'bid' ? 'Bid' : 'Chat'}`}
        message={`Are you sure you want to delete this ${deleteType === 'bid' ? 'bid' : 'chat'}? This action cannot be undone.`}
      />

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={handleCloseNotification}
      />
    </div>
  );
};

export default FreelancerBidHistory; 