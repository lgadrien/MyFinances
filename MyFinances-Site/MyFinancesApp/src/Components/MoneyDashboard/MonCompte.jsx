import React, { useEffect, useState } from 'react';
import { Tooltip } from '@mui/material';

const MonCompteMDB = ({ userId }) => {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  const accountDetails = {
    principal: 'Compte courant standard, pas d\'intérêt.',
    livretA: 'Livret A - Taux d\'intérêt: 0.5% annuel, plafonné à 22 950€.',
    livretJeune: 'Livret Jeune - Taux d\'intérêt: 2%, réservé aux 12-25 ans, plafonné à 1 600€.'
  };

  useEffect(() => {
    document.title = 'MyFinances - Mon Compte';

    fetch(`http://localhost:3000/accounts/${userId}`)
      .then(response => response.json())
      .then(data => {
        setBalances(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des comptes:", error);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <p>Chargement des données...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 md:mb-6 lg:mb-8">Mes Comptes - MyFinances</h1>
      <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl bg-white shadow-md rounded-lg p-4 md:p-6 lg:p-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 mb-4">Soldes des Comptes</h2>
        <div className="space-y-4">
          {Object.entries(balances).map(([accountType, balance]) => (
            <div key={accountType} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
              <div className="flex items-center">
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 capitalize">
                  {accountType === 'principal' ? 'Compte Principal' : accountType}
                </h3>
                <Tooltip title={accountDetails[accountType]} arrow>
                  <span className="ml-2 text-gray-500 cursor-pointer">
                    <i className="fas fa-info-circle" aria-hidden="true"></i>
                    <span className="sr-only">Informations sur {accountType}</span>
                  </span>
                </Tooltip>
              </div>
              <div className="text-right">
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-green-600">€{balance.toLocaleString()}</p>
                <p className="text-gray-600">Disponible</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonCompteMDB;
