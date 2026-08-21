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

  async executeAgent(agentId, inputs, fileIds = []) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/execute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ inputs, file_ids: fileIds }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de l\'exécution de l\'agent');
    }
    return response.json();
  },

  async getAgentSessions(agentId) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/sessions`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
    return response.json();
  },

  // ── File Uploads ──────────────────────────────────────────────────────────

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/uploads`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de l\'upload du fichier');
    }
    return response.json();
  },

  async getMyFiles() {
    const response = await fetch(`${API_BASE_URL}/api/uploads`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur lors du chargement des fichiers');
    return response.json();
  },

  async deleteFile(fileId) {
    const response = await fetch(`${API_BASE_URL}/api/uploads/${fileId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression du fichier');
    return true;
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

  async getWorkflowTemplates() {
    const response = await fetch(`${API_BASE_URL}/api/workflows/templates`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des templates de workflows');
    }
    return response.json();
  },

  async createWorkflowFromTemplate(templateId) {
    const response = await fetch(`${API_BASE_URL}/api/workflows/from-template/${templateId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création depuis le template');
    }
    return response.json();
  },

  // ── Payments (Stripe) ─────────────────────────────────────────────────────

  /** Fetch the Stripe publishable key from the backend (keeps it out of env files) */
  async getStripeConfig() {
    const response = await fetch(`${API_BASE_URL}/api/payments/config`);
    if (!response.ok) throw new Error('Impossible de charger la configuration Stripe');
    return response.json(); // { publishable_key: "pk_test_..." }
  },

  /** Get the logged-in user's cumulative usage & cost */
  async getUsageSummary() {
    const response = await fetch(`${API_BASE_URL}/api/payments/usage`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération du résumé d\'utilisation');
    return response.json();
  },

  /**
   * Ask the backend to create a Stripe PaymentIntent.
   * Returns { client_secret, payment_intent_id, amount_cents, currency }
   * The frontend then uses stripe.confirmCardPayment(client_secret, ...) to charge.
   *
   * @param {number} amountCents  Amount in euro cents (min 50)
   * @param {string} description  Optional description shown on the Stripe dashboard
   */
  async createPaymentIntent(amountCents, description = '') {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-payment-intent`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount_cents: amountCents, currency: 'eur', description }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création du paiement Stripe');
    }
    return response.json();
  },

  /** Fetch invoice history (usage grouped by month) */
  async getInvoices() {
    const response = await fetch(`${API_BASE_URL}/api/payments/invoices`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des factures');
    return response.json();
  },

  // ── Admin Endpoints ───────────────────────────────────────────────────────

  async adminRegister(email, password, confirmPassword, adminSecret) {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        confirm_password: confirmPassword,
        admin_secret: adminSecret
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création du compte administrateur');
    }
    return response.json();
  },

  async getAdminStats() {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors du chargement des statistiques admin');
    }
    return response.json();
  },

  async getAdminUsers() {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors du chargement des utilisateurs');
    }
    return response.json();
  },

  async updateUserRole(userId, role) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors du changement de rôle');
    }
    return response.json();
  },

  async deleteUser(userId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la suppression de l\'utilisateur');
    }
    return true;
  },

  async getAdminAgents() {
    const response = await fetch(`${API_BASE_URL}/api/admin/agents`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors du chargement des agents admin');
    }
    return response.json();
  },

  async createAdminAgent(agentData) {
    const response = await fetch(`${API_BASE_URL}/api/admin/agents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(agentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création de l\'agent');
    }
    return response.json();
  },

  async updateAdminAgent(agentId, agentData) {
    const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(agentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la mise à jour de l\'agent');
    }
    return response.json();
  },

  async deleteAdminAgent(agentId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la suppression de l\'agent');
    }
    return true;
  },

  async getAdminUsageLogs(limit = 50) {
    const response = await fetch(`${API_BASE_URL}/api/admin/usage-logs?limit=${limit}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors du chargement des journaux');
    }
    return response.json();
  },
};

