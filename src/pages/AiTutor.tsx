import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageSquare, Bot, User, Trash2, ArrowDownCircle } from 'lucide-react';
import { handleApiError } from '../utils/apiError';

interface ChatMessage {
  id: string;
  sender: 'User' | 'AI';
  text: string;
  timestamp: string;
}

export default function AiTutor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    // Load chat history from localStorage
    const saved = localStorage.getItem('learn_chat_history');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      // Seed default greeting
      const defaultMsg: ChatMessage = {
        id: '1',
        sender: 'AI',
        text: 'Xin chào! Tôi là Trợ lý Giáo viên AI của bạn. Bạn có câu hỏi nào về từ vựng, ngữ pháp hay cần luyện hội thoại không? Tôi luôn sẵn sàng hỗ trợ bằng cả Tiếng Việt và ngôn ngữ bạn đang học.',
        timestamp: new Date().toISOString(),
      };
      setMessages([defaultMsg]);
      localStorage.setItem('learn_chat_history', JSON.stringify([defaultMsg]));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Guid(),
      sender: 'User',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem('learn_chat_history', JSON.stringify(updatedMessages));
    setInput('');
    setLoading(true);

    try {
      // Gather last 8 messages for context in the API
      const recentHistory = updatedMessages
        .slice(-8)
        .map((m) => `${m.sender}: ${m.text}`)
        .join('\n');

      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: `Lịch sử hội thoại gần đây:\n${recentHistory}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: Guid(),
          sender: 'AI',
          text: data.response,
          timestamp: new Date().toISOString(),
        };
        const newHistory = [...updatedMessages, aiMsg];
        setMessages(newHistory);
        localStorage.setItem('learn_chat_history', JSON.stringify(newHistory));
      } else {
        await handleApiError(res);
        showErrorMsg('Không thể kết nối AI. Vui lòng kiểm tra API Key trong Cài đặt.');
      }
    } catch (err) {
      showErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const showErrorMsg = (err: string) => {
    const errorMsg: ChatMessage = {
      id: Guid(),
      sender: 'AI',
      text: `⚠️ Đã xảy ra lỗi: ${err}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, errorMsg]);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('learn_chat_history');
    const resetMsg: ChatMessage = {
      id: '1',
      sender: 'AI',
      text: 'Đã xóa lịch sử chat. Tôi có thể giúp gì thêm cho bạn?',
      timestamp: new Date().toISOString(),
    };
    setMessages([resetMsg]);
    localStorage.setItem('learn_chat_history', JSON.stringify([resetMsg]));
  };

  const suggestionChips = [
    { label: 'Giải thích ngữ pháp câu này...', prompt: 'Giải thích chi tiết cấu trúc ngữ pháp và cách dùng của câu: ' },
    { label: 'Lấy thêm 3 ví dụ của từ...', prompt: 'Lấy 3 câu ví dụ thực tế có giải nghĩa của từ vựng này: ' },
    { label: 'Hội thoại chủ đề Phỏng vấn', prompt: 'Hãy đóng vai là người phỏng vấn xin việc và bắt đầu hội thoại bằng tiếng Anh với tôi.' },
    { label: 'Dịch và phân tích lỗi sai', prompt: 'Dịch câu sau và chỉ ra các lỗi ngữ pháp (nếu có): ' },
  ];

  function Guid() {
    return Math.random().toString(36).substring(2, 9);
  }

  return (
    <div className="glass-card rounded-3xl overflow-hidden border border-gray-200 flex flex-col h-[75vh] animate-fade-in">
      {/* Header chat console */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white/2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bot className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              AI Tutor Language Assistant
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            </h2>
            <p className="text-[10px] text-gray-600">Gemini 1.5 Flash • Hoạt động 24/7</p>
          </div>
        </div>

        <button
          onClick={() => setIsConfirmOpen(true)}
          className="p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-rose-400 transition-colors border border-gray-200 cursor-pointer"
          title="Xóa lịch sử trò chuyện"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="p-4 bg-white/1 border-b border-gray-200 flex flex-wrap gap-2 justify-center">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (chip.prompt.endsWith(': ') || chip.prompt.endsWith(' từ: ')) {
                  setInput(`${chip.prompt}"[Nhập từ hoặc câu của bạn tại đây]"`);
                } else {
                  handleSend(chip.prompt);
                }
              }}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-indigo-500/10 text-gray-300 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/25 text-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Message Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-black/10">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 max-w-[85%] ${m.sender === 'User' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`p-2 h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
              m.sender === 'User' 
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              {m.sender === 'User' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            
            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
              m.sender === 'User'
                ? 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 text-gray-100 border border-indigo-500/15 rounded-tr-none'
                : 'bg-white/3 text-gray-800 border border-gray-200 rounded-tl-none whitespace-pre-wrap'
            }`}>
              {m.text}
              <span className="block text-[9px] text-gray-500 mt-2 text-right">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="p-2 h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-4 rounded-2xl bg-white/3 border border-gray-200 rounded-tl-none flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"></span>
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input console */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 border-t border-gray-200 bg-white/1 flex gap-3 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi AI Tutor của bạn về bất cứ điều gì (ví dụ: 'Nghĩa của từ eloquence là gì?')..."
          className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-500/15 cursor-pointer"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>

      {/* Custom Clear History Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4 animate-zoom-in text-center bg-slate-900">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 font-sans">Xóa lịch sử trò chuyện?</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với AI Tutor không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-xl text-sm transition-colors border border-gray-200 cursor-pointer font-sans"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClearHistory();
                  setIsConfirmOpen(false);
                }}
                className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-rose-500/10 font-sans"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
