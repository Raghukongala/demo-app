const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL || 'http://account-service:8080';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3002';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb-service:27017/bankdb')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

const transactionSchema = new mongoose.Schema({
  fromAccount: String,
  toAccount: String,
  amount: Number,
  type: { type: String, enum: ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL'] },
  status: { type: String, default: 'SUCCESS' },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'transaction-service' }));

app.post('/api/transactions/transfer', async (req, res) => {
  try {
    const { fromAccount, toAccount, amount, description } = req.body;

    await axios.put(`${ACCOUNT_SERVICE_URL}/api/accounts/${fromAccount}/withdraw`, { amount });
    await axios.put(`${ACCOUNT_SERVICE_URL}/api/accounts/${toAccount}/deposit`, { amount });

    const transaction = await Transaction.create({ fromAccount, toAccount, amount, type: 'TRANSFER', description });

    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/transaction`, {
      fromAccount, toAccount, amount, transactionId: transaction._id
    }).catch(() => {});

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.response?.data?.error || err.message });
  }
});

app.get('/api/transactions/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;
  const transactions = await Transaction.find({
    $or: [{ fromAccount: accountNumber }, { toAccount: accountNumber }]
  }).sort({ createdAt: -1 }).limit(20);
  res.json(transactions);
});

app.listen(PORT, () => console.log(`Transaction service running on port ${PORT}`));
