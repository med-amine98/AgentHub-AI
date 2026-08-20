import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  CreditCard, GitBranch, Play, Plus, Trash2, CheckCircle2, 
  Loader2, Cpu, ArrowRight, Layers, HelpCircle, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions', 'workflows'
  const [subscriptions, setSubscriptions] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Workflow builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');
  const [wfSteps, setWfSteps] = useState([]); // List of { agent_id, input_mappings }
  const [submittingWf, setSubmittingWf] = useState(false);

  // Workflow runner state
  const [runningWfId, setRunningWfId] = useState(null);
  const [runInputs, setRunInputs] = useState({});
  const [runResult, setRunResult] = useState(null);
  const [executingWf, setExecutingWf] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [subsData, wfData, agentsData] = await Promise.all([
          api.getSubscriptions(),
          api.getWorkflows(),
          api.getAgents()
        ]);
        setSubscriptions(subsData);
        setWorkflows(wfData);
        setAgents(agentsData);
        setError(null);
      } catch (err) {
        setError("Erreur lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    }
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

  // Workflow Builder handlers
  const handleAddStep = () => {
    setWfSteps(prev => [...prev, { agent_id: '', input_mappings: {} }]);
  };

  const handleRemoveStep = (index) => {
    setWfSteps(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStepAgentChange = (index, agentId) => {
    const selected = agents.find(a => a.id === agentId);
    const mappings = {};
    if (selected && selected.input_schema) {
      // Initialize inputs mapping: by default empty or map to same key in initial inputs
      Object.keys(selected.input_schema).forEach(key => {
        mappings[key] = key;
      });
    }
    setWfSteps(prev => {
      const copy = [...prev];
      copy[index] = { agent_id: agentId, input_mappings: mappings };
      return copy;
    });
  };

  const handleMappingChange = (stepIndex, inputKey, sourceVal) => {
    setWfSteps(prev => {
      const copy = [...prev];
      copy[stepIndex].input_mappings = {
        ...copy[stepIndex].input_mappings,
        [inputKey]: sourceVal
      };
      return copy;
    });
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (wfSteps.length === 0) {
      alert("Veuillez ajouter au moins une étape à votre workflow.");
      return;
    }
    try {
      setSubmittingWf(true);
      const newWf = await api.createWorkflow(newWfName, newWfDesc, wfSteps);
      setWorkflows(prev => [newWf, ...prev]);
      setShowBuilder(false);
      setNewWfName('');
      setNewWfDesc('');
      setWfSteps([]);
    } catch (err) {
      alert("Erreur lors de la création du workflow : " + err.message);
    } finally {
      setSubmittingWf(false);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!confirm("Voulez-vous supprimer ce workflow ?")) return;
    try {
      await api.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      if (runningWfId === id) {
        setRunningWfId(null);
        setRunResult(null);
      }
    } catch (err) {
      alert("Erreur de suppression : " + err.message);
    }
  };

  // Workflow execution handlers
  const handleOpenRunner = (wf) => {
    setRunningWfId(wf.id);
    setRunResult(null);
    
    // Determine the initial inputs required.
    // Initial inputs are any variables mapped in steps that are NOT outputted by preceding steps.
    const resolvedInitialKeys = new Set();
    const producedKeys = new Set();
    
    wf.definition.forEach((step, idx) => {
      const mappings = step.input_mappings || {};
      Object.values(mappings).forEach(sourceKey => {
        if (!producedKeys.has(sourceKey)) {
          resolvedInitialKeys.add(sourceKey);
        }
      });
      // Add outputs of current agent to produced keys
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
      initInputs[k] = '';
    });

    // Fallback: if no keys resolved (e.g. empty mapping), check first step's inputs
    if (resolvedInitialKeys.size === 0 && wf.definition.length > 0) {
      const firstStep = wf.definition[0];
      const agentObj = agents.find(a => a.id === firstStep.agent_id);
      if (agentObj && agentObj.input_schema) {
        Object.keys(agentObj.input_schema).forEach(k => {
          initInputs[k] = '';
        });
      }
    }

    setRunInputs(initInputs);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Console Client</h1>
          <p className="text-gray-600">Gérez vos abonnements et orchestrez vos workflows d'agents IA.</p>
        </div>

        <div className="flex space-x-1 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Abonnements
          </button>
          <button
            onClick={() => {
              setActiveTab('workflows');
              setShowBuilder(false);
              setRunningWfId(null);
              setRunResult(null);
            }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'workflows'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Workflows IA
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-8 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* TAB 1: Subscriptions */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-brand-500" />
            <span>Mes services d'agents actifs</span>
          </h2>

          {subscriptions.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-6">
              <Cpu className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">Aucun abonnement actif</h3>
              <p className="text-gray-500 text-sm mb-6">
                Vous n'êtes actuellement abonné à aucun agent payant.
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all"
              >
                <span>Découvrir les agents</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded border border-brand-100">
                        {sub.agent.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        Actif depuis: {new Date(sub.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{sub.agent.name}</h3>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-2">{sub.agent.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="font-bold text-gray-900 text-sm">
                      {parseFloat(sub.agent.price_month)} € / mois
                    </span>
                    <div className="flex space-x-2">
                      <Link
                        to={`/agents/${sub.agent_id}`}
                        className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg transition-colors"
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

      {/* TAB 2: Workflows */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workflows List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-brand-500" />
                <span>Mes Workflows</span>
              </h2>
              
              {!showBuilder && (
                <button
                  onClick={() => setShowBuilder(true)}
                  className="inline-flex items-center space-x-1 text-xs bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 py-2 rounded-lg transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nouveau</span>
                </button>
              )}
            </div>

            {workflows.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
                <Layers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucun workflow configuré.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((wf) => (
                  <div 
                    key={wf.id}
                    className={`p-5 rounded-xl border transition-all cursor-pointer ${
                      runningWfId === wf.id 
                        ? 'border-brand-500 bg-brand-50/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => handleOpenRunner(wf)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-md truncate">{wf.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(wf.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{wf.description}</p>
                    
                    {/* Steps visual badge chain */}
                    <div className="flex items-center flex-wrap gap-1">
                      {wf.definition.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono font-medium">
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

          {/* Workflow Builder OR Execution Panel */}
          <div className="lg:col-span-2">
            {showBuilder ? (
              /* Builder Panel */
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Créer un Workflow Multi-Agents</h3>
                <form onSubmit={handleCreateWorkflow} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                        Nom du Workflow
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Campagne Marketing Global"
                        value={newWfName}
                        onChange={(e) => setNewWfName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Génère slogans puis les traduit en anglais"
                        value={newWfDesc}
                        onChange={(e) => setNewWfDesc(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Steps list */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-gray-800">Chaîne d'Agents</span>
                      <button
                        type="button"
                        onClick={handleAddStep}
                        className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-3 py-1.5 rounded-lg border border-brand-100 transition-colors flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Ajouter un Agent</span>
                      </button>
                    </div>

                    {wfSteps.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-xs text-gray-400">
                        Ajoutez des agents pour définir les étapes séquentielles de traitement.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {wfSteps.map((step, idx) => {
                          const selectedAgentObj = agents.find(a => a.id === step.agent_id);
                          return (
                            <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs bg-brand-500 text-white font-bold h-5 w-5 rounded-full flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(idx)}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                                >
                                  Retirer
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Agent Select */}
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                    Sélectionner l'agent
                                  </label>
                                  <select
                                    required
                                    value={step.agent_id}
                                    onChange={(e) => handleStepAgentChange(idx, e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                  >
                                    <option value="">-- Choisir un agent --</option>
                                    {agents.map(a => (
                                      <option key={a.id} value={a.id}>
                                        {a.name} ({a.tier})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Inputs Mappings display */}
                                {selectedAgentObj && selectedAgentObj.input_schema && (
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center">
                                      <span>Mappage des Entrées</span>
                                      <HelpCircle className="h-3 w-3 text-gray-400 ml-1 cursor-pointer" title="Liez l'entrée de cet agent à une variable de sortie des étapes précédentes ou de départ." />
                                    </label>
                                    <div className="space-y-2 max-h-[120px] overflow-y-auto">
                                      {Object.keys(selectedAgentObj.input_schema).map((inputKey) => (
                                        <div key={inputKey} className="flex items-center justify-between text-xs gap-2 bg-white border border-gray-100 p-2 rounded">
                                          <span className="font-medium text-gray-700 truncate max-w-[80px]">{inputKey}</span>
                                          <span className="text-gray-400">depuis</span>
                                          <input
                                            type="text"
                                            required
                                            value={step.input_mappings[inputKey] || ''}
                                            onChange={(e) => handleMappingChange(idx, inputKey, e.target.value)}
                                            placeholder="nom_du_champ"
                                            className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-[11px] focus:outline-none w-[100px]"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={submittingWf}
                      className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-bold rounded-xl text-sm transition-all"
                    >
                      {submittingWf ? 'Enregistrement...' : 'Enregistrer le Workflow'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBuilder(false)}
                      className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            ) : runningWfId ? (
              /* Workflow Runner Panel */
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-bold uppercase border border-brand-100">
                        Exécution active
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">
                        {workflows.find(w => w.id === runningWfId)?.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setRunningWfId(null);
                        setRunResult(null);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
                    >
                      Fermer
                    </button>
                  </div>

                  <form onSubmit={handleRunWorkflow} className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Paramètres de départ (Initial inputs)
                      </span>
                      
                      {Object.keys(runInputs).length === 0 ? (
                        <p className="text-xs text-gray-400">Aucun paramètre requis pour démarrer.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.keys(runInputs).map((key) => (
                            <div key={key}>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">{key}</label>
                              <input
                                type="text"
                                required
                                value={runInputs[key]}
                                onChange={(e) => setRunInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={`Entrez la valeur pour ${key}`}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={executingWf}
                      className="px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md shadow-brand-500/10"
                    >
                      {executingWf ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Calcul multi-agents en cours...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>Lancer le Workflow</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Workflow execution Results */}
                {runResult && (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
                    <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                      <span className="font-bold text-emerald-800 text-sm flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Workflow exécuté avec succès !</span>
                      </span>
                    </div>

                    {/* Step-by-step trace */}
                    <div className="p-6 space-y-6">
                      <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Traces d'exécution pas-à-pas</h4>
                      
                      <div className="relative border-l border-gray-200 pl-6 space-y-6">
                        {runResult.results.map((step, idx) => (
                          <div key={idx} className="relative">
                            {/* Dot indicator */}
                            <span className="absolute -left-9 top-0.5 bg-brand-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ring-4 ring-white">
                              {idx + 1}
                            </span>
                            
                            <h5 className="font-bold text-gray-900 text-sm">
                              Étape {idx + 1} : {step.agent_name} <span className="text-xs text-gray-400 font-mono">({step.agent_id})</span>
                            </h5>

                            {/* Inputs detail */}
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                                <span className="font-bold text-gray-500 block mb-1">Entrées reçues</span>
                                <pre className="font-mono text-gray-700 whitespace-pre-wrap">{JSON.stringify(step.inputs, null, 2)}</pre>
                              </div>
                              <div className="bg-emerald-50/30 p-3 rounded-lg border border-emerald-100 text-xs">
                                <span className="font-bold text-emerald-800 block mb-1">Sorties renvoyées</span>
                                <pre className="font-mono text-gray-800 whitespace-pre-wrap">{JSON.stringify(step.outputs, null, 2)}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Final Outputs summary */}
                      <hr className="border-gray-200" />
                      
                      <div>
                        <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">État final de la mémoire globale</h4>
                        <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                          <pre className="font-mono text-gray-300 text-xs overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(runResult.final_output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Prompt selection message */
              <div className="h-full min-h-[300px] flex flex-col justify-center items-center text-center p-6 bg-white border border-gray-200 rounded-2xl border-dashed text-gray-400">
                <GitBranch className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-md font-bold text-gray-700 mb-1">Aucun workflow sélectionné</h3>
                <p className="text-xs max-w-xs mx-auto">
                  Sélectionnez un workflow dans le volet de gauche ou cliquez sur **Nouveau** pour en concevoir un.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
