import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Save, X, Settings2 } from 'lucide-react';
import { api } from '../utils/api';

const initialNodes = [
  { id: '1', position: { x: 250, y: 100 }, data: { label: 'Input Node' }, type: 'input' },
];
const initialEdges = [];

export default function WorkflowBuilder({ agents, onClose, onSave }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addAgentNode = (agent) => {
    const newNode = {
      id: `${agent.id}-${Date.now()}`,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: agent.name, agentId: agent.id },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSave = async () => {
    if (!name) {
      alert("Veuillez donner un nom au workflow");
      return;
    }
    
    // Transform nodes and edges into the format expected by the API (wfSteps)
    // This is a simplified transformation for demo purposes
    // In a real n8n-like app, we'd traverse the graph from input to outputs
    const steps = nodes
      .filter(n => n.data.agentId)
      .map(n => {
        // Find incoming edges to map inputs
        const incomingEdges = edges.filter(e => e.target === n.id);
        const input_mappings = {};
        
        // For simplicity, we just map everything linearly or use dummy mappings
        incomingEdges.forEach(e => {
          input_mappings['input'] = `from_${e.source}`; 
        });
        
        return {
          agent_id: n.data.agentId,
          input_mappings: input_mappings
        };
      });

    try {
      setSubmitting(true);
      const newWf = await api.createWorkflow(name, description, steps);
      onSave(newWf);
    } catch (err) {
      alert("Erreur lors de la création du workflow: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="h-5 w-5" />
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="flex flex-col">
            <input 
              type="text" 
              placeholder="Nom du workflow" 
              className="font-bold text-lg text-gray-900 border-none focus:outline-none focus:ring-0 p-0"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Description (optionnelle)" 
              className="text-sm text-gray-500 border-none focus:outline-none focus:ring-0 p-0 w-64"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            <span>Paramètres</span>
          </button>
          
          <button 
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Agents */}
        <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 flex flex-col h-full overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Agents disponibles</h3>
          <div className="space-y-3">
            {agents.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucun agent disponible. Abonnez-vous d'abord à des agents depuis le catalogue.</p>
            ) : (
              agents.map(agent => (
                <div 
                  key={agent.id} 
                  className="bg-white p-3 border border-gray-200 rounded-xl shadow-sm hover:border-brand-500 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
                  onClick={() => addAgentNode(agent)}
                >
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{agent.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{agent.category}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 bg-brand-50 text-brand-600 p-1.5 rounded-lg transition-opacity">
                    <Play className="h-3 w-3" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Canvas React Flow */}
        <div className="flex-1 h-full bg-gray-50/50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-gray-50/50"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="top-right" className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-xs text-gray-500">
              Drag & Drop non supporté - Cliquez sur un agent pour l'ajouter
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
