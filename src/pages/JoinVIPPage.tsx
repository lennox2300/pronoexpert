import { useState, useEffect } from 'react';
import { Crown, Check, Star, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

export function JoinVIPPage() {
  const { user, profile } = useAuth();
  const [requestSent, setRequestSent] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const isVIP = profile?.is_vip;

  useEffect(() => {
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
    setRequestLoading(true);

    const { error } = await supabase
      .from('vip_requests')
      .insert({ user_id: user.id });

    if (!error) {
      setRequestSent(true);
    }
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
          <p className="text-lg text-gray-400">
            Accédez à toutes nos prédictions exclusives
          </p>
        </div>

        {isVIP && (
          <div className="bg-emerald-900/30 border border-emerald-600 rounded-xl p-6 mb-6 text-center">
            <Crown size={32} className="text-yellow-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">Vous êtes déjà VIP !</h2>
            <p className="text-gray-300">
              Profitez de toutes les prédictions exclusives dans votre espace membre.
            </p>
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
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                <Check size={14} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Toutes les prédictions VIP</div>
                <div className="text-gray-400 text-sm">
                  Analyses approfondies et prédictions exclusives
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                <Check size={14} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Historique complet</div>
                <div className="text-gray-400 text-sm">
                  Consultez toutes nos prédictions passées
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                <Check size={14} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Statistiques détaillées</div>
                <div className="text-gray-400 text-sm">
                  Suivez nos performances en temps réel
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                <Check size={14} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Support prioritaire</div>
                <div className="text-gray-400 text-sm">
                  Contact direct avec nos experts
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                <Check size={14} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Taux de réussite élevé</div>
                <div className="text-gray-400 text-sm">
                  Prédictions avec historique prouvé
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                <Check size={14} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Multi-sports</div>
                <div className="text-gray-400 text-sm">
                  Football, Tennis, Basketball, Hockey, Rugby...
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isVIP && (
          <div className="bg-black rounded-xl p-6 border border-emerald-700 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Comment devenir membre VIP ?</h3>
            {!user ? (
              <div>
                <p className="text-gray-300 mb-4">
                  Pour devenir VIP, vous devez d'abord créer un compte gratuit. Ensuite, vous pourrez faire une demande d'accès VIP depuis votre espace membre.
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                    <span>Créez votre compte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                    <span>Demandez le VIP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">3</div>
                    <span>Activation sous 24h</span>
                  </div>
                </div>
              </div>
            ) : requestSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={24} className="text-white" />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">Demande envoyée !</h4>
                <p className="text-gray-300">
                  Votre demande d'accès VIP a été enregistrée. Nous l'activerons dans les plus brefs délais.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 mb-4">
                  Vous êtes connecté en tant que <span className="text-emerald-400 font-medium">{profile?.email}</span>. Cliquez ci-dessous pour demander l'accès VIP.
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Activation sous 24h après validation par notre équipe</span>
                </div>
              </div>
            )}
          </div>
        )}

        {!isVIP && user && !requestSent && (
          <button
            onClick={handleRequestVIP}
            disabled={requestLoading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-3 shadow-lg mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star size={24} />
            <span className="text-lg">{requestLoading ? 'Envoi...' : 'Demander l\'accès VIP'}</span>
          </button>
        )}

        {!user && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Créez votre compte gratuit pour commencer
            </p>
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
          <h3 className="text-lg font-bold text-white mb-2">
            Rejoignez notre communauté de gagnants
          </h3>
          <p className="text-gray-400 text-sm">
            Des centaines de membres VIP font confiance à PronoExpert
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
