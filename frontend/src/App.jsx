import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/assess" element={<Navigate to="/assessment" replace />} />
              <Route path="/results/:assessmentId" element={<ResultsPage />} />
              {/* Redirect old auth routes to assessment */}
              <Route path="/login" element={<Navigate to="/assessment" replace />} />
              <Route path="/register" element={<Navigate to="/assessment" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
