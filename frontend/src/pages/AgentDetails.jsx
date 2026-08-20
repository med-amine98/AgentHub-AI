import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Play, Sparkles, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, Star, ShieldCheck, CreditCard } from 'lucide-react';

export default function AgentDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [agent, setAgent] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [formInputs, setFormInputs] = useState({});
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const agentData = await api.getAgent(id);
        setAgent(agentData);

        // Pre-fill default input state
        const defaults = {};
        if (agentData.input_schema) {
          Object.keys(agentData.input_schema).forEach((key) => {
            defaults[key] = '';
          });
        }
        setFormInputs(defaults);

        // Check if user is subscribed (only for Premium/Enterprise)
        if (user && (agentData.tier === 'premium' || agentData.tier === 'enterprise')) {
          const subs = await api.getSubscriptions();
          const hasSub = subs.some(sub => sub.agent_id === id && sub.status === 'active');
          setIsSubscribed(hasSub);
        } else {
          setIsSubscribed(agentData.tier === 'free');
        }
        
        setError(null);
      } catch (err) {
        setError("Erreur lors de la récupération des détails de l'agent.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  const handleInputChange = (key, value) => {
    setFormInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setSubmittingSub(true);
      await api.subscribe(id);
      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      setError(err.message || "Erreur lors de l'abonnement.");
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setSubmittingSub(true);
      await api.unsubscribe(id);
      setIsSubscribed(false);
      setError(null);
      setExecutionResult(null);
    } catch (err) {
      setError(err.message || "Erreur lors du désabonnement.");
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setExecuting(true);
      setError(null);
      const res = await api.executeAgent(id, formInputs);
      setExecutionResult(res);
    } catch (err) {
      setError(err.message || "Une erreur s'est produite lors de l'exécution.");
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/catalog" className="px-4 py-2 bg-brand-500 text-white rounded-lg font-semibold">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const TierIcon = agent.tier === 'premium' ? Star : agent.tier === 'enterprise' ? ShieldCheck : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/catalog" className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 mb-8 font-medium">
        <ArrowLeft className="h-4 w-4" />
        <span>Retour au catalogue</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <span className={`inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full font-semibold uppercase mb-4 ${
              agent.tier === 'free' ? 'bg-emerald-100 text-emerald-800' :
              agent.tier === 'premium' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {TierIcon && <TierIcon className="h-3 w-3 mr-0.5" />}
              {agent.tier}
            </span>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{agent.name}</h1>
            <p className="text-xs text-gray-400 font-mono mb-4">ID: {agent.id}</p>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{agent.description}</p>
            
            <hr className="border-gray-200 mb-6" />

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Abonnement Mensuel</span>
                <span className="font-bold text-gray-900">
                  {agent.tier === 'free' ? 'Gratuit' : `${parseFloat(agent.price_month)} €`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Prix à l'usage</span>
                <span className="font-bold text-gray-900">
                  {agent.tier === 'free' ? 'Gratuit' : `${parseFloat(agent.price_use)} € / appel`}
                </span>
              </div>
            </div>

            {/* Subscription CTA Action */}
            {agent.tier !== 'free' && (
              <div className="pt-2">
                {isSubscribed ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Vous êtes abonné à cet agent !</span>
                    </div>
                    <button
                      onClick={handleUnsubscribe}
                      disabled={submittingSub}
                      className="w-full py-2.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2"
                    >
                      {submittingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Se désabonner</span>}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    disabled={submittingSub}
                    className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 text-sm transition-all flex items-center justify-center space-x-2"
                  >
                    {submittingSub ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>S'abonner maintenant</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* System Prompt details for developers */}
          <div className="bg-gray-950 text-gray-400 p-5 rounded-2xl border border-gray-800 text-xs font-mono">
            <h4 className="text-gray-200 font-bold mb-2 uppercase text-[10px] tracking-wider">Prompt Système de l'Agent</h4>
            <p className="leading-relaxed">"{agent.system_prompt}"</p>
          </div>
        </div>

        {/* Playground / Execution Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-brand-500" />
                <span>Playground / Bac à sable de l'Agent</span>
              </h2>
            </div>
            
            <div className="p-6">
              {/* If not subscribed and not free, prompt to subscribe */}
              {!isSubscribed && agent.tier !== 'free' ? (
                <div className="text-center py-12 px-6">
                  <div className="bg-brand-50 p-4 rounded-full inline-block mb-4 text-brand-500">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Contenu Verrouillé</h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
                    Cet agent est classé **{agent.tier}**. Vous devez souscrire à un abonnement mensuel pour accéder à son playground interactif et à ses APIs d'exécution.
                  </p>
                  <button
                    onClick={handleSubscribe}
                    className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Débloquer pour {parseFloat(agent.price_month)} € / mois
                  </button>
                </div>
              ) : (
                <form onSubmit={handleExecute} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Input Form Fields generated dynamically from agent schema */}
                  <div className="grid grid-cols-1 gap-6">
                    {agent.input_schema && Object.entries(agent.input_schema).map(([key, schema]) => (
                      <div key={key}>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          {schema.label || key}
                        </label>
                        {schema.type === 'number' ? (
                          <input
                            type="number"
                            required
                            placeholder={schema.placeholder || ''}
                            value={formInputs[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                          />
                        ) : (
                          <textarea
                            required
                            rows={3}
                            placeholder={schema.placeholder || ''}
                            value={formInputs[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={executing}
                    className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 text-sm flex items-center space-x-2 transition-all"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Exécution en cours...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Exécuter l'Agent</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Results Panel */}
          {executionResult && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Résultat de l'exécution</span>
                </span>
                
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded font-mono font-semibold">
                  Coût simulé: {executionResult.usage.cost} €
                </span>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Dynamically format structured output */}
                {Object.entries(executionResult.output).map(([key, val]) => (
                  <div key={key} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">
                      {key}
                    </span>
                    
                    {Array.isArray(val) ? (
                      <ul className="list-disc list-inside space-y-2 mt-1">
                        {val.map((item, idx) => (
                          <li key={idx} className="text-gray-800 text-sm font-medium">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : typeof val === 'string' && val.startsWith('#') ? (
                      /* If it's a markdown-like block */
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-800 whitespace-pre-line font-serif leading-relaxed">
                        {val}
                      </div>
                    ) : (
                      <div className="text-gray-900 text-sm font-medium">
                        {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
