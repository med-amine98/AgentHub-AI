import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AgentCard from '../components/AgentCard';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';

export default function Catalog() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [error, setError] = useState(null);

  // Categories list
  const categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Ressources Humaines' },
    { value: 'translation', label: 'Traduction' },
    { value: 'analytics', label: 'Analyse de Données' },
  ];

  // Tiers list
  const tiers = [
    { value: '', label: 'Tous les modèles' },
    { value: 'free', label: 'Gratuit' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Entreprise' },
  ];

  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        const data = await api.getAgents(selectedCategory, selectedTier);
        setAgents(data);
        setError(null);
      } catch (err) {
        setError("Erreur lors de la récupération des agents.");
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, [selectedCategory, selectedTier]);

  // Client-side search filtering
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) || 
                          agent.description.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Marché d'Agents d'IA
        </h1>
        <p className="text-gray-600 text-lg">
          Découvrez et abonnez-vous aux meilleurs agents spécialisés pour vos besoins professionnels.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un agent (ex: ROI, Slogan...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            >
              {tiers.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-center font-semibold">
          {error}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <SlidersHorizontal className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Aucun agent trouvé</h3>
          <p className="text-gray-500 text-sm">Modifiez vos critères de recherche ou de filtrage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAgents.map((agent) => (
            <div key={agent.id}>
              <AgentCard agent={agent} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
