import { useState, useEffect } from 'react';
import { Crown, Check, Star, Zap, Mail, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

export function JoinVIPPage({ onPageChange }: { onPageChange?: (p: string) => void }) {
  const { user, profile } = useAuth();
  const [requestSent, setRequestSent] = useState(false);
  const [, setAlreadyRequested] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [paymentModeEnabled, setPaymentModeEnabled] = useState(false);

  const isVIP = profile?.is_vip;
  const isAdmin = profile?.is_admin;

  useEffect(() => {
    (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { single: () => Promise<{ data: { payment_mode_enabled: boolean } | null }> } } } })
      .from('monetisation_config_public')
      .select('payment_mode_enabled')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
      .then(({ data }) => {
        if (data?.payment_mode_enabled) setPaymentModeEnabled(true);
      });
    if (user) {
      checkExistingRequest();
    }
  }, [user]);

  const checkExistingRequest = async () => {
    const { data } = await supabase
      .from('vip_requests')
      .select('id, status')
      .eq('user_id', user!.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (data) {
      setAlreadyRequested(true);
      setRequestSent(true);
    }
  };

  const handleRequestVIP = async () => {
    if (!user) return;

    if (paymentModeEnabled) {
      onPageChange?.('abonnement');
      window.history.pushState({}, '', '/abonnement');
      return;
    }

    setRequestLoading(true);
    const { error } = await supabase.from('vip_requests').insert({ user_id: user.id });
    if (!error) setRequestSent(true);
    setRequestLoading(false);
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600 rounded-full mb-4">
            <Crown size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Devenir Membre VIP</h1>
          <p className="text-lg text-gray-400">Accédez à toutes nos prédictions exclusives</p>
        </div>

        {isAdmin ? (
          <div className="bg-emerald-900/30 border border-emerald-600 rounded-xl p-6 mb-6 text-center">
            <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">Compte Administrateur</h2>
            <p className="text-gray-300">Vous avez déjà un accès complet à toutes les fonctionnalités du site.</p>
          </div>
        ) : isVIP && (
          <div className="bg-emerald-900/30 border border-emerald-600 rounded-xl p-6 mb-6 text-center">
            <Crown size={32} className="text-yellow-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">Vous êtes déjà VIP !</h2>
            <p className="text-gray-300">Profitez de toutes les prédictions exclusives dans votre espace membre.</p>
            {profile?.vip_expires_at && (
              <p className="text-sm text-gray-400 mt-2">
                Votre accès expire le {new Date(profile.vip_expires_at).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        <div className="bg-black rounded-xl p-6 border border-emerald-700 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Avantages VIP</h2>
          <div className="space-y-3">
            {[
              ['Toutes les prédictions VIP', 'Analyses approfondies et prédictions exclusives'],
              ['Historique complet', 'Consultez toutes nos prédictions passées'],
              ['Statistiques détaillées', 'Suivez nos performances en temps réel'],
              ['Support prioritaire', 'Contact direct avec nos experts'],
              ['Taux de réussite élevé', 'Prédictions avec historique prouvé'],
              ['Multi-sports', 'Football, Tennis, Basketball, Hockey, Rugby...'],
            ].map(([title, sub]) => (
              <div key={title} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                  <Check size={14} className="text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">{title}</div>
                  <div className="text-gray-400 text-sm">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isVIP && !isAdmin && (
          <div className="bg-black rounded-xl p-6 border border-emerald-700 mb-6">
            {paymentModeEnabled ? (
              /* ── Mode Société ── */
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-yellow-500" />
                  Abonnement en ligne
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-300 mb-4">
                  <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-600 flex items-center justify-center text-black text-xs font-bold">1</div>
                    <span>Créez votre compte</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-600 flex items-center justify-center text-black text-xs font-bold">2</div>
                    <span>Choisissez un plan</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-600 flex items-center justify-center text-black text-xs font-bold">3</div>
                    <span>Accès immédiat + facture</span>
                  </div>
                </div>
                {user && (
                  <p className="text-gray-300 text-sm">
                    Connecté en tant que <span className="text-emerald-400 font-medium">{profile?.email}</span>. Cliquez ci-dessous pour choisir votre formule.
                  </p>
                )}
              </div>
            ) : (
              /* ── Mode Normal ── */
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Mail size={18} className="text-yellow-500" />
                  Demande d'accès VIP
                </h3>

                {!user ? (
                  <div>
                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 mb-4">
                      <p className="text-yellow-400 text-sm font-semibold mb-1">Inscription obligatoire avec votre email</p>
                      <p className="text-gray-400 text-xs">
                        Votre adresse email est indispensable pour recevoir la confirmation d'accès et correspondre avec l'admin. Les demandes sans compte valide ne sont pas traitées.
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      {[
                        ['1', 'Inscrivez-vous avec votre email'],
                        ['2', 'Faites votre demande VIP'],
                        ['3', 'L\'admin l\'examine et vous contacte'],
                      ].map(([n, label]) => (
                        <div key={n} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">{n}</div>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : requestSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check size={24} className="text-white" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-2">Demande envoyée !</h4>
                    <p className="text-gray-300 mb-3">
                      Votre demande a bien été reçue dans le panneau d'administration. L'admin vous contactera à l'adresse <span className="text-emerald-400 font-semibold">{profile?.email}</span> pour vous confirmer votre accès.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>Délai de traitement habituel : sous 24h</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 mb-3">
                      Connecté en tant que <span className="text-emerald-400 font-medium">{profile?.email}</span>. Votre demande sera envoyée directement à l'admin du site.
                    </p>
                    <div className="bg-gray-900 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <Mail size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-400">
                        L'admin recevra votre email <span className="text-white font-semibold">{profile?.email}</span> pour vous attribuer une formule (1 mois, 3 mois, etc.) et vous contacter directement.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span>Activation sous 24h après validation par notre équipe</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!isVIP && !isAdmin && user && !requestSent && (
          <button
            onClick={handleRequestVIP}
            disabled={requestLoading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-3 shadow-lg mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star size={24} />
            <span className="text-lg">
              {requestLoading ? 'Envoi...' : paymentModeEnabled ? 'Voir les abonnements' : 'Demander l\'accès VIP'}
            </span>
          </button>
        )}

        {!user && !isAdmin && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">Créez votre compte gratuit avec votre email pour commencer</p>
            <a
              href="/member"
              className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] text-center text-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <Zap size={24} />
                S'inscrire gratuitement
              </span>
            </a>
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-emerald-900/20 to-yellow-900/20 rounded-xl p-6 border border-emerald-700 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Rejoignez notre communauté de gagnants</h3>
          <p className="text-gray-400 text-sm">Des centaines de membres VIP font confiance à PronoExpert</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
