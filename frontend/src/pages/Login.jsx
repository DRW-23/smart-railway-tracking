import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

// Normalize role from different backend shapes
const getUserRole = (userObj) => {
  if (!userObj) return '';
  // Common places roles may live
  const raw = userObj.role ?? userObj.roles ?? userObj.authorities;

  const toStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.name || val.authority || val.role || '';
    return String(val);
  };

  if (Array.isArray(raw)) {
    const s = raw.map(toStr).join(',').toLowerCase();
    if (s.includes('passenger') || s.includes('user')) return 'passenger';
    if (s.includes('train') || s.includes('master') || s.includes('admin')) return 'trainmaster';
    return '';
  }

  const s = toStr(raw).toLowerCase();
  if (s.includes('passenger') || s === 'user') return 'passenger';
  if (s.includes('train') || s.includes('master') || s.includes('admin')) return 'trainmaster';
  return '';
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      const data = res?.data ?? {};
      const user = (data.user ?? data) || {};

      if (user.email) localStorage.setItem('email', user.email);
      if (user.id) localStorage.setItem('userId', String(user.id));

      const role = getUserRole(user) || 'passenger'; // default to passenger
      localStorage.setItem('role', role);

      // IMPORTANT: change this path to your actual passenger dashboard route
      if (role === 'trainmaster') {
        navigate('/trainmaster-dashboard', { replace: true });
      } else {
        navigate('/passenger-dashboard', { replace: true }); // <- your passenger route
      }
    } catch (err) {
      console.error('Login error:', err);
      alert(err?.response?.data || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;