import React, { useEffect, useState } from 'react';
import { Tooltip } from '@mui/material';

const MonCompteMDB = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupérer l'ID utilisateur depuis le localStorage
  const userId = localStorage.getItem('user_id');

  const fetchBalances = () => {
    if (userId) {
      const apiUrl = `http://localhost:3000/accounts/${userId}`;
      console.log('URL de l\'API:', apiUrl);  // <-- Vérifiez l'URL ici
  
      fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Erreur lors de la récupération des comptes');
          }
          return response.json();
        })
        .then((data) => {
          console.log('Données des comptes reçues:', data); // <-- Vérifiez les données reçues
          setBalances(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Erreur lors de la récupération des comptes:', error);
          setLoading(false);
        });
    } else {
      console.error('ID utilisateur non trouvé dans le localStorage.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 5000); // Mettre à jour toutes les 5 secondes

    return () => clearInterval(interval); // Nettoyer l'intervalle lorsque le composant est démonté
  }, [userId]);

  useEffect(() => {
    document.title = 'MyFinances - Mes comptes';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 md:mb-6 lg:mb-8">Mes Comptes - MyFinances</h1>
      <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl bg-white shadow-md rounded-lg p-4 md:p-6 lg:p-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 mb-4">Soldes des Comptes</h2>
        <div className="space-y-4">
          {loading ? (
            <p>Chargement des comptes...</p>
          ) : balances.length > 0 ? (
            balances.map(({ account_type, balance }) => (
              <div key={account_type} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 capitalize">
                    {account_type === 'courant' ? 'Compte Courant' : account_type === 'livretA' ? 'Livret A' : account_type === 'jeune' ? 'Compte Jeune' : account_type}
                  </h3>
                  <Tooltip title={`Informations sur ${account_type}`} arrow>
                    <span className="ml-2 text-gray-500 cursor-pointer">
                      <i className="fas fa-info-circle" aria-hidden="true"></i>
                      <span className="sr-only">Informations sur {account_type}</span>
                    </span>
                  </Tooltip>
                </div>
                <div className="text-right">
                  <p className={`text-lg md:text-xl lg:text-2xl font-bold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {balance.toLocaleString()}€
                  </p>
                  <p className="text-gray-600">Disponible</p>
                </div>
              </div>
            ))
          ) : (
            <p>Aucun compte disponible pour cet utilisateur.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonCompteMDB;
