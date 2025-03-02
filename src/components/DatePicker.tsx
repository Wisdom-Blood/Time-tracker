import React, { forwardRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  isDark?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, { 
  value?: string; 
  onClick?: () => void; 
  placeholder?: string; 
  className?: string;
  onClear?: () => void;
  hasValue?: boolean;
  isDark?: boolean;
}>(
  ({ value, onClick, placeholder, className, onClear, hasValue, isDark }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        placeholder={placeholder}
        readOnly
        className={className}
      />
      <div className={`absolute inset-y-0 right-0 flex items-center pr-2 ${hasValue ? 'cursor-pointer' : 'pointer-events-none'}`}
           onClick={(e) => {
             e.stopPropagation();
             if (hasValue && onClear) onClear();
           }}>
        {hasValue ? (
          <svg className={`h-5 w-5 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`} 
               viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" />
          </svg>
        ) : (
          <svg className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" 
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" 
                  clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  )
);

CustomInput.displayName = 'CustomInput';

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onChange,
  placeholder = 'Select date',
  isDark = false
}) => {
  const inputClassName = `
    block w-full rounded-md border
    ${isDark 
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-500'
    }
    pl-3 pr-8 py-2
    shadow-sm transition-all duration-200
    focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
    ${isDark 
      ? 'hover:border-gray-500 focus:border-blue-500' 
      : 'hover:border-gray-400 focus:border-blue-400'
    }
    sm:text-sm
    cursor-pointer
  `;

  // Update theme-specific styles when isDark changes
  useEffect(() => {
    const root = document.documentElement;
    const themeStyles = {
      '--dp-bg-header': isDark ? '#1f2937' : '#f8fafc',
      '--dp-bg-calendar': isDark ? '#1f2937' : '#ffffff',
      '--dp-border-color': isDark ? '#374151' : '#e5e7eb',
      '--dp-text-primary': isDark ? '#f3f4f6' : '#1e293b',
      '--dp-text-secondary': isDark ? '#9ca3af' : '#64748b',
      '--dp-text-day': isDark ? '#e5e7eb' : '#374151',
      '--dp-text-muted': isDark ? '#4b5563' : '#94a3b8',
      '--dp-bg-hover': isDark ? '#374151' : '#f1f5f9',
      '--dp-bg-selected': isDark ? '#3b82f6' : '#2563eb',
      '--dp-bg-keyboard': isDark ? '#1d4ed8' : '#3b82f6',
      '--dp-select-bg': isDark ? '#374151' : '#f8fafc',
      '--dp-select-border': isDark ? '#4b5563' : '#e2e8f0',
      '--dp-select-text': isDark ? '#e5e7eb' : '#334155',
      '--dp-select-hover': isDark ? '#4b5563' : '#f1f5f9',
      '--dp-select-option-bg': isDark ? '#1f2937' : '#ffffff',
      '--dp-select-option-hover': isDark ? '#374151' : '#f1f5f9',
      '--dp-select-option-selected': isDark ? '#3b82f6' : '#2563eb',
      '--dp-shadow': isDark 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)' 
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '--dp-today-bg': isDark ? '#374151' : '#e5e7eb',
      '--dp-today-border': isDark ? '#4b5563' : '#d1d5db',
    };

    Object.entries(themeStyles).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [isDark]);

  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate}
        onChange={onChange}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholder}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        customInput={
          <CustomInput 
            className={inputClassName} 
            placeholder={placeholder}
            onClear={() => onChange(null)}
            hasValue={!!selectedDate}
            isDark={isDark}
          />
        }
        className={inputClassName}
        wrapperClassName="w-full"
        calendarClassName={`
          shadow-lg border rounded-lg
          ${isDark 
            ? 'bg-gray-800 border-gray-600 text-gray-100' 
            : 'bg-white border-gray-200 text-gray-700'
          }
        `}
        dayClassName={date => {
          const isToday = date.toDateString() === new Date().toDateString();
          return `
            hover:bg-blue-50 rounded-full flex items-center justify-center
            ${isDark 
              ? 'text-gray-100 hover:bg-gray-700/50' 
              : 'text-gray-700 hover:bg-blue-50/80'
            }
            ${isToday 
              ? isDark 
                ? 'bg-gray-700/50 font-semibold' 
                : 'bg-gray-100/80 font-semibold'
              : ''
            }
          `;
        }}
        monthClassName={() => 
          `${isDark ? 'text-gray-100' : 'text-gray-700'}`
        }
        weekDayClassName={() => 
          `${isDark ? 'text-gray-400' : 'text-gray-600'}`
        }
        portalId="root"
        popperClassName="z-[9999]"
        popperPlacement="bottom-start"
      />
      <style>{`
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        
        .react-datepicker-wrapper {
          width: 100%;
        }
        
        .react-datepicker {
          font-family: inherit;
          border: none;
          border-radius: 0.5rem;
          overflow: hidden;
          z-index: 9999;
          box-shadow: var(--dp-shadow);
        }
        
        .react-datepicker__month-container {
          float: none;
          width: 100%;
        }
        
        .react-datepicker__header {
          background-color: var(--dp-bg-header);
          border-bottom: 1px solid var(--dp-border-color);
          padding: 1rem;
        }
        
        .react-datepicker__current-month {
          color: var(--dp-text-primary);
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        
        .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          margin-bottom: 0.5rem;
        }
        
        .react-datepicker__day-name {
          color: var(--dp-text-secondary);
          font-weight: 500;
          width: 2rem;
          margin: 0;
          text-align: center;
        }
        
        .react-datepicker__month {
          margin: 0;
          padding: 0.75rem;
          background-color: var(--dp-bg-calendar);
        }
        
        .react-datepicker__week {
          display: flex;
          justify-content: space-around;
        }
        
        .react-datepicker__day {
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          margin: 0;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--dp-text-day);
          transition: all 200ms;
        }
        
        .react-datepicker__day:hover {
          background-color: var(--dp-bg-hover);
          border-radius: 9999px;
        }
        
        .react-datepicker__day--selected {
          background-color: var(--dp-bg-selected) !important;
          color: white !important;
          border-radius: 9999px;
          font-weight: 600;
        }
        
        .react-datepicker__day--keyboard-selected {
          background-color: var(--dp-bg-keyboard);
          color: white;
          border-radius: 9999px;
          font-weight: 600;
        }
        
        .react-datepicker__day--outside-month {
          color: var(--dp-text-muted);
        }

        .react-datepicker__day--today {
          background-color: var(--dp-today-bg);
          border: 1px solid var(--dp-today-border);
          font-weight: 600;
        }
        
        .react-datepicker__navigation {
          top: 1rem;
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: var(--dp-text-secondary);
          border-width: 2px 2px 0 0;
          width: 8px;
          height: 8px;
        }

        /* Month and Year Select Styles */
        .react-datepicker__month-select,
        .react-datepicker__year-select {
          appearance: none;
          background-color: var(--dp-select-bg);
          border: 1px solid var(--dp-select-border);
          border-radius: 0.375rem;
          color: var(--dp-select-text);
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.375rem 2rem 0.375rem 0.75rem;
          margin: 0 0.25rem;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          transition: all 200ms;
        }

        .react-datepicker__month-select:focus,
        .react-datepicker__year-select:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: var(--dp-bg-selected);
          box-shadow: 0 0 0 2px ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
        }

        .react-datepicker__month-select:hover,
        .react-datepicker__year-select:hover {
          background-color: var(--dp-select-hover);
        }

        .react-datepicker__month-select option,
        .react-datepicker__year-select option {
          background-color: var(--dp-select-option-bg);
          color: var(--dp-select-text);
          padding: 0.5rem;
        }

        .react-datepicker__month-select option:hover,
        .react-datepicker__year-select option:hover {
          background-color: var(--dp-select-option-hover);
        }

        .react-datepicker__month-select option:checked,
        .react-datepicker__year-select option:checked {
          background-color: var(--dp-select-option-selected);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker;