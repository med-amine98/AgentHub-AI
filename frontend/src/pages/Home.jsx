import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, GitBranch, ShieldCheck, Zap, Users, ArrowRight, Layers, Workflow, Bot, BarChart3, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-mesh animate-float">
        <div className="absolute inset-y-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-brand-100/80 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm border border-brand-200">
            <Zap className="h-4 w-4 text-brand-500 animate-pulse" />
            <span>La nouvelle ère de l'automatisation intelligente</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
            Construisez votre équipe d'IA, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">sans écrire une ligne de code</span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-12 leading-relaxed">
            AgentHub AI vous permet d'assembler des agents d'intelligence artificielle spécialisés en workflows puissants. Automatisez vos opérations, du marketing à la finance, avec une interface visuelle intuitive.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg shadow-gray-900/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-1"
            >
              <span>Commencer gratuitement</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <Link
              to="/catalog"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-xl border border-gray-200 shadow-sm flex items-center justify-center space-x-2 transition-all hover:border-gray-300"
            >
              <Compass className="h-5 w-5 text-gray-500" />
              <span>Explorer le catalogue</span>
            </Link>
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-200/60 flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-6 font-medium uppercase tracking-wider">Ils nous font confiance</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale">
              <div className="text-2xl font-black text-gray-400">TechCorp</div>
              <div className="text-2xl font-black text-gray-400">Innovate.io</div>
              <div className="text-2xl font-black text-gray-400">FutureFinance</div>
              <div className="text-2xl font-black text-gray-400">GlobalRetail</div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-2">Comment ça marche</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">Trois étapes pour automatiser</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          
          <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
              <Bot className="h-8 w-8 text-brand-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">1. Choisissez vos agents</h4>
            <p className="text-gray-600">Parcourez notre catalogue et sélectionnez les agents d'IA spécialisés dont vous avez besoin (SEO, analyse de données, support client...).</p>
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
              <Workflow className="h-8 w-8 text-brand-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">2. Créez votre workflow</h4>
            <p className="text-gray-600">Connectez vos agents entre eux visuellement. Les données générées par l'un alimentent automatiquement le suivant.</p>
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
              <BarChart3 className="h-8 w-8 text-brand-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">3. Mesurez les résultats</h4>
            <p className="text-gray-600">Suivez l'exécution de vos workflows, analysez les performances et optimisez vos processus en temps réel.</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Pourquoi choisir AgentHub AI ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme conçue pour la productivité et la scalabilité des entreprises modernes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-brand-50 p-3 rounded-xl inline-block mb-6">
                <Users className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Experts Virtuels</h3>
              <p className="text-gray-600 leading-relaxed">
                Nos agents sont pré-entraînés sur des tâches spécifiques pour garantir des résultats de haute qualité immédiatement.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-50 p-3 rounded-xl inline-block mb-6">
                <Layers className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Architecture Modulaire</h3>
              <p className="text-gray-600 leading-relaxed">
                Remplacez, ajoutez ou supprimez des agents dans vos workflows sans perturber le reste de vos opérations.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 p-3 rounded-xl inline-block mb-6">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sécurité & Confidentialité</h3>
              <p className="text-gray-600 leading-relaxed">
                Vos données sont chiffrées et isolées. Nous ne les utilisons pas pour entraîner des modèles publics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-brand-600 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-brand-500 opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-brand-700 opacity-50 blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Prêt à multiplier votre productivité ?</h2>
            <p className="text-brand-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Rejoignez des milliers d'entreprises qui ont déjà automatisé leurs tâches les plus complexes avec AgentHub AI.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-brand-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
              >
                Créer un compte gratuit
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 bg-brand-700 text-white font-bold rounded-xl hover:bg-brand-800 transition-colors border border-brand-500"
              >
                Contacter les ventes
              </Link>
            </div>
            <div className="mt-8 flex justify-center items-center gap-6 text-sm text-brand-200">
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-brand-300" /> Sans carte de crédit</span>
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-brand-300" /> Annulation à tout moment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
