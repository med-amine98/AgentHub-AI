import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  Play, Sparkles, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, 
  Star, ShieldCheck, CreditCard, Upload, FileText, Trash2, Copy, 
  Check, Download, History, BarChart3, Code2, Layers, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AgentDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [agent, setAgent] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [formInputs, setFormInputs] = useState({});
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('execute'); // 'execute' | 'history'

  // Files state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState(null);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Copy state
  const [copiedKey, setCopiedKey] = useState(null);

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

  const loadSessions = async () => {
    if (!user) return;
    try {
      setLoadingSessions(true);
      const data = await api.getAgentSessions(id);
      setSessions(data || []);
    } catch (err) {
      console.error("Error loading sessions", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadSessions();
    }
  }, [activeTab]);

  const handleInputChange = (key, value) => {
    setFormInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setFileUploadError(null);
      const res = await api.uploadFile(file);
      setUploadedFiles(prev => [...prev, res]);
    } catch (err) {
      setFileUploadError(err.message || "Erreur lors de l'envoi du fichier.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
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
      const fileIds = uploadedFiles.map(f => f.id);
      const res = await api.executeAgent(id, formInputs, fileIds);
      setExecutionResult(res);
    } catch (err) {
      setError(err.message || "Une erreur s'est produite lors de l'exécution.");
    } finally {
      setExecuting(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadJsonResult = () => {
    if (!executionResult) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(executionResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agenthub_${id}_result_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
  const out = executionResult?.output;

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
                <span className="text-gray-500">Catégorie</span>
                <span className="font-bold text-gray-900 uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">
                  {agent.category}
                </span>
              </div>
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
                        <span>S'abonner maintenant ({parseFloat(agent.price_month)} €/mois)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* System Prompt details */}
          <div className="bg-gray-950 text-gray-400 p-5 rounded-2xl border border-gray-800 text-xs font-mono">
            <h4 className="text-gray-200 font-bold mb-2 uppercase text-[10px] tracking-wider">Prompt Système de l'Agent</h4>
            <p className="leading-relaxed text-gray-300">"{agent.system_prompt}"</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 space-x-4">
            <button
              onClick={() => setActiveTab('execute')}
              className={`pb-3 px-2 text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
                activeTab === 'execute'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Exécution & Playground</span>
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 px-2 text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
                  activeTab === 'history'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Historique des sessions</span>
              </button>
            )}
          </div>

          {activeTab === 'history' ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <History className="h-5 w-5 text-gray-400" />
                  <span>Dernières exécutions de cet agent</span>
                </h3>
                <button
                  onClick={loadSessions}
                  disabled={loadingSessions}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingSessions ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingSessions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Aucune session enregistrée pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map(s => (
                    <div key={s.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-all">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="font-mono">{new Date(s.executed_at).toLocaleString()}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                          {s.cost ? `${s.cost} €` : 'Gratuit'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        <strong>Entrées :</strong> {JSON.stringify(s.inputs)}
                      </div>
                      <button
                        onClick={() => {
                          setFormInputs(s.inputs || {});
                          setExecutionResult({ output: s.outputs, usage: { cost: s.cost } });
                          setActiveTab('execute');
                        }}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                      >
                        <span>Recharger cette exécution</span>
                        <ArrowLeft className="h-3 w-3 rotate-180" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Playground Form Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-brand-500" />
                    <span>Playground / Bac à sable de l'Agent</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  {!isSubscribed && agent.tier !== 'free' ? (
                    <div className="text-center py-12 px-6">
                      <div className="bg-brand-50 p-4 rounded-full inline-block mb-4 text-brand-500">
                        <CreditCard className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Contenu Verrouillé</h3>
                      <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
                        Cet agent est classé <strong>{agent.tier}</strong>. Vous devez souscrire à un abonnement mensuel pour exécuter cet agent avec vos données réelles.
                      </p>
                      <button
                        onClick={handleSubscribe}
                        className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-brand-500/20"
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

                      {/* Dynamic Input Schema Fields */}
                      <div className="grid grid-cols-1 gap-5">
                        {agent.input_schema && Object.entries(agent.input_schema).map(([key, schema]) => (
                          <div key={key}>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                              {schema.label || key}
                            </label>
                            {schema.type === 'number' ? (
                              <input
                                type="number"
                                placeholder={schema.placeholder || ''}
                                value={formInputs[key] || ''}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                              />
                            ) : (
                              <textarea
                                rows={2}
                                placeholder={schema.placeholder || ''}
                                value={formInputs[key] || ''}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* File Upload Attachment Area */}
                      <div className="border-t border-gray-100 pt-5">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Documents & Données Complémentaires (CSV, Excel, PDF, TXT, Code, Images)
                        </label>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {uploadedFiles.map(file => (
                            <div key={file.id} className="inline-flex items-center space-x-2 bg-blue-50 text-blue-800 text-xs px-3 py-1.5 rounded-lg border border-blue-200 font-medium">
                              <FileText className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[180px]">{file.original_name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(file.id)}
                                className="text-blue-600 hover:text-red-500 ml-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.pdf,.txt,.md,.json,.py,.js,.png,.jpg,.jpeg"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border border-gray-300 flex items-center space-x-2 transition-all"
                          >
                            {uploadingFile ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            <span>{uploadingFile ? "Envoi du fichier..." : "Joindre un fichier de données"}</span>
                          </button>
                          <span className="text-xs text-gray-400">Jusqu'à 20 Mo</span>
                        </div>
                        {fileUploadError && (
                          <p className="text-xs text-red-500 mt-2">{fileUploadError}</p>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={executing}
                          className="px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 text-sm flex items-center space-x-2 transition-all"
                        >
                          {executing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Traitement et Analyse en cours...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              <span>Lancer l'Agent IA</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Execution Results View */}
              {executionResult && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
                  <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>Rapport & Données Générées</span>
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={downloadJsonResult}
                        className="px-3 py-1 bg-white text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center space-x-1"
                        title="Télécharger le rapport JSON"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>JSON</span>
                      </button>
                      <span className="text-xs bg-emerald-200/60 text-emerald-900 px-2.5 py-1 rounded font-mono font-semibold">
                        Coût : {executionResult.usage?.cost || 0} €
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Visual KPIs Section if present */}
                    {Array.isArray(out?.kpis) && out.kpis.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Indicateurs Clés de Performance (KPIs)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {out.kpis.map((kpi, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                              <span className="text-xs text-gray-500 block truncate">{kpi.label}</span>
                              <span className="text-lg font-extrabold text-gray-900 block mt-1">{kpi.value}</span>
                              {kpi.trend && (
                                <span className={`text-[10px] font-bold uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${
                                  kpi.color === 'green' ? 'bg-emerald-100 text-emerald-800' :
                                  kpi.color === 'red' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {kpi.trend}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chart / Distribution if present */}
                    {Array.isArray(out?.chart_data) && out.chart_data.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                          <BarChart3 className="h-4 w-4 text-brand-500" />
                          <span>Visualisation Graphique</span>
                        </h4>
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                          {out.chart_data.map((item, idx) => {
                            const maxVal = Math.max(...out.chart_data.map(d => Number(d.value) || 0), 1);
                            const pct = Math.min(Math.round(((Number(item.value) || 0) / maxVal) * 100), 100);
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-gray-700">
                                  <span>{item.name}</span>
                                  <span>{item.value}</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Slogans / Pitch / Social Posts if present */}
                    {Array.isArray(out?.slogans) && out.slogans.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                        <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">
                          Slogans & Accroches Générés
                        </h4>
                        <ul className="space-y-1.5">
                          {out.slogans.map((slogan, idx) => (
                            <li key={idx} className="text-sm font-semibold text-purple-950 flex items-center justify-between">
                              <span>"{slogan}"</span>
                              <button
                                onClick={() => copyToClipboard(slogan, `slogan-${idx}`)}
                                className="text-purple-600 hover:text-purple-900 p-1"
                              >
                                {copiedKey === `slogan-${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Code Section if present */}
                    {out?.code && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                            <Code2 className="h-4 w-4 text-blue-500" />
                            <span>Code Source Produit ({out.language || 'Code'})</span>
                          </h4>
                          <button
                            onClick={() => copyToClipboard(out.code, 'code')}
                            className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded flex items-center space-x-1 transition-all"
                          >
                            {copiedKey === 'code' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>Copier</span>
                          </button>
                        </div>
                        <pre className="p-4 bg-gray-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto border border-gray-800">
                          <code>{out.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Structured output fields */}
                    {Object.entries(out || {}).map(([key, val]) => {
                      if (['kpis', 'chart_data', 'code', 'slogans'].includes(key)) return null;
                      return (
                        <div key={key} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <button
                              onClick={() => copyToClipboard(val, key)}
                              className="text-gray-400 hover:text-gray-700 p-1"
                              title="Copier le champ"
                            >
                              {copiedKey === key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {Array.isArray(val) ? (
                            <ul className="list-disc list-inside space-y-1.5">
                              {val.map((item, idx) => (
                                <li key={idx} className="text-gray-800 text-sm font-medium">
                                  {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                </li>
                              ))}
                            </ul>
                          ) : typeof val === 'object' && val !== null ? (
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto">
                              {JSON.stringify(val, null, 2)}
                            </pre>
                          ) : (
                            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                              <ReactMarkdown>{String(val)}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
