import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLogo from './../../assets/Logo2.jpg';

// Liens pour les utilisateurs authentifiés
const authLinks = [
  { path: '/profil', label: 'Profil', icon: '👤' },
];

// Liens pour les utilisateurs invités
const guestLinks = [
  { path: '/login', label: 'Connexion', icon: '🔑' },
  { path: '/register', label: 'Inscription', icon: '📝' },
];

// Options de langues disponibles
const languages = {
  fr: 'Français',
  gb: 'English',
  es: 'Español'
};

const Header = () => {
  const [isOpen, setIsOpen] = useState(false); // Gestion du menu mobile
  const [isDarkMode, setIsDarkMode] = useState(false); // Gestion du mode sombre
  const [selectedLanguage, setSelectedLanguage] = useState('fr'); // Langue sélectionnée
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Etat d'authentification
  const navigate = useNavigate();

  // Vérification de l'authentification à partir du localStorage
  useEffect(() => {
    const userId = localStorage.getItem('user_id'); // Récupère le user_id depuis le localStorage
    setIsAuthenticated(!!userId); // Définit l'état d'authentification selon la présence de user_id
  }, []);

  // Gestion de la déconnexion
  const handleLogout = () => {
    localStorage.removeItem('user_id'); // Supprime l'ID utilisateur du localStorage
    setIsAuthenticated(false); // Met à jour l'état d'authentification
    navigate('/login'); // Redirige vers la page de connexion
  };

  return (
    <>
      <header className={`bg-white shadow-md py-4 px-6 ${isDarkMode ? 'dark:bg-black' : ''}`}>
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo et titre */}
          <Link to="/" className="flex items-center text-black group">
            <img src={AppLogo} alt="AppLogo" className="w-12 h-12 md:w-16 md:h-16 mr-2" />
            <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-300 group-hover:text-gray-600">MyFinances</h1>
          </Link>

          {/* Bouton pour ouvrir/fermer le menu mobile */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-black focus:outline-none"
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

          {/* Menu de navigation principal */}
          <nav className="hidden md:flex space-x-4 md:space-x-6 items-center">
            {/* Liens pour les utilisateurs authentifiés */}
            {isAuthenticated && (
              <>
                <Link to="/my-account" className="text-lg md:text-xl text-black relative group flex items-center">
                  <span className="mr-2">🏦</span>
                  Mes comptes
                  <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-900 transition-transform duration-300 transform scale-x-0 group-hover:scale-x-100"></span>
                </Link>
                <Link to="/operations" className="text-lg md:text-xl text-black relative group flex items-center">
                  <span className="mr-2">💸</span>
                  Opérations
                  <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-900 transition-transform duration-300 transform scale-x-0 group-hover:scale-x-100"></span>
                </Link>
              </>
            )}

            {/* Affichage selon l'authentification */}
            {isAuthenticated ? (
              <>
                {authLinks.map(({ path, label, icon }) => (
                  <Link key={path} to={path} className="text-lg md:text-xl text-black relative group flex items-center">
                    <span className="mr-2">{icon}</span>
                    {label}
                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-900 transition-transform duration-300 transform scale-x-0 group-hover:scale-x-100"></span>
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="text-lg md:text-xl text-black relative group flex items-center focus:outline-none"
                >
                  <span className="mr-2">🚪</span>
                  Déconnexion
                  <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-900 transition-transform duration-300 transform scale-x-0 group-hover:scale-x-100"></span>
                </button>
              </>
            ) : (
              guestLinks.map(({ path, label, icon }) => (
                <Link key={path} to={path} className="text-lg md:text-xl text-black relative group flex items-center">
                  <span className="mr-2">{icon}</span>
                  {label}
                  <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-900 transition-transform duration-300 transform scale-x-0 group-hover:scale-x-100"></span>
                </Link>
              ))
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
