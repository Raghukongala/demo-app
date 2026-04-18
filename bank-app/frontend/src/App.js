import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00c853' },
    secondary: { main: '#1565c0' },
    background: { default: '#0a0e1a', paper: '#0d1b2a' },
  },
  typography: { fontFamily: '"Inter", "Roboto", sans-serif' },
  shape: { borderRadius: 12 },
});

function App() {
  const [account, setAccount] = useState(null);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {account ? <Dashboard account={account} setAccount={setAccount} /> : <Login setAccount={setAccount} />}
    </ThemeProvider>
  );
}

export default App;
