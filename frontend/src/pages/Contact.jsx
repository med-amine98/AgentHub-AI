import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-brand-900 tracking-tight mb-4">
            Contactez notre équipe
          </h1>
          <p className="text-lg text-brand-700 max-w-2xl mx-auto">
            Vous avez une question sur nos offres Enterprise ou besoin d'aide pour configurer un workflow complexe ? Nous sommes là pour vous aider.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto animate-fade-in">
          {/* Info Section */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-brand-200 shadow-sm">
              <h3 className="text-xl font-bold text-brand-900 mb-6">Informations de contact</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Mail className="h-6 w-6 text-brand-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-brand-900">Email</p>
                    <p className="text-brand-600 mt-1">contact@agenthub.ai</p>
                    <p className="text-brand-600">support@agenthub.ai</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Phone className="h-6 w-6 text-brand-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Téléphone</p>
                    <p className="text-gray-600 mt-1">+33 1 84 25 00 00</p>
                    <p className="text-sm text-gray-500 mt-1">Lun - Ven, 9h - 18h CET</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin className="h-6 w-6 text-brand-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Bureaux</p>
                    <p className="text-gray-600 mt-1">123 Avenue de l'Intelligence</p>
                    <p className="text-gray-600">75001 Paris, France</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-10 rounded-2xl border border-gray-200 shadow-sm">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
                  <p className="text-gray-600 mb-8">
                    Notre équipe vous recontactera dans les plus brefs délais.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-brand-700 bg-brand-100 hover:bg-brand-200 transition-colors"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                      <input
                        type="text"
                        id="first_name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        placeholder="Jean"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input
                        type="text"
                        id="last_name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        placeholder="Dupont"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                      placeholder="jean.dupont@entreprise.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                    <select
                      id="subject"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white"
                      required
                    >
                      <option value="">Sélectionnez un sujet</option>
                      <option value="sales">Question commerciale (Offre Enterprise)</option>
                      <option value="support">Support technique</option>
                      <option value="partnership">Partenariat</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      id="message"
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                      placeholder="Comment pouvons-nous vous aider ?"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Envoyer le message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
