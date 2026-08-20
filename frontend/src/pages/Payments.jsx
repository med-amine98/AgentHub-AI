import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Payments({ user }) {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2000);
  };

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
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-emerald-50 p-5 rounded-full inline-block mb-6">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Paiement simulé avec succès !</h2>
        <p className="text-gray-600 text-sm mb-8">
          Ceci est une démonstration. En production, ce formulaire serait intégré avec Stripe, PayPal ou un autre processeur de paiement sécurisé.
        </p>
        <Link to="/dashboard" className="px-6 py-3 bg-brand-500 text-white rounded-xl font-bold text-sm">
          Accéder à mon Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase mb-4">
          <Lock className="h-3.5 w-3.5" />
          <span>Paiement sécurisé (Simulation)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Méthode de paiement</h1>
        <p className="text-gray-600 text-sm">
          Ajoutez une carte bancaire pour activer vos abonnements aux agents payants.
        </p>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-brand-500" />
          <span className="font-bold text-gray-900 text-sm">Carte de crédit ou de débit</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Nom sur la carte
            </label>
            <input
              type="text"
              required
              placeholder="Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Numéro de carte
            </label>
            <input
              type="text"
              required
              maxLength={19}
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').substring(0, 16);
                setCardNumber(v.replace(/(.{4})/g, '$1 ').trim());
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Expiration
              </label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="MM/AA"
                value={expiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '').substring(0, 4);
                  if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
                  setExpiry(v);
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                CVC
              </label>
              <input
                type="text"
                required
                maxLength={3}
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 text-sm flex items-center justify-center space-x-2 transition-all"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Traitement en cours...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Enregistrer le moyen de paiement</span>
              </>
            )}
          </button>
        </form>

        {/* Security badges */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center space-x-6 text-xs text-gray-400">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="h-4 w-4" />
            <span>SSL / TLS</span>
          </span>
          <span className="flex items-center space-x-1">
            <Lock className="h-4 w-4" />
            <span>PCI DSS Conforme</span>
          </span>
          <span>VISA / MasterCard / Amex</span>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        <strong>Note :</strong> Ce formulaire est une simulation pour la démonstration. Aucune transaction financière réelle n'est effectuée.
        En production, ce formulaire serait remplacé par l'intégration de Stripe Elements ou PayPal Checkout.
      </p>
    </div>
  );
}
