import { useAuth } from '../contexts/AuthContext';
import { LogOut, Crown, User, Star, Shield } from 'lucide-react';
import { LoginModal } from '../components/LoginModal';
import { useState } from 'react';
import { Footer } from '../components/Footer';

export default function MemberPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-full mb-6">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Espace Membre</h1>
          <p className="text-gray-400 mb-8">
            Connectez-vous ou créez un compte pour accéder à votre espace personnel.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] text-lg"
          >
            Se connecter / S'inscrire
          </button>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        <Footer />
      </div>
    );
  }

  const isVIP = profile?.is_vip;
  const isAdmin = profile?.is_admin;

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Mon Espace</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center">
              <User size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{profile?.email}</h2>
              <div className="flex items-center gap-2 mt-1">
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-600/20 text-red-300">
                    <Shield size={14} />
                    Administrateur
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  isVIP
                    ? 'bg-yellow-600/20 text-yellow-300'
                    : 'bg-gray-800 text-gray-300'
                }`}>
                  {isVIP ? <Crown size={14} /> : <User size={14} />}
                  {isVIP ? 'Membre VIP' : 'Membre'}
                </span>
              </div>
            </div>
          </div>
          {profile?.vip_expires_at && isVIP && (
            <p className="text-gray-400 text-sm mt-4 pl-[4.5rem]">
              VIP jusqu'au {new Date(profile.vip_expires_at).toLocaleDateString('fr-FR')}
              {' '}({Math.max(0, Math.ceil((new Date(profile.vip_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} jours restants)
            </p>
          )}
        </div>

        {/* VIP Status / Upgrade — hidden for admins */}
        {isAdmin ? (
          <div className="bg-gradient-to-r from-red-900/20 to-emerald-900/20 rounded-xl p-6 mb-6 border border-red-700/50">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={24} className="text-red-400" />
              <h3 className="text-lg font-bold text-white">Compte Administrateur</h3>
            </div>
            <p className="text-gray-300">
              Vous avez un accès complet à toutes les fonctionnalités du site, y compris les prédictions VIP et le panneau d'administration.
            </p>
            <a
              href="/admin"
              className="inline-block mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Panneau d'administration
            </a>
          </div>
        ) : isVIP ? (
          <div className="bg-gradient-to-r from-yellow-900/20 to-emerald-900/20 rounded-xl p-6 mb-6 border border-yellow-700/50">
            <div className="flex items-center gap-3 mb-3">
              <Crown size={24} className="text-yellow-500" />
              <h3 className="text-lg font-bold text-white">Accès VIP actif</h3>
            </div>
            <p className="text-gray-300">
              Vous avez accès à toutes les prédictions VIP exclusives. Consultez-les dans la section VIP.
            </p>
            <a
              href="/vip"
              className="inline-block mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition-colors"
            >
              Voir mes prédictions VIP
            </a>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <Star size={24} className="text-yellow-500" />
              <h3 className="text-lg font-bold text-white">Passer au VIP</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Débloquez l'accès à toutes nos prédictions exclusives avec un taux de réussite prouvé.
            </p>
            <a
              href="/joinvip"
              className="inline-block px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-lg transition-colors"
            >
              Demander l'accès VIP
            </a>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/stats"
            className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-emerald-700 transition-colors group"
          >
            <h4 className="text-white font-semibold mb-1 group-hover:text-emerald-400 transition-colors">Historique</h4>
            <p className="text-gray-400 text-sm">Consultez nos résultats</p>
          </a>
          <a
            href="/news"
            className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-emerald-700 transition-colors group"
          >
            <h4 className="text-white font-semibold mb-1 group-hover:text-emerald-400 transition-colors">Analyses</h4>
            <p className="text-gray-400 text-sm">Articles et analyses</p>
          </a>
          <a
            href="/vip"
            className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-yellow-700 transition-colors group"
          >
            <h4 className="text-white font-semibold mb-1 group-hover:text-yellow-400 transition-colors">Prédictions VIP</h4>
            <p className="text-gray-400 text-sm">Nos pronostics exclusifs</p>
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
