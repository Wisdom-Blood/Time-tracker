import { useState, useEffect } from 'react';
import { ChatData, NewChatData, FreelancerBidService, Country } from '../../services/freelancerBidService';
import { useAuth } from '../../hooks/useAuth';

interface ChatFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (chat: NewChatData) => void;
  initialData: ChatData | null;
}

interface ValidationErrors {
  projectTitle?: string;
  clientName?: string;
  clientCountry?: string;
  review?: string;
  reviewNumber?: string;
  spentMoney?: string;
  submit?: string;
}

const ChatFormModal = ({ isOpen, onClose, onSubmit, initialData }: ChatFormModalProps) => {
  const { user } = useAuth();
  const initialFormData: NewChatData = {
    clientName: '',
    projectTitle: '',
    review: 0,
    reviewNumber: 0,
    spentMoney: 0,
    isAwarded: false,
    clientCountry: '',
  };

  const [formData, setFormData] = useState<NewChatData>(initialData ? {
    projectTitle: initialData.projectTitle,
    clientName: initialData.clientName,
    review: initialData.review,
    reviewNumber: initialData.reviewNumber,
    spentMoney: initialData.spentMoney,
    isAwarded: initialData.isAwarded,
    clientCountry: initialData.clientCountry || '',
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
        const countriesData = await FreelancerBidService.getCountries();
        console.log('Countries data:', countriesData);
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
        projectTitle: initialData.projectTitle,
        clientName: initialData.clientName,
        review: initialData.review,
        reviewNumber: initialData.reviewNumber,
        spentMoney: initialData.spentMoney,
        isAwarded: initialData.isAwarded,
        clientCountry: initialData.clientCountry || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.projectTitle.trim()) {
      newErrors.projectTitle = 'Project title is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (formData.review < 0 || formData.review > 5) {
      newErrors.review = 'Review must be between 0 and 5';
    }

    if (formData.reviewNumber < 0) {
      newErrors.reviewNumber = 'Review number must be positive';
    }

    if (formData.spentMoney < 0) {
      newErrors.spentMoney = 'Spent money must be positive';
    }

    if (!formData.clientCountry) {
      newErrors.clientCountry = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const selectedCountry = countries.find(c => c.code === formData.clientCountry);
      
      if (!selectedCountry) {
        setErrors(prev => ({
          ...prev,
          clientCountry: 'Please select a valid country'
        }));
        return;
      }

      const chatData = {
        ...formData,
        clientCountry: selectedCountry.code
      };
      
      if (initialData) {
        await onSubmit({ ...chatData, id: initialData.id } as ChatData);
      } else {
        await onSubmit(chatData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting chat:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to submit chat. Please try again.'
      }));
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
                {initialData ? 'Edit Chat' : 'Create New Chat'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Country
                  </label>
                  <div className="relative mt-1">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        disabled={isLoadingCountries}
                        className={`relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm ${
                          errors.clientCountry 
                            ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                            : 'border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        } focus:outline-none focus:ring-1 sm:text-sm`}
                      >
                        <span className="flex items-center">
                          {formData.clientCountry ? (
                            <>
                              {renderFlag(countries.find(c => c.code === formData.clientCountry)?.flag || '')}
                              <span className="ml-3 block truncate">
                                {countries.find(c => c.code === formData.clientCountry)?.name || 'Select a country'}
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
                                formData.clientCountry === country.code ? 'bg-blue-100' : ''
                              }`}
                              onClick={() => {
                                setFormData({ ...formData, clientCountry: country.code });
                                if (errors.clientCountry) setErrors({ ...errors, clientCountry: undefined });
                                setIsCountryDropdownOpen(false);
                              }}
                            >
                              {renderFlag(country.flag)}
                              <span className="ml-3 block truncate">{country.name}</span>
                              {formData.clientCountry === country.code && (
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
                    {isLoadingCountries && (
                      <div className="absolute right-2 top-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  {errors.clientCountry && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.clientCountry}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Title
                  </label>
                  <input
                    type="text"
                    id="projectTitle"
                    value={formData.projectTitle}
                    onChange={(e) => {
                      setFormData({ ...formData, projectTitle: e.target.value });
                      if (errors.projectTitle) setErrors({ ...errors, projectTitle: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.projectTitle 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    required
                  />
                  {errors.projectTitle && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectTitle}</p>
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
                  <label htmlFor="review" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Review Score (0-5)
                  </label>
                  <input
                    type="number"
                    id="review"
                    value={formData.review}
                    onChange={(e) => {
                      setFormData({ ...formData, review: parseFloat(e.target.value) || 0 });
                      if (errors.review) setErrors({ ...errors, review: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.review 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    min="0"
                    max="5"
                    step="0.1"
                    required
                  />
                  {errors.review && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.review}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reviewNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of Reviews
                  </label>
                  <input
                    type="number"
                    id="reviewNumber"
                    value={formData.reviewNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, reviewNumber: parseInt(e.target.value) || 0 });
                      if (errors.reviewNumber) setErrors({ ...errors, reviewNumber: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.reviewNumber 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    min="0"
                    required
                  />
                  {errors.reviewNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reviewNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="spentMoney" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Spent Money ($)
                  </label>
                  <input
                    type="number"
                    id="spentMoney"
                    value={formData.spentMoney}
                    onChange={(e) => {
                      setFormData({ ...formData, spentMoney: parseFloat(e.target.value) || 0 });
                      if (errors.spentMoney) setErrors({ ...errors, spentMoney: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md px-3 py-2 shadow-sm ${
                      errors.spentMoney 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    min="0"
                    step="0.01"
                    required
                  />
                  {errors.spentMoney && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.spentMoney}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAwarded"
                    checked={formData.isAwarded}
                    onChange={(e) => setFormData({ ...formData, isAwarded: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
                  />
                  <label htmlFor="isAwarded" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                    Project Awarded
                  </label>
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

export default ChatFormModal; 