import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Cpu, LogIn, LogOut, LayoutDashboard, Compass, User, CreditCard, Tag, Mail } from 'lucide-react';
import { api } from '../utils/api';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-brand-900 border-b border-brand-800 sticky top-0 z-50 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 text-brand-100 font-bold text-xl">
                <Cpu className="h-8 w-8 text-brand-200" />
                <span>AgentHub AI</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <Link
                to="/catalog"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/catalog')
                    ? 'text-brand-100 bg-brand-800'
                    : 'text-brand-300 hover:text-brand-100 hover:bg-brand-800'
                }`}
              >
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Catalogue</span>
              </Link>

              <Link
                to="/pricing"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/pricing')
                    ? 'text-brand-100 bg-brand-800'
                    : 'text-brand-300 hover:text-brand-100 hover:bg-brand-800'
                }`}
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Tarifs</span>
              </Link>

              <Link
                to="/contact"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/contact')
                    ? 'text-brand-100 bg-brand-800'
                    : 'text-brand-300 hover:text-brand-100 hover:bg-brand-800'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'text-brand-100 bg-brand-800'
                        : 'text-brand-300 hover:text-brand-100 hover:bg-brand-800'
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>

                  <Link
                    to="/payments"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/payments')
                        ? 'text-brand-100 bg-brand-800'
                        : 'text-brand-300 hover:text-brand-100 hover:bg-brand-800'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Paiement</span>
                  </Link>

                  <div className="h-5 w-px bg-brand-700" />

                  {/* User Profile / Logout */}
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center text-sm text-brand-200 bg-brand-800 px-3 py-1.5 rounded-full border border-brand-700">
                      <User className="h-3.5 w-3.5 mr-1.5 text-brand-300" />
                      <span className="truncate max-w-[150px] font-medium hidden lg:inline">{user.email}</span>
                      {user.role === 'admin' && (
                        <span className="ml-1.5 text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase">
                          Admin
                        </span>
                      )}
                    </span>

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-900/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Déconnexion</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-5 w-px bg-brand-700" />
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium text-brand-200 hover:bg-brand-800 border border-brand-600 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Connexion</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                  >
                    <span className="hidden sm:inline">S'inscrire</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
  );

}
