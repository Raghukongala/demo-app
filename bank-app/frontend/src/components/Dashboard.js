import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, TextField, Button, CircularProgress, Alert, Chip, Divider } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';

function Dashboard({ account, setAccount }) {
  const [transactions, setTransactions] = useState([]);
  const [transfer, setTransfer] = useState({ toAccount: '', amount: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState(account.balance);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`/api/transactions/${account.accountNumber}`);
      setTransactions(res.data);
    } catch (err) {}
  };

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`/api/accounts/${account.accountNumber}`);
      setBalance(res.data.balance);
    } catch (err) {}
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/transactions/transfer', {
        fromAccount: account.accountNumber,
        toAccount: transfer.toAccount,
        amount: parseFloat(transfer.amount),
        description: transfer.description
      });
      setSuccess(`₹${transfer.amount} transferred successfully!`);
      setTransfer({ toAccount: '', amount: '', description: '' });
      fetchTransactions();
      fetchBalance();
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0e1a', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon sx={{ color: '#00c853', fontSize: 35 }} />
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>RK Bank</Typography>
          </Box>
          <Button startIcon={<LogoutIcon />} onClick={() => setAccount(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Logout
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Account Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ background: 'linear-gradient(135deg, #00c853, #1565c0)', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Account Number</Typography>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>{account.accountNumber}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Balance</Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>₹{parseFloat(balance).toFixed(2)}</Typography>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{account.ownerName}</Typography>
                <Chip label={account.accountType} size="small" sx={{ mt: 1, background: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </CardContent>
            </Card>
          </Grid>

          {/* Transfer */}
          <Grid item xs={12} md={8}>
            <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 700 }}>Transfer Money</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <Box component="form" onSubmit={handleTransfer}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="To Account Number" value={transfer.toAccount}
                        onChange={e => setTransfer({ ...transfer, toAccount: e.target.value })} required
                        sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Amount (₹)" type="number" value={transfer.amount}
                        onChange={e => setTransfer({ ...transfer, amount: e.target.value })} required
                        sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Description" value={transfer.description}
                        onChange={e => setTransfer({ ...transfer, description: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" startIcon={<SendIcon />} disabled={loading}
                        sx={{ background: 'linear-gradient(45deg, #00c853, #1565c0)', py: 1.5, px: 4 }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Transfer'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Transactions */}
          <Grid item xs={12}>
            <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 700 }}>Transaction History</Typography>
                {transactions.length === 0 ? (
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', py: 3 }}>No transactions yet</Typography>
                ) : (
                  transactions.map(t => (
                    <Box key={t._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box>
                        <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>{t.description || t.type}</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                          {t.fromAccount === account.accountNumber ? `To: ${t.toAccount}` : `From: ${t.fromAccount}`}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: t.fromAccount === account.accountNumber ? '#ef4444' : '#00c853', fontWeight: 700 }}>
                        {t.fromAccount === account.accountNumber ? '-' : '+'}₹{t.amount}
                      </Typography>
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;
