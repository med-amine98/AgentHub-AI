import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import AgentDetails from './pages/AgentDetails';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Payments from './pages/Payments';
import Contact from './pages/Contact';
import { api } from './utils/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          // Token expired or invalid
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={user} setUser={setUser} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/agents/:id" element={<AgentDetails user={user} />} />
            
            <Route
              path="/dashboard"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            
            <Route
              path="/payments"
              element={user ? <Payments user={user} /> : <Navigate to="/login" />}
            />
            
            <Route
              path="/login"
              element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/register"
              element={!user ? <Register setUser={setUser} /> : <Navigate to="/dashboard" />}
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} AgentHub AI. Tous droits réservés. Pair-programmed with Antigravity.</p>
        </footer>
      </div>
    </Router>
  );
}
