import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import ProfileModal from './ProfileModal';

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

interface HeaderProps {
  onToggleSidebar?: () => void;
  isChatActive?: boolean;
  onNavigateHome?: () => void;
  onNavigateChat?: () => void;
  showBackground?: boolean;
  onEditPersonalization?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isChatActive, onNavigateHome, onNavigateChat, showBackground, onEditPersonalization }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      {onNavigateChat && onNavigateHome ? (
        // Dynamic link for TraivoAI page
        isChatActive ? (
          <button onClick={() => { onNavigateHome?.(); setIsMobileMenuOpen(false); }} className="text-sm font-medium hover:text-teal-500 transition-colors text-left w-full md:w-auto p-2 md:p-0">Home</button>
        ) : (
          <button onClick={() => { onNavigateChat?.(); setIsMobileMenuOpen(false); }} className="text-sm font-medium hover:text-teal-500 transition-colors text-left w-full md:w-auto p-2 md:p-0">Chat</button>
        )
      ) : (
        // Fallback for other pages
        <Link to="/user/wanderchat" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">Home</Link>
      )}
      <Link to="/user/best-deals" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">Best Deals</Link>
      <Link to="/user/my-trips" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">My Trips</Link>
      <Link to="/user/my-blogs" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">Blogs</Link>
      <Link to="/user/subscription" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">Subscription</Link>
      <Link to="/user/about" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">About Us</Link>
      <Link to="/user/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">Contact</Link>
      {user && (
        <>
          <Link to="/user/saved-deals" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">Saved Deals</Link>
          <Link to="/user/messages" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">Inquiries</Link>
        </>
      )}
      <Link to="/agent-portal" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-teal-500 transition-colors block md:inline p-2 md:p-0">Agent Portal</Link>
    </>
  );

  return (
    <header
      className={`sticky top-0 z-40 flex justify-between items-center p-4 md:p-6 transition-all duration-500 ${showBackground
        ? 'backdrop-blur-md shadow-sm border-b border-gray-100/50 text-gray-800'
        : 'bg-transparent text-white'
        }`}
      style={{
        backgroundColor: showBackground ? 'rgb(255 255 255 / 0.9)' : 'transparent'
      }}
    >
      <div className="flex items-center space-x-3">
        <Link to="/user/wanderchat" className="flex items-center gap-2">
          <MapPinIcon />
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-teal-500 text-2xl md:text-3xl font-bold tracking-wider">Traivo</span>
            <span className="text-2xl md:text-3xl font-bold tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
          </span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6">
        <NavLinks />

        {/* User Auth: Sign In/Up if Guest, Dropdown if User */}
        {user ? (
          /* User Dropdown (Desktop) */
          <div className="relative ml-2 group">
            <button className="p-2 rounded-full hover:bg-gray-100/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.4l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.4l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600"
              >
                My Profile
              </button>

              <Link to="/user/policy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600">Privacy & Terms</Link>
              <div className="h-px bg-gray-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          /* Guest: Sign In / Sign Up Buttons */
          <div className="flex items-center gap-3 ml-4">
            <Link to="/login" className={`font-medium text-sm transition-colors ${showBackground ? 'text-gray-600 hover:text-teal-600' : 'text-white/90 hover:text-white'}`}>
              Log In
            </Link>
            <Link to="/signup" className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg shadow-teal-500/30 transition-all transform hover:scale-105">
              Sign Up
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile Menu Toggle & History Icon */}
      <div className="md:hidden flex items-center gap-1">
        {onToggleSidebar && user && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100/20 rounded-lg transition-colors"
            title="View Chat History"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl p-4 md:hidden flex flex-col space-y-2 animate-in slide-in-from-top-2 text-gray-800">
          <NavLinks />
          <div className="h-px bg-gray-100 my-2"></div>

          <button onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }} className="block text-left px-2 py-2 text-sm font-medium hover:text-teal-600">My Profile</button>

          <Link to="/user/policy" onClick={() => setIsMobileMenuOpen(false)} className="block px-2 py-2 text-sm font-medium hover:text-teal-600">Privacy & Terms</Link>

          <div className="h-px bg-gray-100 my-2"></div>

          {user ? (
            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="block w-full text-left px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Log Out
            </button>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-2 text-sm font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                Log In
              </Link>
              <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-md">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onEditPersonalization={onEditPersonalization}
      />
    </header>
  );
}
export default Header;