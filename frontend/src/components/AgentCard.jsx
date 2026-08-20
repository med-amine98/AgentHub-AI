import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Flame } from 'lucide-react';

export default function AgentCard({ agent }) {
  // Category French Labels and Icons
  const categoryConfig = {
    marketing: { label: 'Marketing', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    finance: { label: 'Finance', color: 'bg-green-50 text-green-700 border-green-200' },
    hr: { label: 'Ressources Humaines', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    translation: { label: 'Traduction', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    analytics: { label: 'Analyse Données', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  const category = categoryConfig[agent.category] || { label: agent.category, color: 'bg-gray-50 text-gray-700 border-gray-200' };

  // Tier Colors
  const tierConfig = {
    free: { label: 'Gratuit', color: 'bg-emerald-100 text-emerald-800', icon: null },
    premium: { label: 'Premium', color: 'bg-blue-100 text-blue-800', icon: Star },
    enterprise: { label: 'Entreprise', color: 'bg-indigo-100 text-indigo-800', icon: ShieldCheck },
  };

  const tier = tierConfig[agent.tier] || { label: agent.tier, color: 'bg-gray-100 text-gray-800', icon: null };
  const TierIcon = tier.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden">
      {/* Category header */}
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${category.color}`}>
            {category.label}
          </span>
          <span className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${tier.color}`}>
            {TierIcon && <TierIcon className="h-3 w-3 mr-0.5" />}
            {tier.label}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate-2-lines h-12">
          {agent.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {agent.description}
        </p>
      </div>

      {/* Pricing / CTA */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Modèle</span>
          <span className="text-sm font-bold text-gray-900">
            {agent.tier === 'free' ? (
              'Sans frais'
            ) : (
              <>
                {parseFloat(agent.price_month)} € / mois
                <span className="text-[10px] text-gray-500 font-normal block">
                  + {parseFloat(agent.price_use)} € / appel
                </span>
              </>
            )}
          </span>
        </div>

        <Link
          to={`/agents/${agent.id}`}
          className="inline-flex items-center space-x-1 text-brand-500 font-bold text-sm hover:text-brand-600 transition-colors"
        >
          <span>Essayer</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
