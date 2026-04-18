import React, { useState } from 'react';
import { Box, Container, Card, CardContent, TextField, Button, Typography, Tab, Tabs, CircularProgress, Alert } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import axios from 'axios';

function Login({ setAccount }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ownerName: '', email: '', accountType: 'SAVINGS', accountNumber: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/accounts', { ownerName: form.ownerName, email: form.email, accountType: form.accountType });
      setAccount(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/accounts/${form.accountNumber}`);
      setAccount(res.data);
    } catch (err) {
      setError('Account not found');
    }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #0d2137 50%, #0a0e1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <AccountBalanceIcon sx={{ fontSize: 60, color: '#00c853', mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>RK Bank</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
            Secure Banking on AWS EKS
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            {['Java Spring Boot', 'Node.js', 'React', 'AWS EKS', 'ArgoCD'].map(t => (
              <Box key={t} sx={{ px: 1.5, py: 0.3, borderRadius: 10, border: '1px solid rgba(0,200,83,0.3)', fontSize: '0.7rem', color: '#00c853' }}>{t}</Box>
            ))}
          </Box>
        </Box>

        <Card sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} centered sx={{ mb: 3, '& .Mui-selected': { color: '#00c853 !important' }, '& .MuiTabs-indicator': { backgroundColor: '#00c853' } }}>
              <Tab label="Login" sx={{ color: 'rgba(255,255,255,0.5)' }} />
              <Tab label="Open Account" sx={{ color: 'rgba(255,255,255,0.5)' }} />
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {tab === 0 ? (
              <Box component="form" onSubmit={handleLogin}>
                <TextField fullWidth label="Account Number" value={form.accountNumber}
                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                  margin="normal" required
                  sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
                />
                <Button type="submit" fullWidth variant="contained" disabled={loading}
                  sx={{ mt: 2, py: 1.5, background: 'linear-gradient(45deg, #00c853, #1565c0)' }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Access Account'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleCreate}>
                <TextField fullWidth label="Full Name" value={form.ownerName}
                  onChange={e => setForm({ ...form, ownerName: e.target.value })}
                  margin="normal" required
                  sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
                />
                <TextField fullWidth label="Email" type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  margin="normal" required
                  sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
                />
                <Button type="submit" fullWidth variant="contained" disabled={loading}
                  sx={{ mt: 2, py: 1.5, background: 'linear-gradient(45deg, #00c853, #1565c0)' }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Open Account'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'rgba(255,255,255,0.3)' }}>
          Built by Raghu Kongala • AWS EKS • Java Spring Boot • ArgoCD
        </Typography>
      </Container>
    </Box>
  );
}

export default Login;
