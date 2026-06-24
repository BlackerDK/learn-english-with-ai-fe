import React, { useState, useEffect } from 'react';
import { Key, Globe, Save, CheckCircle, AlertCircle } from 'lucide-react';
import {
  DEFAULT_LEVEL_BY_LANG,
  getStudyLevel,
  getTargetLang,
  LANG_LABELS,
  LEVELS_BY_LANG,
  setStudyLevel,
} from '../utils/learningPath';
import type { TargetLang } from '../utils/learningPath';

function notifyPathChanged() {
  window.dispatchEvent(new Event('learn-path-changed'));
}

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');

  const [groqKey, setGroqKey] = useState('');
  const [hasGroqKey, setHasGroqKey] = useState(false);
  const [maskedGroqKey, setMaskedGroqKey] = useState('');

  const [language, setLanguage] = useState<TargetLang>(() => getTargetLang());
  const [studyLevel, setStudyLevelState] = useState(() => getStudyLevel());
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [groqLoading, setGroqLoading] = useState(false);

  useEffect(() => {
    fetchKeyStatus();
    fetchGroqKeyStatus();
  }, []);

  const fetchKeyStatus = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/settings/gemini-key');
      if (res.ok) {
        const data = await res.json();
        setHasKey(data.exists);
        setMaskedKey(data.maskedValue);
      }
    } catch (err) {
      console.error('Failed to fetch Gemini API status:', err);
    }
  };

  const fetchGroqKeyStatus = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/settings/groq-key');
      if (res.ok) {
        const data = await res.json();
        setHasGroqKey(data.exists);
        setMaskedGroqKey(data.maskedValue);
      }
    } catch (err) {
      console.error('Failed to fetch Groq API status:', err);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setStatus({ type: 'error', message: 'API Key không được để trống!' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/settings/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey.trim() }),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Lưu API Key thành công!' });
        setApiKey('');
        fetchKeyStatus();
      } else {
        const text = await res.text();
        setStatus({ type: 'error', message: `Lỗi: ${text}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Không thể kết nối đến máy chủ backend.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroqKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groqKey.trim()) {
      setStatus({ type: 'error', message: 'Groq API Key không được để trống!' });
      return;
    }

    setGroqLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/settings/groq-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: groqKey.trim() }),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Lưu Groq API Key thành công!' });
        setGroqKey('');
        fetchGroqKeyStatus();
      } else {
        const text = await res.text();
        setStatus({ type: 'error', message: `Lỗi: ${text}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Không thể kết nối đến máy chủ backend.' });
    } finally {
      setGroqLoading(false);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as TargetLang;
    setLanguage(val);
    localStorage.setItem('learn_target_lang', val);

    const levels = LEVELS_BY_LANG[val];
    const nextLevel = levels.includes(studyLevel) ? studyLevel : DEFAULT_LEVEL_BY_LANG[val];
    setStudyLevelState(nextLevel);
    setStudyLevel(nextLevel);
    notifyPathChanged();

    setStatus({
      type: 'success',
      message: `Đã đổi lộ trình sang: ${LANG_LABELS[val]} · ${nextLevel}`,
    });
    setTimeout(() => setStatus({ type: null, message: '' }), 3000);
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStudyLevelState(val);
    setStudyLevel(val);
    notifyPathChanged();

    setStatus({
      type: 'success',
      message: `Đã cập nhật cấp độ lộ trình: ${LANG_LABELS[language]} · ${val}`,
    });
    setTimeout(() => setStatus({ type: null, message: '' }), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Cài đặt hệ thống
        </h1>
        <p className="text-gray-400 mt-1">Cấu hình API Key của Google Gemini và tùy chọn học tập của bạn.</p>
      </div>

      {status.type && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          status.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {status.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-medium">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gemini API Box */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Google Gemini API</h2>
              <p className="text-xs text-gray-400">Yêu cầu cho AI Tutor, Quiz, và đánh giá phát âm.</p>
            </div>
          </div>

          <div className="text-sm">
            {hasKey ? (
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Trạng thái</span>
                  <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Đã cấu hình
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">API Key</span>
                  <code className="text-xs text-gray-300 font-mono">{maskedKey}</code>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs">
                Chưa cấu hình API Key. Các tính năng AI sẽ bị hạn chế. Vui lòng lấy khóa miễn phí tại{' '}
                <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="underline hover:text-amber-300">
                  ai.google.dev
                </a>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveKey} className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-gray-300 block mb-1 font-medium">Nhập API Key mới</label>
              <input
                type="password"
                placeholder="Nhập Google Gemini API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-indigo-500/15"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Đang lưu...' : 'Cập nhật API Key'}
            </button>
          </form>
        </div>

        {/* Groq API Box (AI Dự phòng) */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Groq API (AI Dự phòng)</h2>
              <p className="text-xs text-gray-400">Dự phòng tự động khi Google Gemini hết dung lượng/quota.</p>
            </div>
          </div>

          <div className="text-sm">
            {hasGroqKey ? (
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Trạng thái</span>
                  <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Đã cấu hình
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">API Key</span>
                  <code className="text-xs text-gray-300 font-mono">{maskedGroqKey}</code>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs">
                Chưa cấu hình API Key Groq dự phòng. Khi Gemini lỗi, hệ thống sẽ báo lỗi thay vì fallback. Lấy khóa tại{' '}
                <a href="https://console.groq.com/" target="_blank" rel="noreferrer" className="underline hover:text-amber-300">
                  console.groq.com
                </a>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveGroqKey} className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-gray-300 block mb-1 font-medium">Nhập API Key Groq mới</label>
              <input
                type="password"
                placeholder="Nhập Groq API Key..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors placeholder:text-gray-600"
              />
            </div>
            <button
              type="submit"
              disabled={groqLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-teal-500/15"
            >
              <Save className="h-4 w-4" />
              {groqLoading ? 'Đang lưu...' : 'Cập nhật API Key Groq'}
            </button>
          </form>
        </div>

        {/* Learning Preferences Box */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Lộ trình học tập</h2>
              <p className="text-xs text-gray-400">Chọn ngôn ngữ và cấp độ — Dashboard sẽ hiển thị đúng tiến trình.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-gray-300 block mb-1 font-medium">Ngôn ngữ đích (Target Language)</label>
              <select
                value={language}
                onChange={handleLanguageChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="en" className="bg-bg-dark text-white">Tiếng Anh (English)</option>
                <option value="ja" className="bg-bg-dark text-white">Tiếng Nhật (Japanese)</option>
                <option value="zh" className="bg-bg-dark text-white">Tiếng Trung (Chinese)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1 font-medium">Cấp độ lộ trình</label>
              <select
                value={studyLevel}
                onChange={handleLevelChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {LEVELS_BY_LANG[language].map((level) => (
                  <option key={level} value={level} className="bg-bg-dark text-white">
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-white block mb-1">Lộ trình hiện tại:</span>
              {LANG_LABELS[language]} · {studyLevel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
