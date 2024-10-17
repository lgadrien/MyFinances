import { useState, useEffect } from 'react';
import { FaTrash, FaPlusCircle } from 'react-icons/fa';

const Transactions = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transaction, setTransaction] = useState({ accountType: '', amount: '', description: '' });
  const [transfer, setTransfer] = useState({ sourceAccount: '', destinationAccount: '', amount: '' });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [sortBy, setSortBy] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    const fetchAccountsAndTransactions = async () => {
      setLoading(true);
      try {
        const storedUserId = localStorage.getItem('user_id');
        if (!storedUserId) {
          throw new Error('User ID not found in localStorage');
        }
        setUserId(storedUserId);

        const accountsResponse = await fetch(`http://localhost:3000/accounts/${storedUserId}`);
        if (!accountsResponse.ok) {
          throw new Error('Erreur lors de la récupération des comptes');
        }
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData);

        const transactionsResponse = await fetch(`http://localhost:3000/transactions/${storedUserId}?account_type=${selectedAccount}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
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

    fetchAccountsAndTransactions();
  }, [transaction.accountType, userId, sortBy, sortOrder, selectedAccount]);

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
          user_id: userId,
          account_type: accountType,
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

      setTransactions(prevTransactions => [
        ...prevTransactions,
        {
          id: updatedTransaction.id,
          amount: parseFloat(amount),
          description: description,
          transaction_date: new Date().toISOString()
        }
      ]);

      setTransaction({ accountType: '', amount: '', description: '' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la transaction:', error);
    }
  };

  const transferMoney = async () => {
    const { sourceAccount, destinationAccount, amount } = transfer;

    if (!sourceAccount || !destinationAccount || amount === '') {
      console.error('Tous les champs sont requis pour le transfert');
      return;
    }

    if (sourceAccount === destinationAccount) {
      console.error('Les comptes source et destination doivent être différents');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          source_account_id: sourceAccount,
          destination_account_id: destinationAccount,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur lors du transfert:', errorData);
        throw new Error('Erreur lors du transfert');
      }

      const transferResult = await response.json();
      console.log('Transfert effectué:', transferResult);

      setTransactions([...transactions, transferResult.transaction]);
      setAccounts(prevAccounts => prevAccounts.map(account => {
        if (account.account_id === transferResult.updatedSourceAccount.account_id) {
          return { ...account, balance: transferResult.updatedSourceAccount.balance };
        } else if (account.account_id === transferResult.updatedDestinationAccount.account_id) {
          return { ...account, balance: transferResult.updatedDestinationAccount.balance };
        }
        return account;
      }));

      setTransfer({ sourceAccount: '', destinationAccount: '', amount: '' });
    } catch (error) {
      console.error('Erreur lors du transfert:', error);
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
            {accounts.length === 0 ? (
              <p className="text-center text-gray-600">Aucun compte trouvé.</p>
            ) : (
              accounts.map(account => (
                <div key={account.account_id} className="p-6 bg-white shadow-lg rounded-xl">
                  <h2 className="text-2xl font-semibold mb-2 text-gray-900">{account.account_type}</h2>
                  <p className="text-xl font-medium text-gray-700 mb-4">Solde: {account.balance.toFixed(2)}€</p>
                </div>
              ))
            )}
          </div>

          {/* Section des transactions */}
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Historique des Transactions</h2>
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex mb-4 gap-4">
              <div className="flex-1">
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
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">Ordre:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                >
                  <option value="DESC">Décroissant</option>
                  <option value="ASC">Croissant</option>
                </select>
              </div>
            </div>
            {transactions.length === 0 ? (
              <p className="text-gray-600">Aucune transaction trouvée.</p>
            ) : (
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
            )}
          </div>

          {/* Ajout de transaction */}
          <h2 className="text-2xl font-bold mt-6 mb-4 text-gray-800">Ajouter une transaction</h2>
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Compte:</label>
                <select
                  value={transaction.accountType}
                  onChange={(e) => setTransaction({ ...transaction, accountType: e.target.value })}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                >
                  <option value="">Sélectionner un compte</option>
                  {accounts.map(account => (
                    <option key={account.account_id} value={account.account_type}>
                      {account.account_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Montant:</label>
                <input
                  type="number"
                  value={transaction.amount}
                  onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Description:</label>
                <input
                  type="text"
                  value={transaction.description}
                  onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                />
              </div>
            </div>
            <button
              onClick={addTransaction}
              className="mt-4 flex items-center justify-center w-full p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
            >
              <FaPlusCircle className="mr-2" /> Ajouter la transaction
            </button>
          </div>

          {/* Transfert entre comptes */}
          <h2 className="text-2xl font-bold mt-6 mb-4 text-gray-800">Transférer de l'argent</h2>
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Compte source:</label>
                <select
                  value={transfer.sourceAccount}
                  onChange={(e) => setTransfer({ ...transfer, sourceAccount: e.target.value })}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                >
                  <option value="">Sélectionner un compte</option>
                  {accounts.map(account => (
                    <option key={account.account_id} value={account.account_id}>
                      {account.account_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Compte destination:</label>
                <select
                  value={transfer.destinationAccount}
                  onChange={(e) => setTransfer({ ...transfer, destinationAccount: e.target.value })}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                >
                  <option value="">Sélectionner un compte</option>
                  {accounts.map(account => (
                    <option key={account.account_id} value={account.account_id}>
                      {account.account_type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Montant:</label>
                <input
                  type="number"
                  value={transfer.amount}
                  onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50 text-black"
                />
              </div>
            </div>
            <button
              onClick={transferMoney}
              className="mt-4 flex items-center justify-center w-full p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
            >
              <FaPlusCircle className="mr-2" /> Transférer
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Transactions;
