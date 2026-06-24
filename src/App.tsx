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
import ApiErrorPopup from './components/ApiErrorPopup';
import { useApiError } from './hooks/useApiError';

// Global API error context so any page can trigger the popup
export let globalShowApiError: ((err: import('./hooks/useApiError').ApiError) => void) | null = null;

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
      <div className="min-h-screen bg-bg-dark text-gray-100 flex items-center justify-center">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex text-gray-100">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass border-r border-white/5 transition-transform duration-300 md:translate-x-0 flex flex-col justify-between ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          {/* Logo brand */}
          <div className="flex items-center gap-2 px-6 pb-6 border-b border-white/5">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl text-white">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">ANTIGRAVITY LANG</span>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mt-0.5">AI Language Studio</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.hash === currentHash;
              return (
                <a
                  key={item.name}
                  href={item.hash}
                  className={`group flex items-center px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`mr-3 h-4.5 w-4.5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Footer profile */}
        <div className="p-4 border-t border-white/5 bg-white/2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white select-none">
              {(user?.displayName || user?.username || 'US').slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="font-bold text-xs text-white block truncate max-w-[120px]" title={user?.displayName}>
                {user?.displayName || 'Người dùng'}
              </span>
              <span className="text-[9px] text-gray-500 block truncate max-w-[120px]">
                @{user?.username || 'user'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-30 md:hidden flex items-center justify-between px-6 py-4 glass border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xs tracking-tight text-white">ANTIGRAVITY LANG</span>
          </div>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Content Workspace */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {activePage.component}
        </main>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Global API Error Popup */}
      <ApiErrorPopup
        error={apiError}
        onClose={clearError}
        onGoToSettings={() => { window.location.hash = '#settings'; }}
      />
    </div>
  );
}
