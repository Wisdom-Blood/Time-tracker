import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
<<<<<<< HEAD
import { LogOut, User, LayoutDashboard, Users, Menu, X, Clock, CreditCard, Sun, Moon, ChevronDown } from 'lucide-react';
=======
import { LogOut, User, LayoutDashboard, Users, Menu, X, Clock, CreditCard, Sun, Moon, History, ChevronDown } from 'lucide-react';
>>>>>>> ec447256e12ce79deb2f5be214aec512365a6d6f

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    ...(isAdmin ? [
      { name: 'User Management', path: '/users', icon: <Users className="h-5 w-5" /> },
      { name: 'Target Times', path: '/target-times', icon: <Clock className="h-5 w-5" /> }
    ] : []),
    { name: 'Work Reports', path: '/reports', icon: <Clock className="h-5 w-5" /> },
    { name: 'Profile', path: '/profile', icon: <User className="h-5 w-5" /> },
  ];

  const paymentLinks = [
    { name: 'Transactions', path: '/transactions', icon: <CreditCard className="h-5 w-5" /> },
    { name: 'Cash History', path: '/cash-history', icon: <CreditCard className="h-5 w-5" /> }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-gray-800 dark:text-white">
                TimeTracker
              </Link>
            </div>

            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                      location.pathname === link.path
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    {link.icon}
                    <span className="ml-1">{link.name}</span>
                  </Link>
                ))}

                {/* Payment Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsPaymentOpen(!isPaymentOpen)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                      paymentLinks.some(link => location.pathname === link.path)
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 mr-1" />
                    Payment
                    <ChevronDown className={`ml-1 h-4 w-4 transform transition-transform ${isPaymentOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPaymentOpen && (
                    <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="payment-menu">
                        {paymentLinks.map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center px-4 py-2 text-sm ${
                              location.pathname === link.path
                                ? 'bg-gray-100 dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => setIsPaymentOpen(false)}
                          >
                            {link.icon}
                            <span className="ml-2">{link.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {isAuthenticated && (
              <div className="hidden items-center sm:ml-6 sm:flex sm:space-x-8">
                {user && (
                  <>
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                          isHistoryOpen
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <History className="mr-2 h-5 w-5" />
                        History
                        <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isHistoryOpen && (
                        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
                          <div className="py-1" role="menu" aria-orientation="vertical">
                            <Link
                              to="/freelancer-bid-history"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700"
                              onClick={() => setIsHistoryOpen(false)}
                            >
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                                <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </span>
                              <div>
                                <p className="font-medium">Freelancer History</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View your Freelancer bid history</p>
                              </div>
                            </Link>
                            <Link
                              to="/upwork-bid-history"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              onClick={() => setIsHistoryOpen(false)}
                            >
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
                                <History className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </span>
                              <div>
                                <p className="font-medium">Upwork History</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View your Upwork bid history</p>
                              </div>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hello, {user?.name} {isAdmin && <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">(Admin)</span>}
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    location.pathname === '/login'
                      ? 'bg-blue-50 text-blue-700 dark:text-gray-300 dark:hover:text-white'
                      : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mr-2">{link.icon}</span>
                {link.name}
              </Link>
            ))}

            {/* Mobile Payment Links */}
            {paymentLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mr-2">{link.icon}</span>
                {link.name}
              </Link>
            ))}

            <button
              onClick={toggleTheme}
              className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 mr-2" />
              ) : (
                <Sun className="h-5 w-5 mr-2" />
              )}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;