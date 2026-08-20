import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, GitBranch, ShieldCheck, Zap, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-brand-50 to-white min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="h-4 w-4 text-brand-500 animate-pulse" />
          <span>La première marketplace d'agents IA modulaires</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Vos équipes d'agents d'IA, <br />
          <span className="text-brand-500">entièrement à la carte</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
          Découvrez, testez et abonnez-vous uniquement aux agents spécialisés dont vous avez besoin. Finance, marketing, RH, traduction... Connectez-les entre eux pour automatiser vos processus d'entreprise.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/catalog"
            className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <Compass className="h-5 w-5" />
            <span>Explorer le Catalogue</span>
          </Link>
          
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-300 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Créer un compte</span>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
          Pourquoi choisir AgentHub AI ?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="bg-brand-100 p-3.5 rounded-xl inline-block mb-6">
              <Users className="h-6 w-6 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Agents Spécialisés</h3>
            <p className="text-gray-600 leading-relaxed">
              Des agents autonomes entraînés spécifiquement pour des tâches pointues en finance, rédaction, traduction, ou analyse de données.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="bg-brand-100 p-3.5 rounded-xl inline-block mb-6">
              <GitBranch className="h-6 w-6 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Workflows Multi-Agents</h3>
            <p className="text-gray-600 leading-relaxed">
              Enchaînez vos agents de manière logique. La sortie d'un agent de marketing alimente automatiquement l'agent de traduction ou le calculateur de rentabilité.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="bg-brand-100 p-3.5 rounded-xl inline-block mb-6">
              <ShieldCheck className="h-6 w-6 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">SaaS par Abonnement</h3>
            <p className="text-gray-600 leading-relaxed">
              Pas besoin d'acheter une suite logicielle lourde. Abonnez-vous individuellement à chaque agent et payez à l'usage de manière transparente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
