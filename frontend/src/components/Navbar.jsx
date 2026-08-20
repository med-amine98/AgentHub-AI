import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Cpu, LogIn, LogOut, LayoutDashboard, Compass, User } from 'lucide-react';
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-brand-500 font-bold text-xl">
              <Cpu className="h-8 w-8 text-brand-500" />
              <span>AgentHub AI</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link
              to="/catalog"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/catalog')
                  ? 'text-brand-500 bg-brand-50'
                  : 'text-gray-600 hover:text-brand-500 hover:bg-gray-50'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Catalogue</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'text-brand-500 bg-brand-50'
                      : 'text-gray-600 hover:text-brand-500 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <div className="h-5 w-px bg-gray-200"></div>

                {/* User Profile / Logout */}
                <div className="flex items-center space-x-3">
                  <span className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                    <User className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="truncate max-w-[150px] font-medium">{user.email}</span>
                    {user.role === 'admin' && (
                      <span className="ml-1.5 text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase">
                        Admin
                      </span>
                    )}
                  </span>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="h-5 w-px bg-gray-200"></div>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Connexion</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors"
                >
                  <span>S'inscrire</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
