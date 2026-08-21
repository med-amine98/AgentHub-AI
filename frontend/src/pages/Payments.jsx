import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard, Lock, CheckCircle2, Loader2, ShieldCheck,
  Receipt, TrendingUp, AlertCircle, ExternalLink, Info
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

// Helper to ensure Stripe.js is loaded from CDN
const getStripeInstance = async (publishableKey) => {
  if (typeof window.Stripe === 'function') {
    return window.Stripe(publishableKey);
  }

  // If script not loaded yet, inject dynamically
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('stripe-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        resolve(window.Stripe(publishableKey));
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Impossible de charger Stripe.js depuis le CDN.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'stripe-js';
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      if (typeof window.Stripe === 'function') {
        resolve(window.Stripe(publishableKey));
      } else {
        reject(new Error('Erreur d\'initialisation de Stripe.js.'));
      }
    };
    script.onerror = () => {
      reject(new Error('Échec du téléchargement de Stripe.js.'));
    };
    document.head.appendChild(script);
  });
};

export default function Payments({ user }) {
  const navigate = useNavigate();

  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [cardholderName, setCardholderName] = useState('');
  const [cardError, setCardError] = useState(null);
  const [initError, setInitError] = useState(null);

  const cardElementRef = useRef(null);
  const stripeRef = useRef(null);
  const cardComponentRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function init() {
      try {
        setLoadingData(true);
        const [configData, usageData, invoiceData] = await Promise.all([
          api.getStripeConfig(),
          api.getUsageSummary(),
          api.getInvoices(),
        ]);

        if (!isMounted) return;

        setUsage(usageData);
        setInvoices(invoiceData);

        // Initialize Stripe.js instance
        const stripe = await getStripeInstance(configData.publishable_key);
        if (!isMounted) return;
        stripeRef.current = stripe;

        // Mount Card element
        const elements = stripe.elements();
        const card = elements.create('card', {
          style: {
            base: {
              fontSize: '14px',
              fontFamily: '"Inter", sans-serif',
              color: '#111827',
              letterSpacing: '0.025em',
              '::placeholder': { color: '#9CA3AF' },
            },
            invalid: {
              color: '#EF4444',
              iconColor: '#EF4444',
            },
          },
          hidePostalCode: true,
        });

        if (cardElementRef.current) {
          card.mount(cardElementRef.current);
          cardComponentRef.current = card;
        }
      } catch (err) {
        if (isMounted) {
          setInitError(err.message || 'Erreur lors de l\'initialisation de Stripe.');
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (cardComponentRef.current) {
        try {
          cardComponentRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripeRef.current || !cardComponentRef.current) {
      setCardError('Le module Stripe n\'est pas prêt. Veuillez recharger la page.');
      return;
    }

    setProcessing(true);
    setCardError(null);

    const amountEur = usage ? Math.max(usage.total_cost, 0.50) : 0.50;
    const amountCents = Math.round(amountEur * 100);

    try {
      // 1. Create PaymentIntent on server
      const { client_secret } = await api.createPaymentIntent(
        amountCents,
        `AgentHub AI - Paiement consommation agents IA`
      );

      // 2. Confirm card payment with Stripe.js directly
      const { error, paymentIntent } = await stripeRef.current.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardComponentRef.current,
          billing_details: { name: cardholderName || user.email },
        },
      });

      if (error) {
        setCardError(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSuccess({
          id: paymentIntent.id,
          amount: amountEur,
          currency: 'EUR',
        });
      }
    } catch (err) {
      setCardError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setProcessing(false);
    }
  };

  const amountEur = usage ? Math.max(usage.total_cost, 0.50) : 0.50;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Lock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Connexion requise</h2>
        <p className="text-gray-500 text-sm mb-6">Veuillez vous connecter pour accéder à la page de paiement.</p>
        <Link to="/login" className="px-6 py-3 bg-brand-500 text-white rounded-xl font-bold text-sm">
          Se connecter
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="bg-emerald-50 p-5 rounded-full inline-block mb-6">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Paiement accepté !</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left text-sm text-gray-700 mb-6 space-y-2">
          <p><span className="font-bold">ID Stripe :</span> <span className="font-mono text-xs text-brand-700 font-bold">{success.id}</span></p>
          <p><span className="font-bold">Montant débité :</span> {success.amount.toFixed(2)} {success.currency}</p>
          <p className="text-xs text-gray-500 mt-2">
            Votre transaction a été enregistrée avec succès dans le mode test Stripe.
          </p>
        </div>
        <Link to="/dashboard" className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm inline-block transition-all shadow-md shadow-brand-500/20">
          Retour au Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Page header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase mb-4 border border-brand-100">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Paiement sécurisé via Stripe</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Facturation & Paiements</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
          Réglez votre consommation d'agents IA. Vos données bancaires sont cryptées et traitées directement par Stripe.
        </p>
      </div>

      {/* Usage KPI cards */}
      {!loadingData && usage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center space-x-4">
            <div className="p-3 bg-brand-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-brand-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Appels d'agents</p>
              <p className="text-2xl font-extrabold text-gray-900">{usage.total_calls}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Receipt className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Coût total accumulé</p>
              <p className="text-2xl font-extrabold text-gray-900">{usage.total_cost.toFixed(4)} €</p>
            </div>
          </div>
        </div>
      )}

      {initError && (
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{initError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── Stripe Payment Form ─────────────────────────────────────── */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-brand-500" />
                <span className="font-bold text-gray-900 text-sm">Payer par carte bancaire</span>
              </div>
              <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                Powered by Stripe
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Amount summary */}
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-800">Montant à régler</span>
                <span className="text-xl font-extrabold text-brand-700">{amountEur.toFixed(2)} €</span>
              </div>

              {/* Cardholder name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Nom sur la carte
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
              </div>

              {/* Stripe Card Element DOM Mount */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Informations de carte
                </label>
                <div className="px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all min-h-[44px]">
                  <div ref={cardElementRef} id="card-element" />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400 flex items-center space-x-1">
                  <Info className="h-3 w-3" />
                  <span>Mode test Stripe — carte <span className="font-mono font-bold">4242 4242 4242 4242</span>, exp. 12/34, CVC 123.</span>
                </p>
              </div>

              {/* Card error */}
              {cardError && (
                <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{cardError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={processing || loadingData}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 text-sm flex items-center justify-center space-x-2 transition-all"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Traitement Stripe en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Payer {amountEur.toFixed(2)} € avec Stripe</span>
                  </>
                )}
              </button>
            </form>

            {/* Security row */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center space-x-6 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4" />
                <span>SSL / TLS</span>
              </span>
              <span className="flex items-center space-x-1">
                <Lock className="h-4 w-4" />
                <span>PCI DSS</span>
              </span>
              <span>VISA / MC / Amex</span>
            </div>
          </div>
        </div>

        {/* ── Invoice history ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-brand-500" />
            <span>Historique des factures</span>
          </h2>

          {loadingData ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-semibold">Aucune facture disponible</p>
              <p className="text-gray-400 text-xs mt-1">
                Commencez à utiliser des agents pour générer votre première facture.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.invoice_id}
                  className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-gray-300 transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-900 text-sm font-mono">{inv.invoice_id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Période : <strong>{inv.period}</strong> · {inv.total_calls} appel{inv.total_calls > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-gray-900 text-sm">
                      {inv.total_cost.toFixed(4)} {inv.currency}
                    </p>
                    <span
                      className={`mt-1 inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {inv.status === 'paid' ? 'Payé' : 'Gratuit'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
