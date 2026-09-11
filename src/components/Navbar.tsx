import { LogOut, Crown as VipIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../hooks/useBranding';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLoginClick: () => void;
}

export function Navbar({ currentPage, onPageChange, onLoginClick }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const branding = useBranding();
  const nameParts = branding.site_name.split(' ');
  const nameFirst = nameParts[0] || 'PRONO';
  const nameRest = nameParts.slice(1).join(' ') || 'EXPERT';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-black border-b border-[#2a2a2a] z-40">
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <button onClick={() => onPageChange('home')} className="flex items-baseline hover:opacity-80 transition-opacity">
                <span className="text-xl font-bold text-white">{nameFirst}</span>
                <span className="text-xl font-bold text-[#22c55e]"> {nameRest}</span>
              </button>
              {branding.site_logo_url ? (
                <img src={branding.site_logo_url} alt="Logo" className="h-7 w-auto object-contain" style={{ maxHeight: '28px' }} />
              ) : (
                <div className="flex items-center space-x-1.5 text-lg">
                  <span>⚽️</span>
                  <span>🏀</span>
                  <span>🥎</span>
                  <span>🏈</span>
                  <span>🏒</span>
                  <span>🥊</span>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {!user && (
                <>
                  <button
                    onClick={onLoginClick}
                    className="bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/25 text-[#22c55e] px-3 py-1.5 rounded text-sm font-semibold transition-colors"
                  >
                    CONNEXION
                  </button>
                  <button
                    onClick={() => onPageChange('joinvip')}
                    className="bg-[#161616] hover:bg-[#1e1e1e] border border-[#2a2a2a] text-textmain px-3 py-1.5 rounded text-sm font-bold transition-colors"
                  >
                    S'INSCRIRE
                  </button>
                </>
              )}

              <button
                onClick={() => onPageChange('home')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'home'
                    ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                    : 'text-[#666] hover:text-[#e8e8e8] hover:bg-[#161616]'
                }`}
              >
                ACCUEIL
              </button>

              <button
                onClick={() => onPageChange('vip')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'vip'
                    ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                    : 'text-[#666] hover:text-[#e8e8e8] hover:bg-[#161616]'
                }`}
              >
                VIP
              </button>

              <button
                onClick={() => onPageChange('news')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'news'
                    ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                    : 'text-[#666] hover:text-[#e8e8e8] hover:bg-[#161616]'
                }`}
              >
                PREMIUM
              </button>

              <button
                onClick={() => onPageChange('stats')}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  currentPage === 'stats'
                    ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                    : 'text-[#666] hover:text-[#e8e8e8] hover:bg-[#161616]'
                }`}
              >
                HISTORIQUE
              </button>

              {user && (
                <button
                  onClick={() => onPageChange('member')}
                  className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                    currentPage === 'member'
                      ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                      : 'text-[#666] hover:text-[#e8e8e8] hover:bg-[#161616]'
                  }`}
                >
                  MEMBRE
                </button>
              )}

              {profile?.is_admin && (
                <>
                  <button
                    onClick={() => onPageChange('admin')}
                    className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                      currentPage === 'admin'
                        ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                        : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
                    }`}
                  >
                    PRONOS
                  </button>
                  <button
                    onClick={() => onPageChange('admin-users')}
                    className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                      currentPage === 'admin-users'
                        ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                        : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
                    }`}
                  >
                    USERS
                  </button>
                  <button
                    onClick={() => onPageChange('admin-monetisation')}
                    className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                      currentPage === 'admin-monetisation'
                        ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                        : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
                    }`}
                  >
                    MONÉTIS
                  </button>
                  <button
                    onClick={() => onPageChange('admin-leagues')}
                    className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                      currentPage === 'admin-leagues'
                        ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                        : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
                    }`}
                  >
                    LIGUES
                  </button>
                </>
              )}

              {user && (
                <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-[#2a2a2a]">
                  {profile?.is_vip && (
                    <VipIcon className="text-[#22c55e]" size={18} />
                  )}
                  <button
                    onClick={signOut}
                    className="text-[#666] hover:text-[#e8e8e8] transition-colors p-1"
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

      <div className="md:hidden fixed top-14 left-0 right-0 bg-black border-b border-[#2a2a2a] z-30">
        <div className="flex gap-1 px-1.5 py-1.5 overflow-x-auto scrollbar-hide">
          {!user && (
            <>
              <button
                onClick={onLoginClick}
                className="flex-shrink-0 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/25 text-[#22c55e] px-2 py-1 rounded-md text-xs font-semibold transition-colors"
              >
                CONNEXION
              </button>
              <button
                onClick={() => onPageChange('joinvip')}
                className="flex-shrink-0 bg-[#161616] hover:bg-[#1e1e1e] border border-[#2a2a2a] text-textmain px-2 py-1 rounded-md text-xs font-bold transition-colors"
              >
                S'INSCRIRE
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange('home')}
            className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
              currentPage === 'home'
                ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
            }`}
          >
            ACCUEIL
          </button>

          <button
            onClick={() => onPageChange('vip')}
            className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
              currentPage === 'vip'
                ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
            }`}
          >
            VIP
          </button>

          <button
            onClick={() => onPageChange('news')}
            className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
              currentPage === 'news'
                ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
            }`}
          >
            PREMIUM
          </button>

          <button
            onClick={() => onPageChange('stats')}
            className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
              currentPage === 'stats'
                ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
            }`}
          >
            HISTORIQUE
          </button>

          {user && (
            <button
              onClick={() => onPageChange('member')}
              className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                currentPage === 'member'
                  ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                  : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
              }`}
            >
              MEMBRE
            </button>
          )}

          {profile?.is_admin && (
            <>
              <button
                onClick={() => onPageChange('admin')}
                className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-bold transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                    : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
                }`}
              >
                PRONOS
              </button>
              <button
                onClick={() => onPageChange('admin-users')}
                className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-bold transition-colors ${
                  currentPage === 'admin-users'
                    ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                    : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
                }`}
              >
                USERS
              </button>
              <button
                onClick={() => onPageChange('admin-monetisation')}
                className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-bold transition-colors ${
                  currentPage === 'admin-monetisation'
                    ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                    : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
                }`}
              >
                MONÉTIS
              </button>
              <button
                onClick={() => onPageChange('admin-leagues')}
                className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-bold transition-colors ${
                  currentPage === 'admin-leagues'
                    ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                    : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8]'
                }`}
              >
                LIGUES
              </button>
            </>
          )}

          {user && (
            <button
              onClick={signOut}
              className="flex-shrink-0 bg-[#161616] text-[#666] px-2 py-1 rounded-md text-xs font-semibold transition-colors hover:text-[#e8e8e8] flex items-center justify-center gap-1"
            >
              <LogOut size={14} />
              SORTIR
            </button>
          )}
        </div>
      </div>
    </>
  );
}
