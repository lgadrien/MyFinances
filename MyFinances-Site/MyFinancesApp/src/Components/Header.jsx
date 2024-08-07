import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '../assets/Logo2.jpg';

const links = [
  { path: '/my-account', label: 'Mes comptes', icon: '🏦' },
  { path: '/operations', label: 'Opérations', icon: '💸' },
];

const languages = {
  fr: 'Français',
  gb: 'English',
  es: 'Español'
};

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('fr');

  return (
    <>
      <header className={`bg-white shadow-md py-4 px-6 ${isDarkMode ? 'dark:bg-gray-900' : ''}`}>
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center text-black group">
            <img src={AppLogo} alt="AppLogo" className="w-12 h-12 md:w-16 md:h-16 mr-2" />
            <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-300 group-hover:text-gray-600">MyFinances</h1>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-800 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
          <nav className="hidden md:flex space-x-4 md:space-x-6">
            {links.map(({ path, label, icon }) => (
              <Link key={path} to={path} className="text-lg md:text-xl text-black relative group flex items-center">
                <span className="mr-2">{icon}</span>
                {label}
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-600 transition-transform duration-300 transform scale-x-0 group-hover:scale-x-100"></span>
              </Link>
            ))}
          </nav>
        </div>

        <div
          className={`fixed inset-0 bg-white z-50 flex flex-col items-start transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-800 absolute top-4 right-4 focus:outline-none"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <nav className="flex flex-col space-y-6 mt-20 pl-6 w-full">
            {links.map(({ path, label, icon }) => (
              <Link key={path} to={path} className="text-2xl text-black relative group flex items-center" onClick={() => setIsOpen(false)}>
                <span className="mr-4">{icon}</span>
                <span className="flex-1">{label}</span>
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-600 transition-transform duration-300 transform scale-x-0 group-hover:scale-x-100"></span>
              </Link>
            ))}
            <div className="flex items-center text-2xl text-black">
              <span className="flex-shrink-0 w-36">Langue:</span>
              <div className="relative flex items-center w-full">
                <button className="flex items-center h-10 px-4 rounded-md border border-gray-300 bg-white shadow-md hover:bg-gray-100 focus:outline-none">
                  <img
                    src={`https://flagcdn.com/16x12/${selectedLanguage}.png`}
                    alt={selectedLanguage}
                    className="w-6 h-4 mr-2"
                  />
                  <span>{languages[selectedLanguage] || 'Select Language'}</span>
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 9l6 6 6-6"
                    />
                  </svg>
                </button>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {Object.entries(languages).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between w-full pr-6">
              <span className="text-2xl text-black">Thème:</span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex items-center h-10 w-20 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute inset-y-0 left-0 flex items-center justify-center w-10 h-10 transform rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-full bg-gray-900' : 'translate-x-0 bg-white'}`}
                >
                  {isDarkMode ? '🌙' : '☀️'}
                </span>
              </button>
            </div>
          </nav>
        </div>
      </header>
      <div className="border-b border-gray-300"></div>
    </>
  );
};

export default Header;
