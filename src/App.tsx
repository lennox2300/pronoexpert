import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './pages/HomePage';
import { VIPPredictionsPage } from './pages/VIPPredictionsPage';
import { NewsPage } from './pages/NewsPage';
import { StatsPage } from './pages/StatsPage';
import { AdminPage } from './pages/AdminPage';
import { JoinVIPPage } from './pages/JoinVIPPage';
import { LegalPage } from './pages/LegalPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      const page = path === '/' ? 'home' : path.substring(1);
      setCurrentPage(page);
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

      <div className="pt-28 md:pt-14">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'vip' && <VIPPredictionsPage />}
        {currentPage === 'news' && <NewsPage />}
        {currentPage === 'stats' && <StatsPage />}
        {currentPage === 'admin' && <AdminPage />}
        {currentPage === 'joinvip' && <JoinVIPPage />}
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
