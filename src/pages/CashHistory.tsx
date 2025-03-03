import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
  Plus,
  Calendar,
  Trash2,
  Edit2,
  SlidersHorizontal,
  DollarSign,
  Clock,
  FileText
} from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface CashHistory {
  id: number;
  amount: number;
  reason: string;
  date: Date;
  user_id: number;
  user_name: string;
}

interface FormData {
  amount: string;
  reason: string;
  date: Date;
}

interface FilterData {
  startDate: Date | null;
  endDate: Date | null;
  minAmount: string;
  maxAmount: string;
}

// Custom styles for the DatePicker
const datePickerStyles = `
  w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
  text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
  focus:outline-none focus:ring-2 focus:ring-blue-500
`;

export default function CashHistory() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cashHistories, setCashHistories] = useState<CashHistory[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    reason: '',
    date: new Date(),
  });
  const [filterData, setFilterData] = useState<FilterData>({
    startDate: null,
    endDate: null,
    minAmount: '',
    maxAmount: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRangeInfo, setDateRangeInfo] = useState<{
    month?: string;
    year?: number;
    startDate?: string | null;
    endDate?: string | null;
  }>({});

  // Fetch cash histories with filters
  const fetchCashHistories = async () => {
    try {
      let url = 'http://localhost:5000/api/cash-history';
      const params = new URLSearchParams();

      if (filterData.startDate) {
        params.append('startDate', filterData.startDate.toISOString().split('T')[0]);
      }
      if (filterData.endDate) {
        params.append('endDate', filterData.endDate.toISOString().split('T')[0]);
      }
      if (filterData.minAmount) {
        params.append('minAmount', filterData.minAmount);
      }
      if (filterData.maxAmount) {
        params.append('maxAmount', filterData.maxAmount);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        withCredentials: true
      });

      setCashHistories(response.data.records.map((history: any) => ({
        ...history,
        date: new Date(history.date)
      })));
      setTotalAmount(response.data.total);
      setDateRangeInfo(response.data.dateRange);
    } catch (error: any) {
      console.error('Error fetching cash histories:', error);
      notifyError(error.response?.data?.message || 'Failed to fetch cash histories');
    }
  };

  useEffect(() => {
    fetchCashHistories();
  }, [filterData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        amount: Number(formData.amount),
        reason: formData.reason,
        date: formData.date,
      };

      if (isEditing && editingId) {
        await axios.put(`http://localhost:5000/api/cash-history/${editingId}`, data, {
          withCredentials: true
        });
        notifySuccess('Cash history updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/cash-history', data, {
          withCredentials: true
        });
        notifySuccess('Cash history added successfully');
      }

      setIsOpen(false);
      setIsEditing(false);
      setEditingId(null);
      resetForm();
      fetchCashHistories();
    } catch (error: any) {
      console.error('Error submitting cash history:', error);
      notifyError(error.response?.data?.message || 'Failed to submit cash history');
    }
  };

  const handleEdit = (history: CashHistory) => {
    setFormData({
      amount: history.amount.toString(),
      reason: history.reason,
      date: new Date(history.date),
    });
    setEditingId(history.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this cash history?')) {
      try {
        await axios.delete(`http://localhost:5000/api/cash-history/${id}`, {
          withCredentials: true
        });
        notifySuccess('Cash history deleted successfully');
        fetchCashHistories();
      } catch (error: any) {
        console.error('Error deleting cash history:', error);
        notifyError(error.response?.data?.message || 'Failed to delete cash history');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      reason: '',
      date: new Date(),
    });
  };

  const notifySuccess = (message: string) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        backgroundColor: '#10B981',
        color: 'white',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    });
  };

  const notifyError = (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        backgroundColor: '#EF4444',
        color: 'white',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    });
  };

  const handleFilterReset = () => {
    setFilterData({
      startDate: null,
      endDate: null,
      minAmount: '',
      maxAmount: ''
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cash History</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your cash transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
              showFilters
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filters
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              resetForm();
              setIsOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Cash History
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <Transition
        show={showFilters}
        enter="transition-all duration-300 ease-out"
        enterFrom="transform -translate-y-4 opacity-0"
        enterTo="transform translate-y-0 opacity-100"
        leave="transition-all duration-200 ease-in"
        leaveFrom="transform translate-y-0 opacity-100"
        leaveTo="transform -translate-y-4 opacity-0"
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <DatePicker
                selected={filterData.startDate}
                onChange={(date: Date | null) => setFilterData({ ...filterData, startDate: date })}
                className={datePickerStyles}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
                wrapperClassName="w-full"
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <DatePicker
                selected={filterData.endDate}
                onChange={(date: Date | null) => setFilterData({ ...filterData, endDate: date })}
                className={datePickerStyles}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
                wrapperClassName="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Amount
              </label>
              <input
                type="number"
                value={filterData.minAmount}
                onChange={(e) => setFilterData({ ...filterData, minAmount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter min amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                value={filterData.maxAmount}
                onChange={(e) => setFilterData({ ...filterData, maxAmount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter max amount"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleFilterReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 
                       dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                       rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 mr-2"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </Transition>

      {/* Cash History Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cashHistories.map((history) => (
                <tr key={history.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {new Date(history.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {history.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap" title={history.reason}>
                      {history.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {history.user_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(history)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(history.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Total Amount Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {dateRangeInfo.month && dateRangeInfo.year ? (
                `${dateRangeInfo.month} ${dateRangeInfo.year}`
              ) : (
                dateRangeInfo.startDate && dateRangeInfo.endDate ? (
                  `${dateRangeInfo.startDate} - ${dateRangeInfo.endDate}`
                ) : ''
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                Total Amount:
              </span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                Yuan {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Cash History Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                  >
                    {isEditing ? 'Edit Cash History' : 'Add Cash History'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="block w-full pl-4 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                   text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          required
                        />
                        
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </label>
                      <div className="relative mt-1">
                        <DatePicker
                          selected={formData.date}
                          onChange={(date: Date | null) => date && setFormData({ ...formData, date })}
                          className={datePickerStyles}
                          dateFormat="yyyy-MM-dd"
                          wrapperClassName="w-full"
                          required
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-5 w-5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reason
                      </label>
                      <textarea
                        required
                        className="mt-1 px-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md 
                                 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Enter reason for cash transaction..."
                      />
                    </div>

                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 
                                 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                                 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                                 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        {isEditing ? 'Update Cash History' : 'Add Cash History'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 