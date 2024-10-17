import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Questionnaire = () => {
  const [balances, setBalances] = useState({});
  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer les comptes de l'utilisateur à partir de l'API
    const userId = localStorage.getItem('user_id');
    if (userId) {
      fetch(`http://localhost:3000/accounts/${userId}`)
        .then(response => response.json())
        .then(data => {
          setAccounts(data);
          // Initialiser le solde de chaque compte à 0
          const initialBalances = {};
          data.forEach(account => {
            initialBalances[account.account_type] = 0; // Crée un objet avec les types de compte comme clés
          });
          setBalances(initialBalances);
        })
        .catch(error => console.error('Erreur lors de la récupération des comptes:', error));
    }
  }, []);

  const handleChange = (e, accountType) => {
    const { value } = e.target;
    setBalances(prevBalances => ({
      ...prevBalances,
      [accountType]: value, // Met à jour le solde pour le type de compte spécifique
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Mettre à jour chaque compte avec le solde correspondant
      await Promise.all(accounts.map(async (account) => {
        const response = await fetch(`http://localhost:3000/accounts/${account.account_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ balance: balances[account.account_type] }), // Utilise le solde spécifique pour chaque compte
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour du compte');
        }
      }));

      alert('Tous les comptes ont été mis à jour avec succès');
      navigate('/my-account'); // Redirige vers la page des comptes
    } catch (error) {
      console.error('Erreur lors de la mise à jour des comptes:', error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Configurer votre solde initial</h2>
        <form onSubmit={handleSubmit}>
          {accounts.map((account) => (
            <div className="mb-4" key={account.account_id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solde pour {account.account_type}
              </label>
              <input
                type="number"
                value={balances[account.account_type] || ''}
                onChange={(e) => handleChange(e, account.account_type)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-gray-200"
                placeholder={`Entrer un solde pour ${account.account_type}`}
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-800 transition-colors duration-300"
          >
            Valider
          </button>
        </form>
      </div>
    </div>
  );
};

export default Questionnaire;
