import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  ShieldCheck, Users, Cpu, CreditCard, Activity,
  Trash2, Plus, Edit3, Search, RefreshCw, Loader2,
  CheckCircle2, AlertTriangle, ArrowUpRight, TrendingUp,
  FileText, Shield, UserCheck, Lock, DollarSign, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'agents', 'logs'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [agentSearch, setAgentSearch] = useState('');

  // Agent Creation / Editing Modal states
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [agentFormData, setAgentFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: 'it',
    tier: 'free',
    price_month: 0,
    price_use: 0,
    system_prompt: '',
    input_schema: '{"prompt": "string"}',
    output_schema: '{"result": "string"}'
  });
  const [savingAgent, setSavingAgent] = useState(false);

  const loadAllData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsData, usersData, agentsData, logsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminAgents(),
        api.getAdminUsageLogs(50),
      ]);

      setStats(statsData);
      setUsersList(usersData);
      setAgentsList(agentsData);
      setUsageLogs(logsData);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données administratives.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Quick notification trigger
  const notifySuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // User Actions
  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = `Êtes-vous sûr de vouloir changer le rôle de ${targetUser.email} vers "${newRole.toUpperCase()}" ?`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.updateUserRole(targetUser.id, newRole);
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      notifySuccess(`Rôle de ${targetUser.email} mis à jour avec succès.`);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!confirm(`Confirmez-vous la suppression du compte de ${targetUser.email} ? Cette action est irréversible.`)) return;

    try {
      await api.deleteUser(targetUser.id);
      setUsersList(prev => prev.filter(u => u.id !== targetUser.id));
      notifySuccess(`Utilisateur ${targetUser.email} supprimé.`);
    } catch (err) {
      alert("Erreur de suppression : " + err.message);
    }
  };

  // Agent Actions
  const handleOpenCreateAgent = () => {
    setIsEditingAgent(false);
    setAgentFormData({
      id: '',
      name: '',
      description: '',
      category: 'marketing',
      tier: 'free',
      price_month: 0,
      price_use: 0,
      system_prompt: 'Tu es un assistant IA expert.',
      input_schema: '{"prompt": "string"}',
      output_schema: '{"result": "string"}'
    });
    setShowAgentModal(true);
  };

  const handleOpenEditAgent = (agent) => {
    setIsEditingAgent(true);
    setAgentFormData({
      id: agent.id,
      name: agent.name,
      description: agent.description || '',
      category: agent.category,
      tier: agent.tier,
      price_month: parseFloat(agent.price_month) || 0,
      price_use: parseFloat(agent.price_use) || 0,
      system_prompt: agent.system_prompt || '',
      input_schema: typeof agent.input_schema === 'object' ? JSON.stringify(agent.input_schema, null, 2) : (agent.input_schema || '{}'),
      output_schema: typeof agent.output_schema === 'object' ? JSON.stringify(agent.output_schema, null, 2) : (agent.output_schema || '{}')
    });
    setShowAgentModal(true);
  };

  const handleSaveAgent = async (e) => {
    e.preventDefault();
    setSavingAgent(true);
    try {
      let parsedInput = {};
      let parsedOutput = {};
      try {
        parsedInput = JSON.parse(agentFormData.input_schema);
      } catch (err) {
        alert("Format JSON invalide pour le schéma d'entrée (input_schema).");
        setSavingAgent(false);
        return;
      }
      try {
        parsedOutput = JSON.parse(agentFormData.output_schema);
      } catch (err) {
        alert("Format JSON invalide pour le schéma de sortie (output_schema).");
        setSavingAgent(false);
        return;
      }

      const payload = {
        name: agentFormData.name,
        description: agentFormData.description,
        category: agentFormData.category,
        tier: agentFormData.tier,
        price_month: parseFloat(agentFormData.price_month),
        price_use: parseFloat(agentFormData.price_use),
        system_prompt: agentFormData.system_prompt,
        input_schema: parsedInput,
        output_schema: parsedOutput
      };

      if (isEditingAgent) {
        await api.updateAdminAgent(agentFormData.id, payload);
        notifySuccess(`Agent ${agentFormData.name} mis à jour.`);
      } else {
        payload.id = agentFormData.id.trim().toLowerCase().replace(/\s+/g, '-');
        await api.createAdminAgent(payload);
        notifySuccess(`Nouvel agent ${payload.name} créé.`);
      }

      setShowAgentModal(false);
      loadAllData(true);
    } catch (err) {
      alert("Erreur lors de la sauvegarde : " + err.message);
    } finally {
      setSavingAgent(false);
    }
  };

  const handleDeleteAgent = async (agent) => {
    if (!confirm(`Supprimer définitivement l'agent "${agent.name}" (${agent.id}) ?`)) return;

    try {
      await api.deleteAdminAgent(agent.id);
      setAgentsList(prev => prev.filter(a => a.id !== agent.id));
      notifySuccess(`Agent ${agent.name} supprimé.`);
    } catch (err) {
      alert("Erreur lors de la suppression de l'agent : " + err.message);
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredAgents = agentsList.filter(a =>
    a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.category.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.tier.toLowerCase().includes(agentSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Panneau d'Administration</h1>
                <span className="text-[11px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded border border-red-500/40 uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Supervision globale, gestion des utilisateurs, des agents IA et suivi des revenus
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <button
              onClick={() => loadAllData(true)}
              disabled={refreshing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-red-400' : ''}`} />
              <span>Actualiser</span>
            </button>
            <button
              onClick={handleOpenCreateAgent}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/20 flex items-center space-x-1.5 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvel Agent IA</span>
            </button>
          </div>
        </div>

        {/* Notifications & Alerts */}
        {actionSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-lg animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-950/80 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-lg">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Users */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisateurs</span>
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{stats.total_users}</div>
              <div className="text-[11px] text-emerald-400 flex items-center space-x-1 mt-1 font-medium">
                <ArrowUpRight className="h-3 w-3" />
                <span>+{stats.users_this_month} ce mois-ci</span>
              </div>
            </div>

            {/* Total Agents */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agents IA</span>
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Cpu className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{stats.total_agents}</div>
              <div className="text-[11px] text-slate-400 mt-1">Disponibles au catalogue</div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abonnements</span>
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{stats.total_subscriptions}</div>
              <div className="text-[11px] text-amber-300 mt-1">Actifs en cours</div>
            </div>

            {/* Total Calls */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exécutions IA</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{stats.total_usage_calls}</div>
              <div className="text-[11px] text-emerald-400 flex items-center space-x-1 mt-1 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+{stats.calls_this_month} ce mois-ci</span>
              </div>
            </div>

            {/* Platform Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenu Global</span>
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{stats.total_revenue_eur.toFixed(2)} €</div>
              <div className="text-[11px] text-slate-400 mt-1">Consommation cumulée</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-800 pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Vue d'ensemble</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Utilisateurs ({usersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'agents'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Agents IA ({agentsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === 'logs'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Audit & Journaux</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Summary Card */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-red-400" />
                <span>Répartition de l'offre d'Agents IA</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Tiers Gratuits</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {agentsList.filter(a => a.tier === 'free').length}
                  </div>
                  <span className="text-[11px] text-slate-500">Accessibles à tous</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Tiers Premium</span>
                  <div className="text-2xl font-bold text-brand-400 mt-1">
                    {agentsList.filter(a => a.tier === 'premium').length}
                  </div>
                  <span className="text-[11px] text-slate-500">Abonnement + Usage</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Tiers Enterprise</span>
                  <div className="text-2xl font-bold text-purple-400 mt-1">
                    {agentsList.filter(a => a.tier === 'enterprise').length}
                  </div>
                  <span className="text-[11px] text-slate-500">Haute performance</span>
                </div>
              </div>

              {/* Recent Active Agents */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Top Agents par Abonnés</h3>
                <div className="space-y-2.5">
                  {agentsList.slice(0, 5).map(agent => (
                    <div key={agent.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white">{agent.name}</span>
                        <span className="text-slate-500 ml-2 font-mono">({agent.category})</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-amber-400 font-semibold">{agent.subscription_count || 0} abonnés</span>
                        <span className="text-slate-400">{agent.usage_count || 0} appels</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions & Security Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-400" />
                <span>Sécurité & Rôles</span>
              </h2>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Administrateurs</span>
                  <span className="font-bold text-red-400">
                    {usersList.filter(u => u.role === 'admin').length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Clients Standard</span>
                  <span className="font-bold text-blue-400">
                    {usersList.filter(u => u.role === 'user').length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleOpenCreateAgent}
                  className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter un Agent au Catalogue</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Gérer les Comptes Utilisateurs</span>
                </button>
                <Link
                  to="/catalog"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                >
                  <Cpu className="h-4 w-4" />
                  <span>Voir le Catalogue Public</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Users className="h-5 w-5 text-red-400" />
                <span>Gestion des Comptes Utilisateurs</span>
              </h2>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par email ou rôle..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Abonnements</th>
                    <th className="py-3 px-4">Appels IA</th>
                    <th className="py-3 px-4">Inscrit le</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500">#{u.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {u.email}
                        {u.id === user.id && (
                          <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                            (Vous)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {u.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">{u.subscription_count || 0}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">{u.usage_count || 0}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={u.id === user.id}
                          title={u.role === 'admin' ? "Rétrograder en utilisateur" : "Promouvoir en administrateur"}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700 transition-all inline-flex items-center space-x-1"
                        >
                          <Shield className="h-3 w-3" />
                          <span>{u.role === 'admin' ? '-> User' : '-> Admin'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === user.id}
                          title="Supprimer le compte"
                          className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900/80 disabled:opacity-30 text-red-400 text-[11px] font-bold rounded-lg border border-red-800/60 transition-all inline-flex items-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AGENTS MANAGEMENT */}
        {activeTab === 'agents' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-red-400" />
                <span>Gestion du Catalogue des Agents IA</span>
              </h2>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrer les agents..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  onClick={handleOpenCreateAgent}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-red-600/20 flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        {agent.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        agent.tier === 'free'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : agent.tier === 'premium'
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {agent.tier}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-md mb-1">{agent.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{agent.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-850">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Tarif : <strong className="text-white">{parseFloat(agent.price_month)} €/m</strong></span>
                      <span>Usage : <strong className="text-white">{parseFloat(agent.price_use)} €</strong></span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Abonnés : <strong className="text-amber-400">{agent.subscription_count || 0}</strong></span>
                      <span>Appels : <strong className="text-emerald-400">{agent.usage_count || 0}</strong></span>
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={() => handleOpenEditAgent(agent)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent)}
                        className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 text-xs font-bold rounded-lg border border-red-800/60 transition-all flex items-center justify-center"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileText className="h-5 w-5 text-red-400" />
              <span>Journaux d'Audit des Exécutions IA (50 derniers appels)</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">ID Log</th>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Agent IA</th>
                    <th className="py-3 px-4">Appels</th>
                    <th className="py-3 px-4">Coût (€)</th>
                    <th className="py-3 px-4">Horodatage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {usageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">#{log.id}</td>
                      <td className="py-3 px-4 font-semibold text-white">{log.user_email}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {log.agent_id}
                        </span>
                      </td>
                      <td className="py-3 px-4">{log.tokens_or_calls}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{log.cost.toFixed(4)} €</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {usageLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        Aucun journal d'activité enregistré pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── AGENT CREATE / EDIT MODAL ────────────────────────────────────── */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-red-400" />
                <span>{isEditingAgent ? `Modifier l'Agent : ${agentFormData.id}` : 'Créer un Nouvel Agent IA'}</span>
              </h3>
              <button
                onClick={() => setShowAgentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="p-6 space-y-4 text-xs">
              {!isEditingAgent && (
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Identifiant Unique (ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: code-auditor-agent"
                    value={agentFormData.id}
                    onChange={(e) => setAgentFormData(p => ({ ...p, id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-750 rounded-lg text-white font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Nom de l'Agent</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Auditeur de Code Sécurisé"
                  value={agentFormData.name}
                  onChange={(e) => setAgentFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-750 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Rôle et capacités de cet agent..."
                  value={agentFormData.description}
                  onChange={(e) => setAgentFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-750 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Catégorie</label>
                  <select
                    value={agentFormData.category}
                    onChange={(e) => setAgentFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-750 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="sales">Ventes (Sales)</option>
                    <option value="finance">Finance & Comptabilité</option>
                    <option value="hr">Ressources Humaines (HR)</option>
                    <option value="data">Data & BI</option>
                    <option value="legal">Légal & Conformité</option>
                    <option value="supply">Achats & Logistique</option>
                    <option value="support">Service Client</option>
                    <option value="it">IT & Développement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Palier (Tier)</label>
                  <select
                    value={agentFormData.tier}
                    onChange={(e) => setAgentFormData(p => ({ ...p, tier: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-750 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="free">Gratuit (Free)</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Prix Abonnement (€ / mois)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={agentFormData.price_month}
                    onChange={(e) => setAgentFormData(p => ({ ...p, price_month: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-750 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Prix par Appel (€ / usage)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={agentFormData.price_use}
                    onChange={(e) => setAgentFormData(p => ({ ...p, price_use: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-750 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Prompt Système (Instructions Gemini)</label>
                <textarea
                  rows={3}
                  placeholder="Consignes strictes pour le modèle IA..."
                  value={agentFormData.system_prompt}
                  onChange={(e) => setAgentFormData(p => ({ ...p, system_prompt: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-750 rounded-lg text-white font-mono text-[11px] focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Schéma d'Entrée (JSON)</label>
                  <textarea
                    rows={3}
                    value={agentFormData.input_schema}
                    onChange={(e) => setAgentFormData(p => ({ ...p, input_schema: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-750 rounded-lg text-white font-mono text-[11px] focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Schéma de Sortie (JSON)</label>
                  <textarea
                    rows={3}
                    value={agentFormData.output_schema}
                    onChange={(e) => setAgentFormData(p => ({ ...p, output_schema: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-750 rounded-lg text-white font-mono text-[11px] focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingAgent}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center space-x-2"
                >
                  {savingAgent ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Enregistrer l'Agent</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
