import React, { useState, useEffect } from 'react';
import * as CanvasJSReact from 'canvasjs-react-charts'; // Importation correcte de CanvasJS
import { Tooltip } from '@mui/material';
import { addDays, subMonths, subYears } from 'date-fns';

const CanvasJSChart = CanvasJSReact.CanvasJSChart; // Alias pour CanvasJSChart

const MonCompteMDB = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState({});
  const [showChart, setShowChart] = useState({});
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('user_id'); // Récupérer l'ID utilisateur depuis le localStorage

  // Fonction pour récupérer les comptes
  const fetchAccounts = async () => {
    try {
      const response = await fetch(`http://localhost:3000/accounts/${userId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des comptes');

      const accountsData = await response.json();
      setAccounts(accountsData);
      setLoading(false);

      // Récupérer les transactions de tous les comptes
      const allTransactions = {};
      await Promise.all(accountsData.map(async (account) => {
        const transactionsData = await fetchTransactions(account.account_id);
        allTransactions[account.account_id] = transactionsData;
      }));
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Erreur lors de la récupération des comptes:', error);
      setLoading(false);
    }
  };

  // Fonction pour récupérer les transactions d'un compte spécifique
  const fetchTransactions = async (account_id) => {
    try {
      const response = await fetch(`http://localhost:3000/transactions/account/${account_id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des transactions');
      const transactionsData = await response.json();
      return transactionsData.map((transaction) => ({
        ...transaction,
        amount: parseFloat(transaction.amount),
        transaction_date: new Date(transaction.transaction_date),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      return [];
    }
  };

  // Fonction pour filtrer les transactions selon la période sélectionnée
  const filterTransactionsByPeriod = (transactions, period) => {
    const now = new Date();
    let startDate;
    switch (period) {
      case 'semaine':
        startDate = addDays(now, -7);
        break;
      case 'mois':
        startDate = subMonths(now, 1);
        break;
      case 'six_mois':
        startDate = subMonths(now, 6);
        break;
      case 'annee':
        startDate = subYears(now, 1);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    return transactions.filter(transaction => transaction.transaction_date >= startDate);
  };

  // Gestion des périodes pour chaque compte (Semaine, Mois, 6 mois, Année)
  const handlePeriodChange = (account_id, period) => {
    setSelectedPeriod((prev) => ({ ...prev, [account_id]: period }));
  };

  // Gestion de l'affichage des graphiques pour chaque compte
  const toggleShowChart = (account_id) => {
    setShowChart((prev) => ({ ...prev, [account_id]: !prev[account_id] }));
  };

  useEffect(() => {
    fetchAccounts(); // Charger les comptes et leurs transactions au montage du composant
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 md:mb-6 lg:mb-8">Mes Comptes - MyFinances</h1>
      <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl bg-white shadow-md rounded-lg p-4 md:p-6 lg:p-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 mb-4">Soldes des Comptes</h2>
        <div className="space-y-4">
          {loading ? (
            <p>Chargement des comptes...</p>
          ) : accounts.length > 0 ? (
            accounts.map(({ account_id, account_type, balance }) => {
              const period = selectedPeriod[account_id] || 'mois';
              const chartVisible = showChart[account_id] || false;

              // Filtrer les transactions en fonction de la période sélectionnée
              const accountTransactions = transactions[account_id] || [];
              const filteredTransactions = filterTransactionsByPeriod(accountTransactions, period);

              // Cumul des montants des transactions pour montrer l'évolution du solde
              let cumulativeBalance = balance;
              const cumulativeTransactions = filteredTransactions
                .sort((a, b) => a.transaction_date - b.transaction_date)
                .map(transaction => {
                  cumulativeBalance += transaction.amount;
                  return { ...transaction, cumulativeBalance };
                });

              const chartData = cumulativeTransactions.map((transaction) => ({
                x: transaction.transaction_date,
                y: transaction.cumulativeBalance,
              }));

              const options = {
                animationEnabled: true,
                theme: "light2",
                title: {
                  text: "Évolution du Solde"
                },
                axisX: {
                  valueFormatString: "DD/MM/YYYY"
                },
                axisY: {
                  title: "Solde (€)",
                  includeZero: true
                },
                data: [{
                  type: "line",
                  xValueFormatString: "DD/MM/YYYY",
                  yValueFormatString: "#,##0.00€",
                  dataPoints: chartData
                }]
              };

              return (
                <div key={account_id} className="p-4 bg-gray-100 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center">
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

                  {/* Afficher le graphique */}
                  {chartVisible && (
                    <div className="mt-4">
                      <CanvasJSChart options={options} />
                    </div>
                  )}

                  {/* Bouton pour afficher/masquer le graphique */}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => toggleShowChart(account_id)}
                      className="text-sm font-bold text-blue-500 underline"
                    >
                      {chartVisible ? 'Masquer le graphique' : 'Afficher le graphique'}
                    </button>
                  </div>

                  {/* Périodes de visualisation sous le graphique */}
                  <div className="flex justify-center space-x-2 mt-4">
                    <button
                      onClick={() => handlePeriodChange(account_id, 'semaine')}
                      className={`px-4 py-2 text-sm font-bold rounded ${period === 'semaine' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    >
                      Semaine
                    </button>
                    <button
                      onClick={() => handlePeriodChange(account_id, 'mois')}
                      className={`px-4 py-2 text-sm font-bold rounded ${period === 'mois' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    >
                      Mois
                    </button>
                    <button
                      onClick={() => handlePeriodChange(account_id, 'six_mois')}
                      className={`px-4 py-2 text-sm font-bold rounded ${period === 'six_mois' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    >
                      6 Mois
                    </button>
                    <button
                      onClick={() => handlePeriodChange(account_id, 'annee')}
                      className={`px-4 py-2 text-sm font-bold rounded ${period === 'annee' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    >
                      Année
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>Aucun compte disponible pour cet utilisateur.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonCompteMDB;
