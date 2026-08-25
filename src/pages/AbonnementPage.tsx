import { useEffect, useState } from 'react';
import { Crown, Check, Shield, AlertCircle, Star, Lock, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Json } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';

interface Plan {
  id: string;
  label: string;
  days: number;
  price: number;
  savings: string;
  popular: boolean;
  active: boolean;
}

const BENEFITS = [
  'Tous les picks en temps réel',
  'Historique complet',
  'Bankroll visible',
  'Analyse de chaque match',
  'Notifications avant les matchs',
];

function pricePerMonth(plan: Plan): string {
  const months = plan.days / 30;
  return (plan.price / months).toFixed(2);
}

export function AbonnementPage({ onPageChange }: { onPageChange: (p: string) => void }) {
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [stripeKey, setStripeKey] = useState('');

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    const { data } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { single: () => Promise<{ data: { plans: Json; stripe_public_key: string | null } | null }> } } } }).from('monetisation_config_public').select('plans, stripe_public_key').eq('id', '00000000-0000-0000-0000-000000000001').single();
    if (data) {
      setPlans((data.plans as unknown as Plan[]).filter((p: Plan) => p.active));
      setStripeKey(data.stripe_public_key || '');
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!selected || !user) return;
    const plan = plans.find((p) => p.id === selected);
    if (!plan) return;
    setPaymentLoading(true);

    if (!stripeKey) {
      alert('Le paiement en ligne est activé mais aucune clé Stripe n\'est configurée. Contactez l\'administrateur.');
    } else {
      alert('Intégration Stripe active — configurez un edge function pour créer une session de paiement.');
    }
    setPaymentLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (profile?.is_vip) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f7c600' }}>
            <Crown size={32} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Vous êtes déjà VIP !</h1>
          <p className="text-gray-400 mb-2">Profitez de toutes les prédictions exclusives.</p>
          {profile.vip_expires_at && (
            <p className="text-sm text-gray-500 mb-6">
              Accès valide jusqu'au {new Date(profile.vip_expires_at).toLocaleDateString('fr-FR')}
            </p>
          )}
          <button
            onClick={() => onPageChange('vip')}
            className="w-full py-3 rounded-xl font-bold text-black transition-all hover:opacity-90"
            style={{ background: '#f7c600' }}
          >
            Accéder au VIP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: '#f7c600' }}>
            <Crown size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Choisissez votre abonnement VIP</h1>
          <p className="text-gray-400">Historique complet · Bankroll en temps réel · Analyses exclusives</p>
        </div>

        <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl border border-amber-700/40 bg-amber-900/10 max-w-xl mx-auto">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-400">Réservé aux personnes de 18 ans et plus. Les paris peuvent créer une dépendance. Jouez de manière responsable.</p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucun abonnement disponible pour le moment.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {plans.map((plan) => {
              const isSelected = selected === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelected(plan.id)}
                  className="relative text-left rounded-2xl border-2 p-4 transition-all duration-200 focus:outline-none"
                  style={{
                    background: '#111',
                    borderColor: isSelected ? '#f7c600' : plan.popular ? 'rgba(247,198,0,0.3)' : '#2a2a2a',
                    boxShadow: isSelected ? '0 0 20px rgba(247,198,0,0.15)' : plan.popular ? '0 0 12px rgba(247,198,0,0.06)' : undefined,
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold text-black" style={{ background: '#f7c600' }}>
                        <Star size={9} fill="black" />POPULAIRE
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{plan.label}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#f7c600' }}>
                        <Check size={12} className="text-black" />
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-white mb-0.5">
                    {plan.price.toFixed(2)}<span className="text-base font-normal text-gray-400">€</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mb-3">soit {pricePerMonth(plan)}€/mois</p>
                  {plan.savings && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-black mb-3" style={{ background: '#f7c600' }}>
                      {plan.savings}
                    </span>
                  )}
                  <div className="space-y-1.5 mt-2">
                    {BENEFITS.map((b) => (
                      <div key={b} className="flex items-start gap-1.5">
                        <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#f7c600' }} />
                        <span className="text-[11px] text-gray-400">{b}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!user ? (
          <div className="text-center max-w-sm mx-auto">
            <p className="text-gray-400 text-sm mb-4">Connectez-vous pour souscrire</p>
            <button
              onClick={() => onPageChange('member')}
              className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all hover:opacity-90"
              style={{ background: '#f7c600' }}
            >
              Créer un compte
            </button>
          </div>
        ) : (
          <div className="max-w-sm mx-auto">
            <button
              onClick={handleSubscribe}
              disabled={!selected || paymentLoading}
              className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#f7c600' }}
            >
              {paymentLoading ? (
                <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Traitement...</>
              ) : (
                <><Lock size={18} />{selected ? `Choisir — ${plans.find((p) => p.id === selected)?.price.toFixed(2)}€` : 'Sélectionnez un plan'}</>
              )}
            </button>
            {selected && (
              <p className="text-[10px] text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
                <FileText size={10} />
                Une facture PDF vous sera remise après le paiement
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2a2a2a] bg-[#111] text-xs text-gray-400">
              <Shield size={12} className="text-emerald-500" />
              Paiement 100% sécurisé
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2a2a2a] bg-[#111] text-xs text-gray-400">
              <Check size={12} className="text-[#f7c600]" />
              Sans engagement
            </div>
          </div>
          <p className="text-[10px] text-gray-600 text-center max-w-xs">
            Annulation simple — contactez l'admin. Les paris peuvent créer une dépendance. +18 uniquement. Jouez de manière responsable.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
