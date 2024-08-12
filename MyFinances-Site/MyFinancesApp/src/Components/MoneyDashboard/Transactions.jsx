import { useState, useEffect } from 'react';
import { FaTrash, FaPlusCircle } from 'react-icons/fa'; // Icons for delete and add

const Transactions = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transaction, setTransaction] = useState({ accountType: '', amount: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [sortBy, setSortBy] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  useEffect(() => {
    document.title = 'MyFinances - Vos opérations';

    // Get user_id from localStorage
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.error('User ID not found in localStorage');
      setLoading(false);
      return;
    }

    const fetchAccounts = async () => {
      try {
        const response = await fetch(`http://localhost:3000/accounts/${storedUserId}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des comptes');
        }
        const data = await response.json();
        setAccounts(data);

        // Fetch transactions after accounts are fetched
        const transactionsResponse = await fetch(`http://localhost:3000/transactions/${storedUserId}?account_type=${transaction.accountType}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
        if (!transactionsResponse.ok) {
          throw new Error('Erreur lors de la récupération des transactions');
        }
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [transaction.accountType, userId, sortBy, sortOrder]);

  const addTransaction = async () => {
    if (!userId) {
      console.error('User ID is not set');
      return;
    }

    const { accountType, amount, description } = transaction;

    if (!accountType || amount === '' || !description) {
      console.error('Tous les champs sont requis');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId, // Assurez-vous que le backend attend 'user_id'
          account_type: accountType, // Assurez-vous que le backend attend 'account_type'
          amount: parseFloat(amount),
          description: description
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur lors de l\'ajout de la transaction:', errorData);
        throw new Error('Erreur lors de l\'ajout de la transaction');
      }

      const updatedTransaction = await response.json();
      console.log('Transaction ajoutée:', updatedTransaction);

      // Update the state with the new transaction
      setTransactions(prevTransactions => [
        ...prevTransactions,
        { 
          id: updatedTransaction.id, // Assurez-vous que la réponse contient le bon ID
          amount: parseFloat(amount), 
          description: description,
          transaction_date: new Date().toISOString() // Assuming the date is the current date for simplicity
        }
      ]);

      setTransaction({ accountType: '', amount: '', description: '' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la transaction:', error);
    }
  };

  const deleteTransaction = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:3000/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur lors de la suppression de la transaction:', errorData);
        throw new Error('Erreur lors de la suppression de la transaction');
      }

      setTransactions(prevTransactions => prevTransactions.filter(tx => tx.id !== transactionId));
    } catch (error) {
      console.error('Erreur lors de la suppression de la transaction:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Gestion de vos Comptes</h1>
      {loading ? (
        <p className="text-center text-gray-600">Chargement des comptes...</p>
      ) : (
        <>
          {/* Section des comptes */}
          <div className="grid gap-6 mb-6 md:grid-cols-3">
            {accounts.map(account => (
              <div key={account.account_id} className="p-6 bg-white shadow-lg rounded-xl">
                <h2 className="text-2xl font-semibold mb-2 text-gray-900">{account.account_type}</h2>
                <p className="text-xl font-medium text-gray-700 mb-4">Solde: {account.balance.toFixed(2)}€</p>
              </div>
            ))}
          </div>

          {/* Section des transactions */}
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Transactions</h2>
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex mb-4">
              <div className="mr-4">
                <label className="block text-gray-700 mb-1">Trier par:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                >
                  <option value="transaction_date">Date</option>
                  <option value="amount">Montant</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Ordre:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                >
                  <option value="DESC">Descendant</option>
                  <option value="ASC">Ascendant</option>
                </select>
              </div>
            </div>
            {transactions.length > 0 ? (
              transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center mt-2 p-2 bg-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{tx.description}</p>
                    <p className={`text-sm ${tx.amount < 0 ? 'text-red-600' : 'text-gray-500'}`}>{tx.amount.toFixed(2)}€</p>
                    <p className="text-xs text-gray-500">Date: {new Date(tx.transaction_date).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-300"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600">Aucune transaction trouvée.</p>
            )}
          </div>

          {/* Formulaire d'ajout de transaction */}
          <div className="mt-8 p-6 bg-white shadow-lg rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Ajouter une Transaction</h2>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={transaction.description}
                onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                placeholder="Description"
                className="p-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                step="0.01"
                value={transaction.amount}
                onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
                placeholder="Montant"
                className="p-2 border border-gray-300 rounded-lg"
              />
              <select
                value={transaction.accountType}
                onChange={(e) => setTransaction({ ...transaction, accountType: e.target.value })}
                className="p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Sélectionnez un compte</option>
                {accounts.map(account => (
                  <option key={account.account_id} value={account.account_type}>
                    {account.account_type}
                  </option>
                ))}
              </select>
              <button
                onClick={addTransaction}
                className="bg-blue-500 text-white p-2 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out"
              >
                <div className="flex items-center justify-center gap-2">
                  <FaPlusCircle className="text-lg" />
                  <span>Ajouter</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Transactions;
