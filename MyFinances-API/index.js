const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const moment = require('moment');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myfinances',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la base de données: ' + err.message);
    process.exit(1);
  } else {
    console.log('Connecté à la base de données MySQL.');
  }
});

// Route de connexion
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const sql = `SELECT user_id, name, email, date_of_birth FROM Users WHERE email = ? AND password = ?`;
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'email:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = results[0];
    console.log('Utilisateur connecté:', user);
    res.json({
      message: 'Connexion réussie',
      user
    });
  });
});

// Routes pour les Utilisateurs
app.post('/users', (req, res) => {
  const { name, email, password, date_of_birth } = req.body;

  if (!name || !email || !password || !date_of_birth) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  db.beginTransaction(err => {
    if (err) {
      console.error('Erreur lors du début de la transaction:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    const insertUserSql = `INSERT INTO Users (name, email, password, date_of_birth) VALUES (?, ?, ?, ?)`;
    db.query(insertUserSql, [name, email, password, date_of_birth], (err, result) => {
      if (err) {
        console.error('Erreur lors de la création de l\'utilisateur:', err.message);
        return db.rollback(() => {
          res.status(500).json({ error: 'Erreur serveur' });
        });
      }

      const userId = result.insertId;
      const age = moment().diff(moment(date_of_birth), 'years');
      console.log(`Utilisateur créé avec ID ${userId}. Age calculé: ${age} ans.`);

      let accounts = [
        { account_type: 'Compte courant', balance: 0.00 },
        { account_type: 'Livret A', balance: 0.00 }
      ];

      if (age <= 25) {
        accounts.push({ account_type: 'Livret jeune', balance: 0.00 });
      }

      const accountQueries = accounts.map(account =>
        new Promise((resolve, reject) =>
          db.query(
            `INSERT INTO Accounts (user_id, account_type, balance) VALUES (?, ?, ?)`,
            [userId, account.account_type, account.balance],
            (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            }
          )
        )
      );

      Promise.all(accountQueries)
        .then(() => {
          console.log(`Comptes créés pour l'utilisateur ${userId}`);
          db.commit(err => {
            if (err) {
              console.error('Erreur lors de la validation de la transaction:', err.message);
              return db.rollback(() => {
                res.status(500).json({ error: 'Erreur serveur' });
              });
            }
            res.status(201).json({ message: 'Utilisateur créé avec les comptes appropriés', userId });
          });
        })
        .catch(err => {
          console.error('Erreur lors de la création des comptes:', err.message);
          db.rollback(() => {
            res.status(500).json({ error: 'Erreur serveur' });
          });
        });
    });
  });
});

app.get('/users', (req, res) => {
  console.log('Récupération de tous les utilisateurs');

  const sql = `SELECT user_id, name, email, date_of_birth FROM Users`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    console.log('Utilisateurs récupérés:', results);
    res.json(results);
  });
});

app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  console.log(`Récupération de l'utilisateur avec ID ${userId}`);

  const sql = `SELECT user_id, name, email, date_of_birth FROM Users WHERE user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    if (results.length === 0) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.log('Utilisateur récupéré:', results[0]);
    res.json(results[0]);
  });
});

app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email, date_of_birth } = req.body;
  console.log(`Mise à jour de l'utilisateur avec ID ${userId}`, req.body);

  const updates = [];
  const values = [];

  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (date_of_birth) {
    updates.push('date_of_birth = ?');
    values.push(date_of_birth);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
  }

  values.push(userId);

  const sql = `UPDATE Users SET ${updates.join(', ')} WHERE user_id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    console.log('Utilisateur mis à jour');
    res.json({ message: 'Utilisateur mis à jour' });
  });
});

app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  console.log(`Suppression de l'utilisateur avec ID ${userId}`);

  const sql = `DELETE FROM Users WHERE user_id = ?`;
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    console.log('Utilisateur supprimé');
    res.json({ message: 'Utilisateur supprimé' });
  });
});

// Routes pour les Comptes
app.post('/accounts', (req, res) => {
  const { user_id, account_type, balance } = req.body;
  console.log(`Création d'un compte pour l'utilisateur ID ${user_id} avec type ${account_type}`);

  const sql = `INSERT INTO Accounts (user_id, account_type, balance) VALUES (?, ?, ?)`;
  db.query(sql, [user_id, account_type, balance], (err, result) => {
    if (err) {
      console.error('Erreur lors de la création du compte:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    console.log(`Compte créé avec ID ${result.insertId}`);
    res.status(201).json({ message: 'Compte créé', accountId: result.insertId });
  });
});

app.get('/accounts/:user_id', (req, res) => {
  const userId = req.params.user_id;
  console.log(`Récupération des comptes pour l'utilisateur ID ${userId}`);

  const sql = `SELECT account_id, account_type, balance FROM Accounts WHERE user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des comptes:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    console.log('Comptes récupérés:', results);
    res.json(results);
  });
});

app.put('/accounts/:id', (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;
  console.log(`Mise à jour du compte avec ID ${accountId}. Nouveau solde: ${balance}`);

  const sql = `UPDATE Accounts SET balance = ? WHERE account_id = ?`;
  db.query(sql, [balance, accountId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du compte:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    console.log('Compte mis à jour');
    res.json({ message: 'Compte mis à jour' });
  });
});

app.delete('/accounts/:id', (req, res) => {
  const accountId = req.params.id;
  console.log(`Suppression du compte avec ID ${accountId}`);

  const sql = `DELETE FROM Accounts WHERE account_id = ?`;
  db.query(sql, [accountId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression du compte:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    console.log('Compte supprimé');
    res.json({ message: 'Compte supprimé' });
  });
});

// Route pour récupérer les transactions d'un utilisateur basé sur account_type avec options de tri
app.get('/transactions/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { account_type } = req.query;
  const { sortBy = 'transaction_date', sortOrder = 'DESC' } = req.query;

  if (!account_type) {
    return res.status(400).json({ error: 'Type de compte manquant' });
  }

  const getAccountIdSql = `SELECT account_id FROM Accounts WHERE user_id = ? AND account_type = ?`;
  db.query(getAccountIdSql, [user_id, account_type], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'ID du compte:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    const account_id = results[0].account_id;

    const getTransactionsSql = `
      SELECT t.*, a.account_type 
      FROM Transactions t 
      JOIN Accounts a ON t.account_id = a.account_id
      WHERE t.account_id = ? 
      ORDER BY t.${sortBy} ${sortOrder}
    `;
    db.query(getTransactionsSql, [account_id], (err, transactions) => {
      if (err) {
        console.error('Erreur lors de la récupération des transactions:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      res.json(transactions);
    });
  });
});

// Ajouter une transaction
app.post('/transactions/', (req, res) => {
  const { user_id, account_type, amount, description } = req.body;

  if (!user_id || !account_type || amount === undefined || amount === null || !description) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  const getAccountIdSql = `SELECT account_id FROM Accounts WHERE user_id = ? AND account_type = ?`;
  db.query(getAccountIdSql, [user_id, account_type], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'ID du compte:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    const account_id = results[0].account_id;
    const insertTransactionSql = `INSERT INTO Transactions (account_id, amount, description, transaction_date) VALUES (?, ?, ?, ?)`;
    const transaction_date = new Date().toISOString();
    db.query(insertTransactionSql, [account_id, amount, description, transaction_date], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'ajout de la transaction:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      console.log(`Transaction ajoutée avec ID ${result.insertId}`);
      res.status(201).json({ message: 'Transaction ajoutée', transactionId: result.insertId });
    });
  });
});

// Supprimer une transaction
app.delete('/transactions/:transactionId', (req, res) => {
  const transactionId = req.params.transactionId;
  console.log(`Suppression de la transaction avec ID ${transactionId}`);

  const sql = `DELETE FROM Transactions WHERE transaction_id = ?`;
  db.query(sql, [transactionId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de la transaction:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    console.log('Transaction supprimée');
    res.json({ message: 'Transaction supprimée' });
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
