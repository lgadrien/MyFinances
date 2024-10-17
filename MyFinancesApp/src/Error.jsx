import React from 'react';
import { Link } from 'react-router-dom';

const Erreur404 = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page non trouvée</h1>
      <p className="text-gray-600 mb-8">Désolé, la page que vous cherchez n'existe pas.</p>
      <Link to="/" className="text-blue-500 hover:underline">
        Retourner à la page d'accueil
      </Link>
    </div>
  );
};

export default Erreur404;
