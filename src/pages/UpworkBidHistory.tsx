import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UpworkBidData, NewUpworkBidData, UpworkBidService } from '../services/upworkBidService';
import UpworkBidFormModal from '../components/modals/UpworkBidFormModal';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';
import CustomDatePicker from '../components/DatePicker';
import { Pencil, Trash2, Filter, Plus, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { FreelancerBidService } from '../services/freelancerBidService';

interface NotificationState {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  clientName: string;
  country: string;
  minTotalSpent: string;
  maxTotalSpent: string;
  minHourlyRate: string;
  maxHourlyRate: string;
  minBidAmount: string;
  maxBidAmount: string;
  accountName: string;
  status: string;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

const UpworkBidHistory = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [bidData, setBidData] = useState<UpworkBidData[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<UpworkBidData | null>(null);
  const [bidToDelete, setBidToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'success',
    isVisible: false
  });
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    clientName: '',
    country: '',
    minTotalSpent: '',
    maxTotalSpent: '',
    minHourlyRate: '',
    maxHourlyRate: '',
    minBidAmount: '',
    maxBidAmount: '',
    accountName: '',
    status: ''
  });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchData = async () => {
    try {
      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      const data = await UpworkBidService.getBids(user?.id);
      setBidData(data);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setError('Failed to fetch bids. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type, isVisible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const handleCreateBid = async (newBid: NewUpworkBidData) => {
    try {
      await UpworkBidService.createBid(newBid);
      await fetchData();
      showNotification('Bid created successfully', 'success');
    } catch (error) {
      console.error('Error creating bid:', error);
      showNotification('Failed to create bid', 'error');
    }
  };

  const handleUpdateBid = async (id: string, newBid: NewUpworkBidData) => {
    try {
      await UpworkBidService.updateBid(id, newBid);
      await fetchData();
      showNotification('Bid updated successfully', 'success');
    } catch (error) {
      console.error('Error updating bid:', error);
      showNotification('Failed to update bid', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await UpworkBidService.deleteBid(id);
      await fetchData();
      showNotification('Bid deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setBidToDelete(null);
    } catch (error) {
      console.error('Error deleting bid:', error);
      showNotification('Failed to delete bid', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'chat':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'client_view':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'offer':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'reject':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCountryName = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  const renderFlag = (flag: string) => {
    if (flag.startsWith('<svg')) {
      return <span dangerouslySetInnerHTML={{ __html: flag }} className="h-4 w-5 flex-shrink-0" />;
    }
    return <img src={flag} alt="" className="h-4 w-5 flex-shrink-0" />;
  };

  const filteredBids = bidData.filter(bid => {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;
    const bidDate = new Date(bid.bidDate);

    return (
      (!dateFrom || bidDate >= dateFrom) &&
      (!dateTo || bidDate <= dateTo) &&
      (!filters.clientName || bid.clientName.toLowerCase().includes(filters.clientName.toLowerCase())) &&
      (!filters.country || bid.country.toLowerCase().includes(filters.country.toLowerCase())) &&
      (!filters.minTotalSpent || bid.totalSpent >= parseFloat(filters.minTotalSpent)) &&
      (!filters.maxTotalSpent || bid.totalSpent <= parseFloat(filters.maxTotalSpent)) &&
      (!filters.minHourlyRate || bid.averageHourlyRate >= parseFloat(filters.minHourlyRate)) &&
      (!filters.maxHourlyRate || bid.averageHourlyRate <= parseFloat(filters.maxHourlyRate)) &&
      (!filters.minBidAmount || bid.spentBidAmount >= parseFloat(filters.minBidAmount)) &&
      (!filters.maxBidAmount || bid.spentBidAmount <= parseFloat(filters.maxBidAmount)) &&
      (!filters.accountName || bid.accountName.toLowerCase().includes(filters.accountName.toLowerCase())) &&
      (!filters.status || bid.status === filters.status)
    );
  });

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      clientName: '',
      country: '',
      minTotalSpent: '',
      maxTotalSpent: '',
      minHourlyRate: '',
      maxHourlyRate: '',
      minBidAmount: '',
      maxBidAmount: '',
      accountName: '',
      status: ''
    });
  };

  // Add pagination calculation functions
  const indexOfLastBid = currentPage * itemsPerPage;
  const indexOfFirstBid = indexOfLastBid - itemsPerPage;
  const currentBids = filteredBids.slice(indexOfFirstBid, indexOfLastBid);
  const totalPages = Math.ceil(filteredBids.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Add pagination controls component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    return (
      <div className="mt-4 flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            } ring-1 ring-inset ring-gray-300 dark:ring-gray-700`}
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            } ring-1 ring-inset ring-gray-300 dark:ring-gray-700`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{indexOfFirstBid + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(indexOfLastBid, filteredBids.length)}
              </span>{' '}
              of <span className="font-medium">{filteredBids.length}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 ${
                  currentPage === 1
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => onPageChange(index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === index + 1
                      ? 'z-10 bg-blue-600 dark:bg-blue-500 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-500'
                      : 'text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 ${
                  currentPage === totalPages
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upwork Bid History</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
              isFilterVisible 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-700'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-700'
            } hover:bg-gray-50 dark:hover:bg-gray-700`}
          >
            <Filter className="mr-2 h-4 w-4" />
            {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            onClick={() => {
              setSelectedBid(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Bid
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`mb-6 overflow-hidden transition-all duration-300 ease-in-out ${
          isFilterVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</label>
              <input
                type="text"
                value={filters.clientName}
                onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <input
                type="text"
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Total Spent</label>
              <input
                type="number"
                value={filters.minTotalSpent}
                onChange={(e) => setFilters({ ...filters, minTotalSpent: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Total Spent</label>
              <input
                type="number"
                value={filters.maxTotalSpent}
                onChange={(e) => setFilters({ ...filters, maxTotalSpent: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Hourly Rate</label>
              <input
                type="number"
                value={filters.minHourlyRate}
                onChange={(e) => setFilters({ ...filters, minHourlyRate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Hourly Rate</label>
              <input
                type="number"
                value={filters.maxHourlyRate}
                onChange={(e) => setFilters({ ...filters, maxHourlyRate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Bid Amount</label>
              <input
                type="number"
                value={filters.minBidAmount}
                onChange={(e) => setFilters({ ...filters, minBidAmount: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Bid Amount</label>
              <input
                type="number"
                value={filters.maxBidAmount}
                onChange={(e) => setFilters({ ...filters, maxBidAmount: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Name</label>
              <input
                type="text"
                value={filters.accountName}
                onChange={(e) => setFilters({ ...filters, accountName: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 dark:focus:ring-opacity-50 hover:border-gray-400 dark:hover:border-gray-500"
              >
                <option value="">All</option>
                <option value="chat">Chat</option>
                <option value="offer">Offer</option>
                <option value="client_view">Client View</option>
                <option value="no_view">No View</option>
                <option value="reject">Reject</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date From</label>
              <div className="mt-1">
                <CustomDatePicker
                  selectedDate={filters.dateFrom ? new Date(filters.dateFrom) : null}
                  onChange={(date) => setFilters({ ...filters, dateFrom: date ? date.toISOString().split('T')[0] : '' })}
                  placeholder="Start date"
                  isDark={theme === 'dark'}
                  portalId="upwork-date-from-portal"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date To</label>
              <div className="mt-1">
                <CustomDatePicker
                  selectedDate={filters.dateTo ? new Date(filters.dateTo) : null}
                  onChange={(date) => setFilters({ ...filters, dateTo: date ? date.toISOString().split('T')[0] : '' })}
                  placeholder="End date"
                  isDark={theme === 'dark'}
                  portalId="upwork-date-to-portal"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors duration-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification.isVisible && (
        <div
          className={`mb-4 rounded-md p-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
        </div>
      ) : (
        /* Data table */
        <div className="overflow-x-auto rounded-lg bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Hourly Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Bid Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {currentBids.map((bid) => (
                <tr key={bid.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{formatDate(bid.bidDate)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{bid.clientName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    <div className="flex items-center">
                      {countries.find(c => c.code === bid.country) && (
                        <>
                          {renderFlag(countries.find(c => c.code === bid.country)?.flag || '')}
                          <span className="ml-2">{getCountryName(bid.country)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{formatCurrency(bid.totalSpent)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{formatCurrency(bid.averageHourlyRate)}/hr</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{formatCurrency(bid.spentBidAmount)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{bid.accountName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(bid.status)}`}>
                      {bid.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedBid(bid);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center rounded-md p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                        title="Edit bid"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setBidToDelete(bid.id);
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
              {currentBids.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No bids found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <UpworkBidFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBid(null);
        }}
        onSubmit={(bid) => {
          if (selectedBid) {
            handleUpdateBid(selectedBid.id, bid);
          } else {
            handleCreateBid(bid);
          }
          setIsModalOpen(false);
          setSelectedBid(null);
        }}
        initialData={selectedBid}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setBidToDelete(null);
        }}
        onConfirm={() => bidToDelete && handleDelete(bidToDelete)}
        title="Delete Bid"
        message="Are you sure you want to delete this bid? This action cannot be undone."
      />

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default UpworkBidHistory; 