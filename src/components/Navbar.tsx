import { LogOut, Home, Crown as VipIcon, Newspaper, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLoginClick: () => void;
}

export function Navbar({ currentPage, onPageChange, onLoginClick }: NavbarProps) {
  const { user, profile, signOut } = useAuth();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-black border-b border-emerald-700 z-40">
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-white">PRONO</span>
                <span className="text-xl font-bold text-yellow-600">EXPERT</span>
              </div>
              <div className="flex items-center space-x-1.5 text-lg">
                <span>⚽️</span>
                <span>🏀</span>
                <span>🥎</span>
                <span>🏈</span>
                <span>🏒</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {!user && (
                <>
                  <button
                    onClick={onLoginClick}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors"
                  >
                    CONNEXION
                  </button>
                  <button
                    onClick={() => onPageChange('joinvip')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black px-3 py-1.5 rounded text-sm font-bold transition-colors"
                  >
                    DEVENIR VIP
                  </button>
                </>
              )}

              <button
                onClick={() => onPageChange('home')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'home'
                    ? 'bg-emerald-700 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                ACCUEIL
              </button>

              <button
                onClick={() => onPageChange('vip')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'vip'
                    ? 'bg-yellow-600 text-black'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                VIP
              </button>

              <button
                onClick={() => onPageChange('news')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'news'
                    ? 'bg-emerald-700 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                ANALYSES
              </button>

              <button
                onClick={() => onPageChange('stats')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'stats'
                    ? 'bg-emerald-700 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                HISTORIQUE
              </button>

              {profile?.is_admin && (
                <button
                  onClick={() => onPageChange('admin')}
                  className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                    currentPage === 'admin'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:text-white'
                  }`}
                >
                  ADMIN
                </button>
              )}

              {user && (
                <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-emerald-700">
                  {profile?.is_vip && (
                    <VipIcon className="text-yellow-600" size={18} />
                  )}
                  <button
                    onClick={signOut}
                    className="text-gray-300 hover:text-white transition-colors p-1"
                    title="Se déconnecter"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden fixed top-14 left-0 right-0 bg-gray-900 border-b border-gray-800 z-30">
        <div className="grid grid-cols-3 gap-2 px-2 py-2">
          {!user && (
            <>
              <button
                onClick={onLoginClick}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                CONNEXION
              </button>
              <button
                onClick={() => onPageChange('joinvip')}
                className="bg-yellow-600 hover:bg-yellow-700 text-black px-3 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                DEVENIR VIP
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange('home')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentPage === 'home'
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            ACCUEIL
          </button>

          <button
            onClick={() => onPageChange('vip')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentPage === 'vip'
                ? 'bg-yellow-600 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            VIP
          </button>

          <button
            onClick={() => onPageChange('news')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentPage === 'news'
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            ANALYSES
          </button>

          <button
            onClick={() => onPageChange('stats')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentPage === 'stats'
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            HISTORIQUE
          </button>

          {profile?.is_admin && (
            <button
              onClick={() => onPageChange('admin')}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                currentPage === 'admin'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              ADMIN
            </button>
          )}

          {user && (
            <button
              onClick={signOut}
              className="bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-700 hover:text-white flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              SORTIR
            </button>
          )}
        </div>
      </div>
    </>
  );
}
