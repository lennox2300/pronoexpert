import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './pages/HomePage';
import { VIPPredictionsPage } from './pages/VIPPredictionsPage';
import { NewsPage } from './pages/NewsPage';
import { StatsPage } from './pages/StatsPage';
import { AdminPage } from './pages/AdminPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { JoinVIPPage } from './pages/JoinVIPPage';
import { LegalPage } from './pages/LegalPage';
import MemberPage from './pages/MemberPage';
import { AdminMonetisationPage } from './pages/AdminMonetisationPage';
import { AdminLeaguesPage } from './pages/AdminLeaguesPage';
import { AbonnementPage } from './pages/AbonnementPage';
import { useNotifications } from './hooks/useNotifications';
import { ShieldX } from 'lucide-react';

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <ShieldX size={48} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Accès non autorisé</h1>
      <p className="text-gray-400">Vous n'avez pas les droits pour accéder à cette page.</p>
    </div>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newsCategory, setNewsCategory] = useState<'all' | 'prediction' | 'infos'>('all');
  const { user, loading, profile } = useAuth();
  const [prevUser, setPrevUser] = useState(user);

  useNotifications();

  useEffect(() => {
    if (!prevUser && user) {
      setCurrentPage('home');
      window.history.pushState({}, '', '/');
    }
    setPrevUser(user);
  }, [user, prevUser]);

  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      const page = path === '/' ? 'home' : path.substring(1);
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat === 'prediction' || cat === 'infos') {
        setNewsCategory(cat);
      } else {
        setNewsCategory('all');
      }
      setCurrentPage(page);
      window.scrollTo(0, 0);
    };

    handleNavigation();
    window.addEventListener('popstate', handleNavigation);

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href^="/"]');
      if (target) {
        const href = (target as HTMLAnchorElement).getAttribute('href');
        if (href) {
          e.preventDefault();
          window.history.pushState({}, '', href);
          const page = href === '/' ? 'home' : href.substring(1);
          setCurrentPage(page);
          window.scrollTo(0, 0);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLoginClick={() => setShowLoginModal(true)}
      />

      <div className={`${profile?.is_admin ? 'pt-52' : 'pt-36'} md:pt-14`}>
        {currentPage === 'home' && <HomePage onPageChange={setCurrentPage} />}
        {currentPage === 'member' && <MemberPage />}
        {currentPage === 'vip' && <VIPPredictionsPage onPageChange={setCurrentPage} />}
        {currentPage === 'news' && <NewsPage onPageChange={setCurrentPage} categoryFilter={newsCategory} />}
        {currentPage === 'stats' && <StatsPage />}
        {currentPage === 'admin' && (profile?.is_admin ? <AdminPage /> : <AccessDenied />)}
        {currentPage === 'admin-users' && (profile?.is_admin ? <AdminUsersPage /> : <AccessDenied />)}
        {currentPage === 'admin-monetisation' && (profile?.is_admin ? <AdminMonetisationPage /> : <AccessDenied />)}
      {currentPage === 'admin-leagues' && (profile?.is_admin ? <AdminLeaguesPage /> : <AccessDenied />)}
        {currentPage === 'joinvip' && <JoinVIPPage onPageChange={setCurrentPage} />}
        {currentPage === 'abonnement' && <AbonnementPage onPageChange={setCurrentPage} />}
        {currentPage === 'faq' && <LegalPage slug="faq" />}
        {currentPage === 'privacy' && <LegalPage slug="privacy" />}
        {currentPage === 'terms' && <LegalPage slug="terms" />}
        {currentPage === 'about' && <LegalPage slug="about" />}
        {currentPage === 'contact' && <LegalPage slug="contact" />}
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
