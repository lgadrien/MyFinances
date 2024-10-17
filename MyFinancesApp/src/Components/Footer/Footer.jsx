import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <>
      <div className="border-t border-gray-300"></div> {/* Trait de séparation */}
      <footer className="bg-white text-black py-6">
        <div className="container mx-auto text-center">
          <div className="mb-4 flex justify-center space-x-4">
            <Link 
              to="/" 
              title="Accueil" 
              className="relative text-black inline-block py-1 px-2 group"
            >
              Accueil
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-600 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100"></span>
            </Link>
            <span className="text-gray-400">/</span>
            <Link 
              to="/about" 
              title="À propos" 
              className="relative text-black inline-block py-1 px-2 group"
            >
              À propos
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-600 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100"></span>
            </Link>
            <span className="text-gray-400">/</span>
            <Link 
              to="/contact" 
              title="Contact" 
              className="relative text-black inline-block py-1 px-2 group"
            >
              Contact
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-600 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100"></span>
            </Link>
          </div>
          <p className="text-sm text-gray-600">&copy; 2024 MyFinances. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}

export default Footer;
