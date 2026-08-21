import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  CreditCard, GitBranch, Play, Plus, Trash2, CheckCircle2, 
  Loader2, Cpu, ArrowRight, Layers, HelpCircle, FileText,
  Sparkles, TrendingUp, Clock, DollarSign, Copy, Check,
  ChevronRight, BookmarkPlus, Zap, Eye, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkflowBuilder from '../components/WorkflowBuilder';

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'workflows', 'subscriptions'
  const [subscriptions, setSubscriptions] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Workflow builder state
  const [showBuilder, setShowBuilder] = useState(false);

  // Workflow runner state
  const [runningWfId, setRunningWfId] = useState(null);
  const [currentRunningWf, setCurrentRunningWf] = useState(null);
  const [runInputs, setRunInputs] = useState({});
  const [runResult, setRunResult] = useState(null);
  const [executingWf, setExecutingWf] = useState(false);
  const [cloningTemplateId, setCloningTemplateId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsData, wfData, agentsData, tplData] = await Promise.all([
        api.getSubscriptions(),
        api.getWorkflows(),
        api.getAgents(),
        api.getWorkflowTemplates(),
      ]);
      setSubscriptions(subsData);
      setWorkflows(wfData);
      setAgents(agentsData);
      setTemplates(tplData);
      setError(null);
    } catch (err) {
      setError("Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleCancelSub = async (agentId) => {
    try {
      await api.unsubscribe(agentId);
      setSubscriptions(prev => prev.filter(sub => sub.agent_id !== agentId));
    } catch (err) {
      alert("Erreur lors du désabonnement : " + err.message);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!confirm("Voulez-vous supprimer ce workflow ?")) return;
    try {
      await api.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      if (runningWfId === id) {
        setRunningWfId(null);
        setCurrentRunningWf(null);
        setRunResult(null);
      }
    } catch (err) {
      alert("Erreur de suppression : " + err.message);
    }
  };

  // Open a personal workflow in runner
  const handleOpenRunner = (wf, presetInputs = null) => {
    setRunningWfId(wf.id);
    setCurrentRunningWf(wf);
    setRunResult(null);
    
    // Determine the initial inputs required
    const resolvedInitialKeys = new Set();
    const producedKeys = new Set();
    
    wf.definition.forEach((step, idx) => {
      const mappings = step.input_mappings || {};
      Object.values(mappings).forEach(sourceKey => {
        if (!producedKeys.has(sourceKey)) {
          resolvedInitialKeys.add(sourceKey);
        }
      });
      const agentObj = agents.find(a => a.id === step.agent_id);
      if (agentObj && agentObj.output_schema) {
        Object.keys(agentObj.output_schema).forEach(outKey => {
          producedKeys.add(outKey);
          producedKeys.add(`step_${idx}_${outKey}`);
          producedKeys.add(`${step.agent_id}_${outKey}`);
        });
      }
    });

    const initInputs = {};
    resolvedInitialKeys.forEach(k => {
      initInputs[k] = presetInputs && presetInputs[k] ? presetInputs[k] : '';
    });

    // Fallback: check all agents' input schemas
    if (resolvedInitialKeys.size === 0 && wf.definition.length > 0) {
      wf.definition.forEach(step => {
        const agentObj = agents.find(a => a.id === step.agent_id);
        if (agentObj && agentObj.input_schema) {
          Object.keys(agentObj.input_schema).forEach(k => {
            if (!(k in initInputs)) {
              initInputs[k] = presetInputs && presetInputs[k] ? presetInputs[k] : '';
            }
          });
        }
      });
    }

    setRunInputs(presetInputs || initInputs);
  };

  // Clone a template and open it immediately
  const handleCloneTemplate = async (tpl) => {
    try {
      setCloningTemplateId(tpl.id);
      const newWf = await api.createWorkflowFromTemplate(tpl.id);
      setWorkflows(prev => [newWf, ...prev]);
      setActiveTab('workflows');
      handleOpenRunner(newWf, tpl.sample_inputs);
    } catch (err) {
      alert("Erreur lors de la création depuis le template : " + err.message);
    } finally {
      setCloningTemplateId(null);
    }
  };

  // Run instant interactive demo from template
  const handleLaunchDemoFromTemplate = async (tpl) => {
    try {
      setCloningTemplateId(tpl.id);
      const newWf = await api.createWorkflowFromTemplate(tpl.id);
      setWorkflows(prev => [newWf, ...prev]);
      setActiveTab('workflows');
      handleOpenRunner(newWf, tpl.sample_inputs);
      
      // Auto-trigger execution after small state sync
      setTimeout(async () => {
        try {
          setExecutingWf(true);
          const res = await api.runWorkflow(newWf.id, tpl.sample_inputs);
          setRunResult(res);
        } catch (execErr) {
          setError(execErr.message);
        } finally {
          setExecutingWf(false);
        }
      }, 300);
    } catch (err) {
      alert("Erreur lors du lancement de la démo : " + err.message);
    } finally {
      setCloningTemplateId(null);
    }
  };

  const handleRunWorkflow = async (e) => {
    e.preventDefault();
    try {
      setExecutingWf(true);
      setError(null);
      const res = await api.runWorkflow(runningWfId, runInputs);
      setRunResult(res);
    } catch (err) {
      setError(err.message || "Erreur lors de l'exécution du workflow.");
    } finally {
      setExecutingWf(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Espace d'Orchestration</h1>
            <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-200">
              Workflows IA Multi-Agents
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Combinez des agents d'IA spécialisés pour automatiser vos opérations complexes et décupler votre rentabilité.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-1 bg-gray-200/70 p-1.5 rounded-2xl border border-gray-300/60 shadow-inner">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'templates'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Modèles & Démos ({templates.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('workflows');
              if (workflows.length > 0 && !runningWfId) {
                handleOpenRunner(workflows[0]);
              }
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'workflows'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <GitBranch className="h-4 w-4 text-brand-600" />
            <span>Mes Workflows ({workflows.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'subscriptions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <span>Mes Abonnements ({subscriptions.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs font-bold">Fermer</button>
        </div>
      )}

      {/* ─── TAB 1: WORKFLOW TEMPLATES & READY-TO-RUN DEMOS ─────────────────── */}
      {activeTab === 'templates' && (
        <div className="space-y-8">
          {/* Banner Info */}
          <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <span className="bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
                Bibliothèque de Cas d'Usage à Fort ROI
              </span>
              <h2 className="text-3xl font-extrabold mt-3 tracking-tight">
                Découvrez la puissance du multi-agents en 1 clic
              </h2>
              <p className="text-brand-100 text-sm mt-2 leading-relaxed">
                Chaque modèle orchestre plusieurs agents d'IA spécialisés pour accomplir une mission métier complète.
                Cliquez sur **« Démo Interactive »** pour tester immédiatement un exemple réel avec ses données pré-remplies.
              </p>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white border border-gray-200 rounded-3xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg">
                      {tpl.badge}
                    </span>
                    
                    {/* ROI Pill */}
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <Clock className="h-3.5 w-3.5" />
                      <span>~{tpl.estimated_time_saved_hours}h économisées</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">{tpl.name}</h3>
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">{tpl.description}</p>

                  {/* Agent Sequence Chain */}
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Agents orchestrés ({tpl.definition.length} étapes)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {tpl.definition.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <span className="bg-white border border-gray-200 text-gray-800 text-xs font-mono font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                            {step.agent_id}
                          </span>
                          {idx < tpl.definition.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-brand-400 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleLaunchDemoFromTemplate(tpl)}
                    disabled={cloningTemplateId === tpl.id}
                    className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    {cloningTemplateId === tpl.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-amber-300" />
                        <span>Lancer la Démo Live</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCloneTemplate(tpl)}
                    disabled={cloningTemplateId === tpl.id}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
                    title="Cloner dans mes workflows"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Cloner</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: MY WORKFLOWS & INTERACTIVE RUNNER ───────────────────────── */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workflows List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-2xl shadow-2xs">
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-brand-500" />
                <span>Mes Workflows ({workflows.length})</span>
              </h2>
              
              <button
                onClick={() => setShowBuilder(true)}
                className="inline-flex items-center space-x-1 text-xs bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nouveau</span>
              </button>
            </div>

            {workflows.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl p-6">
                <Layers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-bold text-sm">Aucun workflow personnel</p>
                <p className="text-gray-400 text-xs mt-1 mb-4">
                  Démarrez en choisissant un modèle prêt à l'emploi.
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Voir les Modèles & Démos
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map((wf) => (
                  <div 
                    key={wf.id}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      runningWfId === wf.id 
                        ? 'border-brand-500 bg-brand-50/40 shadow-sm ring-2 ring-brand-500/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => handleOpenRunner(wf)}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="font-bold text-gray-900 text-sm truncate flex-1">{wf.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(wf.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{wf.description}</p>
                    
                    <div className="flex items-center flex-wrap gap-1">
                      {wf.definition.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono font-semibold">
                            {step.agent_id}
                          </span>
                          {idx < wf.definition.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-gray-300" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workflow Runner & Live Execution Panel */}
          <div className="lg:col-span-2">
            {runningWfId && currentRunningWf ? (
              <div className="space-y-6">
                {/* Configuration & Inputs Card */}
                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase border border-emerald-200">
                          Workflow Prêt
                        </span>
                        <span className="text-xs text-gray-400">ID #{currentRunningWf.id}</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                        {currentRunningWf.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{currentRunningWf.description}</p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setRunningWfId(null);
                          setCurrentRunningWf(null);
                          setRunResult(null);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-700 font-semibold px-2 py-1"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>

                  {/* Step Diagram */}
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                    <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                      Séquence d'exécution ({currentRunningWf.definition.length} étapes interconnectées)
                    </span>
                    <div className="flex items-center flex-wrap gap-2">
                      {currentRunningWf.definition.map((step, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs text-xs">
                            <span className="w-4 h-4 bg-brand-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-gray-800">{step.agent_id}</span>
                          </div>
                          {idx < currentRunningWf.definition.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-brand-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Execution Form */}
                  <form onSubmit={handleRunWorkflow} className="space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Paramètres d'entrée du workflow
                        </span>
                      </div>
                      
                      {Object.keys(runInputs).length === 0 ? (
                        <p className="text-xs text-gray-400">Aucun paramètre requis pour démarrer.</p>
                      ) : (
                        <div className="space-y-3">
                          {Object.keys(runInputs).map((key) => (
                            <div key={key}>
                              <label className="block text-xs font-bold text-gray-700 mb-1 font-mono">
                                {key}
                              </label>
                              <textarea
                                rows={2}
                                required
                                value={runInputs[key]}
                                onChange={(e) => setRunInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={`Saisir la valeur pour ${key}...`}
                                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={executingWf}
                      className="px-6 py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg shadow-brand-600/20"
                    >
                      {executingWf ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Orchestration multi-agents en cours...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-white" />
                          <span>Exécuter le Workflow Complet</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Workflow execution Results */}
                {runResult && (
                  <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden animate-fadeIn space-y-6 p-6">
                    {/* Header Success & ROI Summary */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-emerald-900 text-base">
                            Workflow exécuté avec succès !
                          </h4>
                          <p className="text-emerald-700 text-xs mt-0.5">
                            Tous les agents ont traité et transmis leurs données dans la chaîne.
                          </p>
                        </div>
                      </div>

                      {/* ROI Badge */}
                      <div className="bg-white border border-emerald-300 rounded-xl px-4 py-2 text-right shadow-2xs">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase block">Valeur ajoutée estimée</span>
                        <span className="text-base font-extrabold text-emerald-700">~150.00 € (3h économisées)</span>
                      </div>
                    </div>

                    {/* Step-by-step trace */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">
                        Traces d'exécution pas-à-pas ({runResult.results.length} étapes)
                      </h4>
                      
                      <div className="space-y-4">
                        {runResult.results.map((step, idx) => (
                          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 bg-brand-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <h5 className="font-bold text-gray-900 text-sm">
                                  {step.agent_name} <span className="text-xs text-gray-400 font-mono font-normal">({step.agent_id})</span>
                                </h5>
                              </div>
                              <button
                                onClick={() => copyToClipboard(step.outputs, `step-${idx}`)}
                                className="text-xs text-gray-500 hover:text-brand-600 flex items-center space-x-1 font-semibold"
                              >
                                {copiedKey === `step-${idx}` ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-emerald-600">Copié !</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copier la sortie</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(step.outputs, null, 2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final Outputs summary */}
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">
                          Mémoire globale consolidée (Résultats finaux)
                        </h4>
                        <button
                          onClick={() => copyToClipboard(runResult.final_output, 'final')}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
                        >
                          {copiedKey === 'final' ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Résultat copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copier tout le résultat</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <pre className="font-mono text-emerald-400 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(runResult.final_output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[360px] flex flex-col justify-center items-center text-center p-8 bg-white border-2 border-dashed border-gray-200 rounded-3xl text-gray-400">
                <GitBranch className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-base font-bold text-gray-800 mb-1">Sélectionnez un workflow</h3>
                <p className="text-xs max-w-sm mx-auto text-gray-500 mb-6">
                  Choisissez un workflow dans la liste de gauche ou explorez nos modèles prêts à l'emploi.
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl text-xs transition-colors flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Explorer les Modèles & Démos</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: ACTIVE SUBSCRIPTIONS ────────────────────────────────────── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-brand-500" />
              <span>Mes agents d'IA souscrits</span>
            </h2>
            <Link
              to="/catalog"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center space-x-1"
            >
              <span>Catalogue d'agents</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-3xl p-8">
              <Cpu className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">Aucun abonnement actif</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Vous profitez actuellement des agents gratuits. Découvrez nos agents Premium pour vos besoins avancés.
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-brand-500/20"
              >
                <span>Découvrir le catalogue d'agents</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="bg-brand-50/50 border border-brand-200 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded border border-brand-200">
                        {sub.agent.category}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Actif depuis: {new Date(sub.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{sub.agent.name}</h3>
                    <p className="text-gray-600 text-xs mb-6 line-clamp-2">{sub.agent.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-brand-200 pt-4">
                    <span className="font-bold text-gray-900 text-sm">
                      {parseFloat(sub.agent.price_month)} € / mois
                    </span>
                    <div className="flex space-x-2">
                      <Link
                        to={`/agents/${sub.agent_id}`}
                        className="px-3 py-1.5 bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Ouvrir
                      </Link>
                      <button
                        onClick={() => handleCancelSub(sub.agent_id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Résilier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER WORKFLOW BUILDER MODAL */}
      {showBuilder && (
        <WorkflowBuilder
          agents={agents}
          onClose={() => setShowBuilder(false)}
          onSave={(wf) => {
            setWorkflows(prev => [wf, ...prev]);
            setShowBuilder(false);
            setActiveTab('workflows');
            handleOpenRunner(wf);
          }}
        />
      )}
    </div>
  );
}
