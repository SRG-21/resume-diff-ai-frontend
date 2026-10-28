import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { VerifyBanner } from './components/VerifyBanner';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { ComparePage } from './components/ComparePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuth } from './context/useAuth';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './pages/RecoveryPages';
import { HistoryPage, HistoryDetailPage } from './pages/HistoryPages';
import { ResumesPage } from './pages/ResumesPage';
import { TrackerPage } from './pages/TrackerPage';
import { BillingPage } from './pages/BillingPage';
import { BulkPage } from './pages/BulkPage';

const protectedPage = (element: React.ReactElement) => <ProtectedRoute>{element}</ProtectedRoute>;

// Pages that render full-screen without the site footer
const NO_FOOTER = ['/login', '/signup', '/forgot-password', '/reset-password'];

function App() {
  const { isLoading } = useAuth();
  const { pathname } = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <VerifyBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Signed-in app */}
          <Route path="/app" element={protectedPage(<ComparePage />)} />
          <Route path="/history" element={protectedPage(<HistoryPage />)} />
          <Route path="/history/:id" element={protectedPage(<HistoryDetailPage />)} />
          <Route path="/resumes" element={protectedPage(<ResumesPage />)} />
          <Route path="/tracker" element={protectedPage(<TrackerPage />)} />
          <Route path="/bulk" element={protectedPage(<BulkPage />)} />
          <Route path="/billing" element={protectedPage(<BillingPage />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!NO_FOOTER.includes(pathname) && <Footer />}
    </div>
  );
}

export default App;
