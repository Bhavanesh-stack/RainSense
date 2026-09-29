import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Droplets, Menu, X, LogOut, LayoutDashboard, 
  FileText, Home, Info, Zap, User 
} from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-rain-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-gray-900">
              Rain<span className="text-primary-600">Sense</span> AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" icon={<Home className="w-4 h-4" />}>Home</NavLink>
            <a href="/#how-it-works" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all">
              How It Works
            </a>
            <a href="/#features" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all">
              Features
            </a>

            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavLink>
                <NavLink to="/assessment" icon={<FileText className="w-4 h-4" />}>New Assessment</NavLink>
                <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-2">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {user?.name}
                  </span>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                  Login
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 !text-sm !rounded-lg">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <MobileLink to="/" onClick={() => setMobileOpen(false)}>Home</MobileLink>
            <MobileLink to="/#how-it-works" onClick={() => setMobileOpen(false)}>How It Works</MobileLink>
            <MobileLink to="/#features" onClick={() => setMobileOpen(false)}>Features</MobileLink>
            {isAuthenticated ? (
              <>
                <MobileLink to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileLink>
                <MobileLink to="/assessment" onClick={() => setMobileOpen(false)}>New Assessment</MobileLink>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full text-left px-4 py-3 text-red-600 font-medium rounded-lg hover:bg-red-50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login" onClick={() => setMobileOpen(false)}>Login</MobileLink>
                <MobileLink to="/register" onClick={() => setMobileOpen(false)}>Get Started</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, icon, children }) {
  return (
    <Link to={to} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all">
      {icon}
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} className="block px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
      {children}
    </Link>
  );
}
