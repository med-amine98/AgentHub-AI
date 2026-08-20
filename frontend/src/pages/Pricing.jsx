import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Zap, Star, ShieldCheck, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    subtitle: 'Pour les indépendants',
    price: 'Gratuit',
    priceDetail: '0 € / mois',
    highlight: false,
    features: [
      { text: 'Accès aux agents gratuits (Free)', included: true },
      { text: 'Exécutions illimitées sur agents gratuits', included: true },
      { text: 'Playground interactif', included: true },
      { text: 'Agents Premium & Enterprise', included: false },
      { text: 'Workflows multi-agents', included: false },
      { text: 'Support prioritaire', included: false },
      { text: 'API dédiée', included: false },
    ],
    cta: "Commencer gratuitement",
    icon: Zap,
    color: 'brand',
  },
  {
    name: 'Professional',
    subtitle: 'Pour les équipes & PME',
    price: '49 €',
    priceDetail: '/ mois par utilisateur',
    highlight: true,
    features: [
      { text: 'Accès aux agents gratuits (Free)', included: true },
      { text: 'Accès aux agents Premium', included: true },
      { text: 'Workflows multi-agents illimités', included: true },
      { text: 'Playground interactif', included: true },
      { text: 'Dashboard & Analytics', included: true },
      { text: 'Support prioritaire (24h)', included: true },
      { text: 'Agents Enterprise', included: false },
    ],
    cta: "Choisir Professional",
    icon: Star,
    color: 'brand',
  },
  {
    name: 'Enterprise',
    subtitle: 'Pour les grandes organisations',
    price: 'Sur mesure',
    priceDetail: 'Tarif annuel négocié',
    highlight: false,
    features: [
      { text: 'Accès à tous les agents (Free + Premium + Enterprise)', included: true },
      { text: 'Workflows multi-agents illimités', included: true },
      { text: 'API dédiée & webhooks', included: true },
      { text: 'SSO & gestion des rôles', included: true },
      { text: 'SLA garanti 99.9%', included: true },
      { text: 'Support dédié (Account Manager)', included: true },
      { text: 'Déploiement on-premise possible', included: true },
    ],
    cta: "Nous contacter",
    icon: ShieldCheck,
    color: 'indigo',
  },
];

export default function Pricing() {
  return (
    <div className="bg-gradient-to-b from-brand-50 to-white min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Tarification simple et transparente
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Commencez gratuitement, puis évoluez vers un plan adapté à la taille et aux besoins de votre organisation. Aucune surprise.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-200 ${
                  plan.highlight
                    ? 'border-brand-500 shadow-lg shadow-brand-500/10 scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-0 right-0 bg-brand-500 text-white text-center text-xs font-bold py-1.5 uppercase tracking-wider">
                    Le plus populaire
                  </div>
                )}

                <div className={`p-8 ${plan.highlight ? 'pt-12' : ''}`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${plan.highlight ? 'bg-brand-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-6 w-6 ${plan.highlight ? 'text-brand-500' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500">{plan.subtitle}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500 ml-1">{plan.priceDetail !== plan.price ? plan.priceDetail : ''}</span>
                  </div>

                  <Link
                    to={plan.name === 'Enterprise' ? '/contact' : '/register'}
                    className={`w-full inline-flex items-center justify-center space-x-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
                      plan.highlight
                        ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <hr className="border-gray-100" />

                <div className="p-8 flex-grow">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Inclus dans ce plan</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pay-per-use note */}
        <div className="mt-16 text-center bg-white border border-gray-200 rounded-2xl p-8 max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Paiement à l'usage disponible</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            En plus de l'abonnement mensuel, chaque agent Premium et Enterprise facture un micro-coût par appel (de 0.02 € à 0.50 € selon l'agent).
            Cela vous permet de ne payer que pour ce que vous consommez réellement. Les agents gratuits sont toujours sans frais.
          </p>
        </div>
      </div>
    </div>
  );
}
