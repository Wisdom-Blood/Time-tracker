import { useState, useEffect } from 'react';
import { UpworkBidData, NewUpworkBidData, Country, UpworkBidService } from '../../services/upworkBidService';
import CustomDatePicker from '../DatePicker';
import { useTheme } from '../../context/ThemeContext';

interface UpworkBidFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bid: NewUpworkBidData) => void;
  initialData: UpworkBidData | null;
}

interface ValidationErrors {
  bidDate?: string;
  clientName?: string;
  country?: string;
  totalSpent?: string;
  averageHourlyRate?: string;
  spentBidAmount?: string;
  accountName?: string;
  status?: string;
}

const UpworkBidFormModal = ({ isOpen, onClose, onSubmit, initialData }: UpworkBidFormModalProps) => {
  const { theme } = useTheme();
  const initialFormData: NewUpworkBidData = {
    bidDate: new Date().toISOString().split('T')[0],
    clientName: '',
    country: '',
    totalSpent: 0,
    averageHourlyRate: 0,
    spentBidAmount: 0,
    accountName: '',
    status: 'chat'
  };

  const [formData, setFormData] = useState<NewUpworkBidData>(initialData ? {
    bidDate: initialData.bidDate,
    clientName: initialData.clientName,
    country: initialData.country,
    totalSpent: initialData.totalSpent,
    averageHourlyRate: initialData.averageHourlyRate,
    spentBidAmount: initialData.spentBidAmount,
    accountName: initialData.accountName,
    status: initialData.status
  } : initialFormData);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoadingCountries(true);
        const countriesData = await UpworkBidService.getCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    if (isOpen) {
      fetchCountries();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        bidDate: initialData.bidDate,
        clientName: initialData.clientName,
        country: initialData.country,
        totalSpent: initialData.totalSpent,
        averageHourlyRate: initialData.averageHourlyRate,
        spentBidAmount: initialData.spentBidAmount,
        accountName: initialData.accountName,
        status: initialData.status
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.bidDate) {
      newErrors.bidDate = 'Date is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (formData.totalSpent < 0) {
      newErrors.totalSpent = 'Total spent must be positive';
    }

    if (formData.averageHourlyRate < 0) {
      newErrors.averageHourlyRate = 'Average hourly rate must be positive';
    }

    if (formData.spentBidAmount < 0) {
      newErrors.spentBidAmount = 'Spent bid amount must be positive';
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting bid:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFlag = (flag: string) => {
    if (flag.startsWith('<svg')) {
      return <span dangerouslySetInnerHTML={{ __html: flag }} className="h-4 w-5 flex-shrink-0" />;
    }
    return <img src={flag} alt="" className="h-4 w-5 flex-shrink-0" />;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

        <div 
          className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {initialData ? 'Edit Upwork Bid' : 'Create New Upwork Bid'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="bidDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <CustomDatePicker
                    selectedDate={formData.bidDate ? new Date(formData.bidDate) : null}
                    onChange={(date) => {
                      setFormData({
                        ...formData,
                        bidDate: date ? date.toISOString().split('T')[0] : ''
                      });
                      if (errors.bidDate) setErrors({ ...errors, bidDate: undefined });
                    }}
                    isDark={theme === 'dark'}
                  />
                  {errors.bidDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bidDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Client Name
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => {
                      setFormData({ ...formData, clientName: e.target.value });
                      if (errors.clientName) setErrors({ ...errors, clientName: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.clientName 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    required
                  />
                  {errors.clientName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.clientName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Country
                  </label>
                  <div className="relative mt-1">
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      disabled={isLoadingCountries}
                      className={`relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm ${
                        errors.country 
                          ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                          : 'border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      } focus:outline-none focus:ring-1 sm:text-sm`}
                    >
                      <span className="flex items-center">
                        {formData.country ? (
                          <>
                            {renderFlag(countries.find(c => c.code === formData.country)?.flag || '')}
                            <span className="ml-3 block truncate">
                              {countries.find(c => c.code === formData.country)?.name || 'Select a country'}
                            </span>
                          </>
                        ) : (
                          <span className="block truncate">Select a country</span>
                        )}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </button>

                    {isCountryDropdownOpen && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {countries.map((country) => (
                          <button
                            type="button"
                            key={country.code}
                            className={`relative flex w-full cursor-pointer select-none items-center py-2 pl-3 pr-9 hover:bg-blue-50 ${
                              formData.country === country.code ? 'bg-blue-100' : ''
                            }`}
                            onClick={() => {
                              setFormData({ ...formData, country: country.code });
                              if (errors.country) setErrors({ ...errors, country: undefined });
                              setIsCountryDropdownOpen(false);
                            }}
                          >
                            {renderFlag(country.flag)}
                            <span className="ml-3 block truncate">{country.name}</span>
                            {formData.country === country.code && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.country}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="totalSpent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Spent ($)
                  </label>
                  <input
                    type="number"
                    id="totalSpent"
                    value={formData.totalSpent}
                    onChange={(e) => {
                      setFormData({ ...formData, totalSpent: parseFloat(e.target.value) || 0 });
                      if (errors.totalSpent) setErrors({ ...errors, totalSpent: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.totalSpent 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    min="0"
                    step="0.01"
                    required
                  />
                  {errors.totalSpent && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.totalSpent}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="averageHourlyRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Average Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    id="averageHourlyRate"
                    value={formData.averageHourlyRate}
                    onChange={(e) => {
                      setFormData({ ...formData, averageHourlyRate: parseFloat(e.target.value) || 0 });
                      if (errors.averageHourlyRate) setErrors({ ...errors, averageHourlyRate: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.averageHourlyRate 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    min="0"
                    step="0.01"
                    required
                  />
                  {errors.averageHourlyRate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.averageHourlyRate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="spentBidAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Spent Bid Amount ($)
                  </label>
                  <input
                    type="number"
                    id="spentBidAmount"
                    value={formData.spentBidAmount}
                    onChange={(e) => {
                      setFormData({ ...formData, spentBidAmount: parseFloat(e.target.value) || 0 });
                      if (errors.spentBidAmount) setErrors({ ...errors, spentBidAmount: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.spentBidAmount 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    min="0"
                    step="0.01"
                    required
                  />
                  {errors.spentBidAmount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.spentBidAmount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Name
                  </label>
                  <input
                    type="text"
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => {
                      setFormData({ ...formData, accountName: e.target.value });
                      if (errors.accountName) setErrors({ ...errors, accountName: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.accountName 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    required
                  />
                  {errors.accountName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.accountName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => {
                      setFormData({ ...formData, status: e.target.value as any });
                      if (errors.status) setErrors({ ...errors, status: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.status 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                    required
                  >
                    <option value="chat" className="dark:bg-gray-700">Chat</option>
                    <option value="client_view" className="dark:bg-gray-700">Client View</option>
                    <option value="offer" className="dark:bg-gray-700">Offer</option>
                    <option value="reject" className="dark:bg-gray-700">Reject</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm sm:ml-3 sm:w-auto sm:text-sm ${
                  isSubmitting
                    ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                }`}
              >
                {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpworkBidFormModal; 