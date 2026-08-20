const API_BASE_URL = 'http://localhost:8000';

// Helper to get auth headers
const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// API Helper class
export const api = {
  // Authentication
  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur d\'authentification');
    }
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
  },

  async register(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création du compte');
    }
    return response.json();
  },

  async getMe() {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Non authentifié');
    }
    return response.json();
  },

  logout() {
    localStorage.removeItem('token');
  },

  // Agents
  async getAgents(category = '', tier = '') {
    let url = `${API_BASE_URL}/api/agents`;
    const params = [];
    if (category) params.push(`category=${category}`);
    if (tier) params.push(`tier=${tier}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des agents');
    }
    return response.json();
  },

  async getAgent(agentId) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'agent');
    }
    return response.json();
  },

  async executeAgent(agentId, inputs) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/execute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ inputs }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de l\'exécution de l\'agent');
    }
    return response.json();
  },

  // Subscriptions
  async getSubscriptions() {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des abonnements');
    }
    return response.json();
  },

  async subscribe(agentId) {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/subscribe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ agent_id: agentId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur d\'abonnement');
    }
    return response.json();
  },

  async unsubscribe(agentId) {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions/unsubscribe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ agent_id: agentId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur de désabonnement');
    }
    return response.json();
  },

  // Workflows
  async getWorkflows() {
    const response = await fetch(`${API_BASE_URL}/api/workflows`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des workflows');
    }
    return response.json();
  },

  async getWorkflow(workflowId) {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${workflowId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du workflow');
    }
    return response.json();
  },

  async createWorkflow(name, description, definition) {
    const response = await fetch(`${API_BASE_URL}/api/workflows`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description, definition }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création du workflow');
    }
    return response.json();
  },

  async deleteWorkflow(workflowId) {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du workflow');
    }
    return true;
  },

  async runWorkflow(workflowId, initialInputs) {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${workflowId}/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ initial_inputs: initialInputs }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de l\'exécution du workflow');
    }
    return response.json();
  },
};
