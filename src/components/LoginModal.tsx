import { useState } from 'react';
import { X, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          setLoading(false);
          return;
        }
        await signUp(email, password);
        setSuccess('Compte créé avec succès ! Vous êtes maintenant connecté.');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      } else {
        await signIn(email, password);
        onClose();
        resetForm();
      }
    } catch (err: any) {
      if (mode === 'register') {
        if (err.message?.includes('already registered')) {
          setError('Un compte existe déjà avec cet email');
        } else {
          setError('Erreur lors de la création du compte');
        }
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full relative border border-gray-800 overflow-hidden">
        <button
          onClick={() => { onClose(); resetForm(); }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              mode === 'login'
                ? 'text-white border-b-2 border-emerald-500 bg-gray-800/50'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <LogIn size={18} />
              Connexion
            </span>
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              mode === 'register'
                ? 'text-white border-b-2 border-emerald-500 bg-gray-800/50'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <UserPlus size={18} />
              Créer un compte
            </span>
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {mode === 'login'
              ? 'Accédez à votre espace membre'
              : 'Inscrivez-vous gratuitement pour accéder aux prédictions'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={mode === 'register' ? 'Minimum 6 caractères' : 'Votre mot de passe'}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Retapez votre mot de passe"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800 rounded-lg p-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (mode === 'login' ? 'Connexion...' : 'Création...')
                : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')
              }
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? (
                <>
                  Pas encore de compte ?{' '}
                  <button
                    onClick={() => switchMode('register')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    S'inscrire gratuitement
                  </button>
                </>
              ) : (
                <>
                  Déjà inscrit ?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
