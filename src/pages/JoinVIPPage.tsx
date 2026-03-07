import { Crown, Check, Send } from 'lucide-react';
import { Footer } from '../components/Footer';

export function JoinVIPPage() {
  const handleTelegramContact = () => {
    window.open('https://t.me/oraclebetsports', '_blank');
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

        <div className="bg-black rounded-xl p-6 border border-emerald-700 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Comment devenir membre VIP ?</h3>
          <p className="text-gray-300 mb-3">
            L'accès VIP est accordé manuellement par notre équipe. Pour devenir membre, contactez-nous directement sur Telegram. Nous vous fournirons toutes les informations nécessaires.
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Activation sous 24h après validation</span>
          </div>
        </div>

        <button
          onClick={handleTelegramContact}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-3 shadow-lg mb-3"
        >
          <Send size={24} />
          <span className="text-lg">Contacter sur Telegram</span>
        </button>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Telegram: <span className="text-yellow-600 font-mono">@oraclebetsports</span>
          </p>
        </div>

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
