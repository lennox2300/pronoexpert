import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './pages/HomePage';
import { VIPPredictionsPage } from './pages/VIPPredictionsPage';
import { NewsPage } from './pages/NewsPage';
import { StatsPage } from './pages/StatsPage';
import { AdminPage } from './pages/AdminPage';
import { JoinVIPPage } from './pages/JoinVIPPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { loading } = useAuth();

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

      <div className="pt-14">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'vip' && <VIPPredictionsPage />}
        {currentPage === 'news' && <NewsPage />}
        {currentPage === 'stats' && <StatsPage />}
        {currentPage === 'admin' && <AdminPage />}
        {currentPage === 'joinvip' && <JoinVIPPage />}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
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
