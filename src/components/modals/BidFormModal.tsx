import { useState, useEffect } from 'react';
import { BidData, NewBidData } from '../../services/freelancerBidService';
import CustomDatePicker from '../DatePicker';
import { useTheme } from '../../context/ThemeContext';

interface BidFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bid: NewBidData) => void;
  initialData: BidData | null;
}

interface ValidationErrors {
  skill?: string;
  bidNumber?: string;
  bidDate?: string;
}

const BidFormModal = ({ isOpen, onClose, onSubmit, initialData }: BidFormModalProps) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<NewBidData>({
    skill: '',
    bidNumber: 0,
    bidDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        skill: initialData.skill,
        bidNumber: initialData.bidNumber,
        bidDate: initialData.bidDate
      });
    } else {
      setFormData({
        skill: '',
        bidNumber: 0,
        bidDate: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.skill.trim()) {
      newErrors.skill = 'Skill is required';
    } else if (formData.skill.length < 2) {
      newErrors.skill = 'Skill must be at least 2 characters';
    }

    if (formData.bidNumber <= 0) {
      newErrors.bidNumber = 'Bid number must be greater than 0';
    }

    if (!formData.bidDate) {
      newErrors.bidDate = 'Date is required';
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div 
          className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {initialData ? 'Edit Bid' : 'Create New Bid'}
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
                    portalId="bid-date-portal"
                  />
                  {errors.bidDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bidDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="skill" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Skill
                  </label>
                  <input
                    type="text"
                    id="skill"
                    value={formData.skill}
                    onChange={(e) => {
                      setFormData({ ...formData, skill: e.target.value });
                      if (errors.skill) setErrors({ ...errors, skill: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm ${
                      errors.skill 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    required
                  />
                  {errors.skill && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.skill}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bidNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bid Number
                  </label>
                  <input
                    type="number"
                    id="bidNumber"
                    value={formData.bidNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, bidNumber: parseInt(e.target.value) || 0 });
                      if (errors.bidNumber) setErrors({ ...errors, bidNumber: undefined });
                    }}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm ${
                      errors.bidNumber 
                        ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-700 text-red-900 dark:text-red-300' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    } placeholder-gray-400 dark:placeholder-gray-500`}
                    min="1"
                    required
                  />
                  {errors.bidNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bidNumber}</p>
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

export default BidFormModal;