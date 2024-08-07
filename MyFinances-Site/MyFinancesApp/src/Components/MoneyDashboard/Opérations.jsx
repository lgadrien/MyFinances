import { useState, useEffect } from 'react';
import { FaTrash, FaPlusCircle } from 'react-icons/fa'; // Icons for delete and add

const HomeMDB = () => {
  const [accounts, setAccounts] = useState([
    { id: 1, name: 'Compte courant', balance: 1200, transactions: [] },
    { id: 2, name: 'Livret A', balance: 3000, transactions: [] },
    { id: 3, name: 'Compte épargne', balance: 1500, transactions: [] }
  ]);

  const [transaction, setTransaction] = useState({ accountId: 1, amount: '', description: '' });

  useEffect(() => {
    document.title = 'MyFinances - Vos opérations';
  }, []);

  const addTransaction = () => {
    setAccounts(prevAccounts => {
      return prevAccounts.map(account => {
        if (account.id === parseInt(transaction.accountId)) {
          return {
            ...account,
            balance: account.balance + parseFloat(transaction.amount),
            transactions: [
              ...account.transactions,
              { id: Date.now(), amount: parseFloat(transaction.amount), description: transaction.description }
            ]
          };
        }
        return account;
      });
    });
    setTransaction({ accountId: 1, amount: '', description: '' });
  };

  const deleteTransaction = (accountId, transactionId) => {
    setAccounts(prevAccounts => {
      return prevAccounts.map(account => {
        if (account.id === accountId) {
          const transactionToDelete = account.transactions.find(tx => tx.id === transactionId);
          return {
            ...account,
            balance: account.balance - transactionToDelete.amount,
            transactions: account.transactions.filter(tx => tx.id !== transactionId)
          };
        }
        return account;
      });
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Gestion de vos Comptes</h1>
      <div className="grid gap-6 mb-6 md:grid-cols-3">
        {accounts.map(account => (
          <div key={account.id} className="p-6 bg-white shadow-lg rounded-xl">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">{account.name}</h2>
            <p className="text-xl font-medium text-gray-700 mb-4">Solde: {account.balance.toFixed(2)}€</p>
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2 text-gray-800">Transactions:</h3>
              {account.transactions.length > 0 ? (
                account.transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center mt-2 p-2 bg-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{tx.description}</p>
                      <p className="text-sm text-gray-500">{tx.amount.toFixed(2)}€</p>
                    </div>
                    <button
                      onClick={() => deleteTransaction(account.id, tx.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Aucune transaction</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Ajouter une transaction</h2>
      <div className="p-6 bg-white shadow-lg rounded-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTransaction();
          }}
        >
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Compte:</label>
            <select
              value={transaction.accountId}
              onChange={(e) => setTransaction({ ...transaction, accountId: e.target.value })}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50"
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Montant:</label>
            <input
              type="number"
              value={transaction.amount}
              onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description:</label>
            <input
              type="text"
              value={transaction.description}
              onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50"
              required
            />
          </div>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <FaPlusCircle className="mr-2" />
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );  
};

export default HomeMDB;
