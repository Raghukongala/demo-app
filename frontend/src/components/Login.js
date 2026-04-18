import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Typography, Box,
  Alert, Tab, Tabs, CircularProgress, Grid, Card, CardContent
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Login() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '', lastName: '', email: '', username: '', password: ''
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(loginData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await register(registerData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: -100, left: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
      }} />

      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">

          {/* Left side - Branding */}
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', color: 'white', mb: 4 }}>
              {/* RK Avatar */}
              <Box sx={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3,
                boxShadow: '0 0 40px rgba(99,102,241,0.4)',
                fontSize: '2.5rem', fontWeight: 700, color: 'white',
              }}>
                K
              </Box>

              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                Kiran
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.7, mb: 1, color: '#10b981' }}>
                DevOps Engineer
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.6, mb: 4, maxWidth: 400, mx: 'auto' }}>
                Task Management System deployed on AWS EKS with Terraform, Jenkins CI/CD & ArgoCD GitOps
              </Typography>

              {/* Tech Stack Badges */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 4 }}>
                {['AWS EKS', 'Terraform', 'Jenkins', 'ArgoCD', 'Docker', 'K8s'].map((tech) => (
                  <Box key={tech} sx={{
                    px: 2, py: 0.5, borderRadius: 20,
                    border: '1px solid rgba(99,102,241,0.4)',
                    background: 'rgba(99,102,241,0.1)',
                    fontSize: '0.75rem', color: '#a5b4fc',
                  }}>
                    {tech}
                  </Box>
                ))}
              </Box>

              {/* Stats */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>4+</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>Microservices</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#6366f1' }}>EKS</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>Kubernetes</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#f59e0b' }}>CI/CD</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>Automated</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right side - Login Form */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              maxWidth: 500, mx: 'auto', borderRadius: 3,
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Sign in to your account or create a new one
                  </Typography>
                </Box>

                <Tabs
                  value={tab}
                  onChange={(e, newValue) => setTab(newValue)}
                  centered
                  sx={{
                    mb: 3,
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)' },
                    '& .Mui-selected': { color: '#10b981 !important' },
                    '& .MuiTabs-indicator': { backgroundColor: '#10b981' },
                  }}
                >
                  <Tab label="Sign In" />
                  <Tab label="Sign Up" />
                </Tabs>

                {error && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <TabPanel value={tab} index={0}>
                  <Box component="form" onSubmit={handleLogin}>
                    <TextField
                      fullWidth label="Email" type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      margin="normal" required sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                      }}
                    />
                    <TextField
                      fullWidth label="Password" type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      margin="normal" required sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                      }}
                    />
                    <Button type="submit" fullWidth variant="contained" disabled={loading}
                      sx={{
                        py: 1.5, fontSize: '1.1rem',
                        background: 'linear-gradient(45deg, #6366f1 30%, #10b981 90%)',
                        '&:hover': { background: 'linear-gradient(45deg, #4f46e5 30%, #059669 90%)' }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>
                  </Box>
                </TabPanel>

                <TabPanel value={tab} index={1}>
                  <Box component="form" onSubmit={handleRegister}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField fullWidth label="First Name"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                          required sx={{
                            '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Last Name"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                          required sx={{
                            '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                          }}
                        />
                      </Grid>
                    </Grid>
                    <TextField fullWidth label="Username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      margin="normal" required sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                      }}
                    />
                    <TextField fullWidth label="Email" type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      margin="normal" required sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                      }}
                    />
                    <TextField fullWidth label="Password" type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      margin="normal" required sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                      }}
                    />
                    <Button type="submit" fullWidth variant="contained" disabled={loading}
                      sx={{
                        py: 1.5, fontSize: '1.1rem',
                        background: 'linear-gradient(45deg, #6366f1 30%, #10b981 90%)',
                        '&:hover': { background: 'linear-gradient(45deg, #4f46e5 30%, #059669 90%)' }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                    </Button>
                  </Box>
                </TabPanel>
              </CardContent>
            </Card>

            {/* Footer */}
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'rgba(255,255,255,0.3)' }}>
              Built by Kiran • AWS EKS • Terraform • Jenkins • ArgoCD
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Login;
