import React, { useState, useEffect } from 'react';
import { 
  BookOpen, LayoutDashboard, Calendar, FileText, 
  Volume2, Mic, HelpCircle, MessageSquare, Settings as SettingsIcon, 
  Menu, X, Sparkles, LogOut, Edit3
} from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Vocabulary from './pages/Vocabulary';
import Flashcards from './pages/Flashcards';
import GrammarNotes from './pages/GrammarNotes';
import Listening from './pages/Listening';
import SpeakingPractice from './pages/SpeakingPractice';
import Writing from './pages/Writing';
import Quiz from './pages/Quiz';
import AiTutor from './pages/AiTutor';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Landing from './pages/Landing';
import ApiErrorPopup from './components/ApiErrorPopup';
import { useApiError } from './hooks/useApiError';

// Global API error context so any page can trigger the popup
export let globalShowApiError: ((err: import('./hooks/useApiError').ApiError) => void) | null = null;

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { apiError, showError, clearError } = useApiError();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<{ displayName: string; username: string; role: string } | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Listen to global unauthorized event to reset auth state
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Register global handler so any page can call globalShowApiError(err)
  useEffect(() => {
    globalShowApiError = showError;
    return () => { globalShowApiError = null; };
  }, [showError]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#dashboard');
      setIsMobileOpen(false); // Close sidebar on navigate
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navItems = [
    { name: 'Dashboard', hash: '#dashboard', icon: LayoutDashboard, component: <Dashboard /> },
    { name: 'Sổ tay Từ vựng', hash: '#vocabulary', icon: BookOpen, component: <Vocabulary /> },
    { name: 'Thẻ Flashcard (SRS)', hash: '#flashcards', icon: Calendar, component: <Flashcards /> },
    { name: 'Ghi chú Ngữ pháp', hash: '#grammar-notes', icon: FileText, component: <GrammarNotes /> },
    { name: 'Luyện nghe', hash: '#listening', icon: Volume2, component: <Listening /> },
    { name: 'Luyện nói AI', hash: '#speaking-practice', icon: Mic, component: <SpeakingPractice /> },
    { name: 'Luyện viết AI', hash: '#writing', icon: Edit3, component: <Writing /> },
    { name: 'AI Quiz Generator', hash: '#quiz', icon: HelpCircle, component: <Quiz /> },
    { name: 'AI Tutor Chat', hash: '#ai-tutor', icon: MessageSquare, component: <AiTutor /> },
    { name: 'Cài đặt', hash: '#settings', icon: SettingsIcon, component: <Settings /> },
  ];

  const activePage = navItems.find(item => item.hash === currentHash) || navItems[0];

  if (!token) {
    return (
      <>
        <Landing onGoToLogin={() => setShowLoginModal(true)} />
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md animate-zoom-in">
               <button 
                 onClick={() => setShowLoginModal(false)}
                 className="absolute -top-4 -right-4 bg-white text-gray-500 hover:text-rose-500 rounded-full p-2 shadow-lg z-10"
               >
                 <X className="h-5 w-5" />
               </button>
               <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                 <Login onLoginSuccess={handleLoginSuccess} />
               </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-gray-900 overflow-hidden relative">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b-2 border-gray-200 px-4 py-3 md:px-8 flex items-center justify-between">
        {/* Logo brand */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-[20px] text-white shadow-md flex items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform cursor-pointer">
            <span className="font-extrabold text-3xl font-serif leading-none mt-1">G</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-[22px] tracking-tight text-[#1e1b4b] block leading-none">Games</span>
            <span className="text-[12px] text-gray-600 font-bold tracking-tight block mt-0.5">to learn English</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = item.hash === currentHash;
            return (
              <a
                key={item.name}
                href={item.hash}
                className={`px-3 py-2 text-[15px] font-bold rounded-2xl transition-all duration-300 hover:scale-105 ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50 shadow-sm border border-indigo-100'
                    : 'text-gray-600 hover:text-indigo-500 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-white border-2 border-gray-200 flex items-center justify-center font-extrabold text-sm text-[#1e1b4b] shadow-sm transform rotate-3">
              {(user?.displayName || user?.username || 'US').slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-2xl text-gray-500 hover:text-rose-500 hover:bg-white/50 transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 shadow-sm hover:scale-105 transition-transform"
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {isMobileOpen && (
        <div className="lg:hidden absolute top-[72px] left-0 w-full z-30 bg-white border-b-2 border-gray-200 shadow-lg px-4 py-4 max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.hash === currentHash;
              return (
                <a
                  key={item.name}
                  href={item.hash}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </a>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-yellow-200/50 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-gray-700">
               Hi, {user?.displayName || user?.username || 'User'}
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-rose-100 text-rose-500 font-bold rounded-xl flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Thoát
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-10 relative">
        <div className="main-board p-6 md:p-8 lg:p-10 mx-auto max-w-7xl relative">
          {activePage.component}
        </div>
      </main>

      {/* Global API Error Popup */}
      <ApiErrorPopup
        error={apiError}
        onClose={clearError}
        onGoToSettings={() => { window.location.hash = '#settings'; }}
      />
    </div>
  );
}
