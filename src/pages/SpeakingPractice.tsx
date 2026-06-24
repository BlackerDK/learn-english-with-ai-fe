import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, Sparkles, AlertCircle, Award, CheckCircle,
  RefreshCw, Plus, Edit, Trash2, X, Save, Search, Filter, History,
  Upload, Calendar, ChevronLeft, ChevronRight, BookOpen, Shuffle,
} from 'lucide-react';
import { logErrorToBackend } from '../utils/logger';
import { handleApiError } from '../utils/apiError';

interface SpeakingPhrase {
  id: string;
  text: string;
  translation: string;
  level: string;
  language: string;
  createdAt: string;
}

interface WordAnalysis {
  word: string;
  status: 'correct' | 'mispronounced' | 'missing';
}

interface EvaluationResult {
  score: number;
  accuracy: 'excellent' | 'good' | 'needs-improvement';
  feedback: string;
  wordAnalysis: WordAnalysis[];
}

interface SpeakingHistory {
  id: string;
  phraseId?: string;
  phraseText: string;
  spokenText: string;
  score: number;
  accuracy: string;
  feedback: string;
  wordAnalysisJson: string;
  language: string;
  practicedAt: string;
}

interface PagedHistory {
  items: SpeakingHistory[];
  totalItems: number;
  totalPages: number;
  page: number;
}

const LEVELS = ['Basic', 'Intermediate', 'Advanced', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS', 'N5', 'N4', 'N3', 'N2', 'N1', 'HSK1', 'HSK2', 'HSK3'];

export default function SpeakingPractice() {
  const targetLang = localStorage.getItem('learn_target_lang') || 'en';

  // Tab state: 'practice' | 'manage' | 'history'
  const [activeTab, setActiveTab] = useState<'practice' | 'manage' | 'history'>('practice');

  // Phrases state
  const [phrases, setPhrases] = useState<SpeakingPhrase[]>([]);
  const [dailyPhrases, setDailyPhrases] = useState<SpeakingPhrase[]>([]);
  const [selectedPhrase, setSelectedPhrase] = useState<SpeakingPhrase | null>(null);
  const [loadingPhrases, setLoadingPhrases] = useState(true);

  // Manage tab state
  const [manageSearch, setManageSearch] = useState('');
  const [manageLevel, setManageLevel] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<SpeakingPhrase | null>(null);
  const [form, setForm] = useState({ text: '', translation: '', level: 'Intermediate', language: targetLang });
  const [formError, setFormError] = useState('');

  // Import modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importLevel, setImportLevel] = useState('Intermediate');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [practiceError, setPracticeError] = useState('');

  // History tab state
  const [history, setHistory] = useState<SpeakingHistory[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const langLabel: Record<string, string> = { en: 'English', ja: 'Tiếng Nhật', zh: 'Tiếng Trung' };

  // ── Fetch helpers ────────────────────────────────────────────────
  const fetchPhrases = useCallback(async () => {
    setLoadingPhrases(true);
    try {
      let url = `/api/speaking/phrases?language=${targetLang}`;
      if (manageSearch) url += `&search=${encodeURIComponent(manageSearch)}`;
      if (manageLevel) url += `&level=${encodeURIComponent(manageLevel)}`;
      const res = await fetch(url);
      if (res.ok) setPhrases(await res.json());
    } catch (err) { logErrorToBackend(err, 'SpeakingPractice.fetchPhrases'); }
    finally { setLoadingPhrases(false); }
  }, [targetLang, manageSearch, manageLevel]);

  const fetchDailyPhrases = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/speaking/phrases/daily?language=${targetLang}&date=${today}`);
      if (res.ok) {
        const data: SpeakingPhrase[] = await res.json();
        setDailyPhrases(data);
        if (data.length > 0 && !selectedPhrase) setSelectedPhrase(data[0]);
      }
    } catch (err) { logErrorToBackend(err, 'SpeakingPractice.fetchDailyPhrases'); }
  }, [targetLang]);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/speaking/history?language=${targetLang}&page=${page}&pageSize=10`);
      if (res.ok) {
        const data: PagedHistory = await res.json();
        setHistory(data.items);
        setHistoryTotalPages(data.totalPages);
        setHistoryTotal(data.totalItems);
        setHistoryPage(data.page);
      }
    } catch (err) { logErrorToBackend(err, 'SpeakingPractice.fetchHistory'); }
    finally { setLoadingHistory(false); }
  }, [targetLang]);

  useEffect(() => { fetchDailyPhrases(); }, [fetchDailyPhrases]);
  useEffect(() => { if (activeTab === 'manage') fetchPhrases(); }, [activeTab, fetchPhrases]);
  useEffect(() => { if (activeTab === 'history') fetchHistory(historyPage); }, [activeTab, historyPage, fetchHistory]);

  // ── Speech Recognition ────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = targetLang === 'ja' ? 'ja-JP' : targetLang === 'zh' ? 'zh-CN' : 'en-US';
    rec.onstart = () => { setIsRecording(true); setTranscribedText(''); setPracticeError(''); setEvaluation(null); };
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setTranscribedText(t);
      if (selectedPhrase) evaluateSpeech(selectedPhrase.text, t, selectedPhrase.id);
    };
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') setPracticeError('Không nghe thấy giọng nói. Hãy thử lại.');
      else if (e.error === 'not-allowed') setPracticeError('Trình duyệt chưa được cấp quyền Micro.');
      else setPracticeError(`Lỗi ghi âm: ${e.error}`);
      setIsRecording(false);
    };
    rec.onend = () => setIsRecording(false);
    setRecognition(rec);
  }, [targetLang, selectedPhrase]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleToggleRecord = () => {
    if (!recognition) { alert('Trình duyệt không hỗ trợ Web Speech API. Dùng Chrome hoặc Edge.'); return; }
    if (isRecording) recognition.stop(); else recognition.start();
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = targetLang === 'ja' ? 'ja-JP' : targetLang === 'zh' ? 'zh-CN' : 'en-US';
    window.speechSynthesis.speak(u);
  };

  const evaluateSpeech = async (target: string, spoken: string, phraseId?: string) => {
    setEvaluating(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/ai/evaluate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, spoken }),
      });
      if (res.ok) {
        const data: EvaluationResult = await res.json();
        setEvaluation(data);
        // Auto-save to history
        await fetch((import.meta.env.VITE_API_URL || '') + '/api/speaking/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phraseId: phraseId || null,
            phraseText: target,
            spokenText: spoken,
            score: data.score,
            accuracy: data.accuracy,
            feedback: data.feedback,
            wordAnalysisJson: JSON.stringify(data.wordAnalysis),
            language: targetLang,
          }),
        });
      } else {
        await handleApiError(res);
        setPracticeError('Không thể chấm điểm phát âm. Vui lòng thử lại.');
      }
    } catch (err) {
      logErrorToBackend(err, 'SpeakingPractice.evaluateSpeech');
      setPracticeError('Không thể kết nối đến máy chủ chấm điểm.');
    } finally { setEvaluating(false); }
  };

  // CRUD phrase handlers
  const openAddModal = () => {
    setEditingPhrase(null);
    setForm({ text: '', translation: '', level: 'Intermediate', language: targetLang });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: SpeakingPhrase) => {
    setEditingPhrase(p);
    setForm({ text: p.text, translation: p.translation, level: p.level, language: p.language });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSavePhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) { setFormError('Vui lòng nhập câu luyện tập.'); return; }
    try {
      const url = editingPhrase ? `/api/speaking/phrases/${editingPhrase.id}` : '/api/speaking/phrases';
      const method = editingPhrase ? 'PUT' : 'POST';
      const body = editingPhrase ? { id: editingPhrase.id, ...form } : form;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setIsModalOpen(false); fetchPhrases(); fetchDailyPhrases(); }
      else setFormError(`Lỗi: ${await res.text()}`);
    } catch (err) { logErrorToBackend(err, 'SpeakingPractice.handleSavePhrase'); setFormError('Lỗi kết nối.'); }
  };

  const handleDeletePhrase = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/speaking/phrases/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchPhrases();
      fetchDailyPhrases();
    } catch (err) { logErrorToBackend(err, 'SpeakingPractice.handleDeletePhrase'); }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/speaking/history/${id}`, { method: 'DELETE' });
      fetchHistory(historyPage);
    } catch (err) { logErrorToBackend(err, 'SpeakingPractice.handleDeleteHistory'); }
  };

  // Import bulk handler
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) { setImportError('Vui lòng nhập dữ liệu.'); return; }
    setImporting(true); setImportError('');
    try {
      const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
      const bulk = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return { text: parts[0] || '', translation: parts[1] || '', level: importLevel, language: targetLang };
      }).filter(p => p.text);

      if (!bulk.length) { setImportError('Không tìm thấy câu hợp lệ. Mỗi dòng: Câu | Dịch nghĩa'); setImporting(false); return; }

      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/speaking/phrases/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bulk),
      });
      if (res.ok) {
        const data = await res.json();
        setIsImportOpen(false); setImportText('');
        fetchPhrases(); fetchDailyPhrases();
        alert(`✅ Import thành công ${data.length} câu luyện tập!`);
      } else setImportError(`Lỗi: ${await res.text()}`);
    } catch (err) { logErrorToBackend(err, 'SpeakingPractice.handleImport'); setImportError('Lỗi kết nối.'); }
    finally { setImporting(false); }
  };

  const accuracyColor = (a: string) =>
    a === 'excellent' ? 'text-emerald-400' : a === 'good' ? 'text-cyan-400' : 'text-amber-400';
  const accuracyLabel = (a: string) =>
    a === 'excellent' ? 'Xuất sắc!' : a === 'good' ? 'Khá tốt!' : 'Cần cải thiện';
  const accuracyBg = (a: string) =>
    a === 'excellent' ? 'bg-emerald-500/10 border-emerald-500/20' : a === 'good' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-amber-500/10 border-amber-500/20';

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Luyện nói & Phát âm AI
          </h1>
          <p className="text-gray-400 mt-1">Đọc câu mẫu, ghi âm và nhận chấm điểm từ AI. Lưu lịch sử từng lần luyện.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          {activeTab === 'manage' && (
            <>
              <button onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 font-medium py-2 px-3 rounded-xl text-sm transition-all cursor-pointer">
                <Upload className="h-4 w-4" /> Import
              </button>
              <button onClick={openAddModal}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/15 cursor-pointer">
                <Plus className="h-4 w-4" /> Thêm câu
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
        {([['practice', <Mic className="h-4 w-4"/>, 'Luyện tập'], ['manage', <BookOpen className="h-4 w-4"/>, 'Quản lý câu'], ['history', <History className="h-4 w-4"/>, 'Lịch sử']] as const).map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === tab ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── TAB: PRACTICE ── */}
      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily phrase selector */}
          <div className="glass-card rounded-2xl p-4 space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Câu ngày hôm nay</h3>
            </div>
            {dailyPhrases.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Shuffle className="h-8 w-8 text-gray-600 mx-auto" />
                <p className="text-gray-500 text-xs">Chưa có câu nào. Thêm câu trong tab "Quản lý câu".</p>
                <button onClick={() => setActiveTab('manage')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer">Thêm câu ngay →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {dailyPhrases.map((p) => (
                  <button key={p.id} onClick={() => { setSelectedPhrase(p); setEvaluation(null); setTranscribedText(''); setPracticeError(''); }}
                    className={`w-full p-3 rounded-xl text-left text-xs transition-all border ${selectedPhrase?.id === p.id ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-white/2 border-white/5 text-gray-400 hover:bg-white/5'}`}>
                    <span className="block font-mono text-white mb-0.5 line-clamp-2">{p.text}</span>
                    <span className="block text-[10px] text-gray-500 truncate">{p.translation}</span>
                    {p.level && <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-400">{p.level}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Practice panel */}
          <div className="md:col-span-2 space-y-5">
            {selectedPhrase ? (
              <div className="glass-card p-6 rounded-3xl space-y-6">
                {/* Sentence display */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Câu mẫu hôm nay</span>
                    <button onClick={() => handleSpeak(selectedPhrase.text)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-400 border border-white/5 cursor-pointer transition-colors" title="Nghe phát âm mẫu">
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-white font-mono leading-relaxed">{selectedPhrase.text}</p>
                  <p className="text-sm text-gray-400">{selectedPhrase.translation}</p>
                </div>

                {/* Record button */}
                <div className="flex flex-col items-center gap-4 border-t border-b border-white/5 py-8">
                  {isRecording && (
                    <div className="flex items-center gap-1 h-8">
                      {[...Array(8)].map((_, i) => (
                        <span key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse"
                          style={{ height: `${20 + Math.random() * 20}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  )}
                  <button onClick={handleToggleRecord} disabled={evaluating}
                    className={`p-5 rounded-full text-white transition-all shadow-xl cursor-pointer ${isRecording ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 animate-pulse' : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-indigo-500/20'}`}>
                    {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  </button>
                  <span className="text-xs font-semibold text-gray-400">
                    {isRecording ? 'Đang ghi âm... Nhấn nút đỏ để kết thúc' : 'Nhấn Micro và đọc to câu mẫu'}
                  </span>
                </div>

                {practiceError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />{practiceError}
                  </div>
                )}

                {evaluating && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin" />
                    <span className="text-xs text-gray-400">AI đang phân tích phát âm...</span>
                  </div>
                )}

                {/* Evaluation result */}
                {evaluation && (
                  <div className="space-y-4 border-t border-white/5 pt-5 animate-fade-in">
                    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border ${accuracyBg(evaluation.accuracy)}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full border-4 border-white/10 flex items-center justify-center relative shrink-0">
                          <svg className="absolute w-full h-full -rotate-90">
                            <circle cx="28" cy="28" r="24" className="stroke-white/10" strokeWidth="3" fill="transparent" />
                            <circle cx="28" cy="28" r="24" className={evaluation.accuracy === 'excellent' ? 'stroke-emerald-500' : evaluation.accuracy === 'good' ? 'stroke-cyan-500' : 'stroke-amber-500'}
                              strokeWidth="3" fill="transparent"
                              strokeDasharray={2*Math.PI*24}
                              strokeDashoffset={2*Math.PI*24*(1 - evaluation.score/100)} />
                          </svg>
                          <span className="text-lg font-extrabold text-white">{evaluation.score}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Điểm phát âm</span>
                          <span className={`text-sm font-bold flex items-center gap-1 ${accuracyColor(evaluation.accuracy)}`}>
                            <Award className="h-4 w-4" />{accuracyLabel(evaluation.accuracy)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 font-mono text-center sm:text-right">
                        <span className="text-xs text-gray-500 block mb-0.5">Bạn đã nói:</span>
                        "{transcribedText}"
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-gray-400 font-semibold">Phân tích từng từ:</span>
                      <div className="flex flex-wrap gap-2 p-4 bg-white/2 border border-white/5 rounded-2xl font-mono text-sm">
                        {evaluation.wordAnalysis.map((w, i) => (
                          <span key={i} title={w.status === 'correct' ? 'Đúng' : w.status === 'mispronounced' ? 'Sai phát âm' : 'Bỏ sót'}
                            className={`px-2 py-0.5 rounded font-bold border ${w.status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : w.status === 'mispronounced' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 line-through'}`}>
                            {w.word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl space-y-1">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Lời khuyên từ AI Tutor
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{evaluation.feedback}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" /> Kết quả đã được lưu vào lịch sử tự động.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 text-gray-500">
                <Mic className="h-10 w-10 text-gray-600" />
                <p className="text-sm">Chọn một câu luyện tập từ danh sách bên trái.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: MANAGE ── */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input type="text" placeholder="Tìm câu..." value={manageSearch}
                onChange={e => setManageSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500 shrink-0" />
              <select value={manageLevel} onChange={e => setManageLevel(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500/50">
                <option value="">Tất cả cấp độ</option>
                {LEVELS.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
              </select>
            </div>
          </div>

          {loadingPhrases ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" /></div>
          ) : phrases.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center space-y-3">
              <BookOpen className="h-10 w-10 text-gray-600 mx-auto" />
              <p className="text-gray-400 text-sm">Chưa có câu nào. Thêm câu mới hoặc import hàng loạt.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {phrases.map(p => (
                <div key={p.id} className="glass-card p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <p className="font-mono text-white font-semibold text-sm leading-relaxed">{p.text}</p>
                    {p.translation && <p className="text-xs text-gray-400">{p.translation}</p>}
                    <div className="flex gap-1.5 flex-wrap">
                      {p.level && <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-400">{p.level}</span>}
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-gray-500">{langLabel[p.language] || p.language}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button onClick={() => handleSpeak(p.text)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-white/5 transition-colors cursor-pointer" title="Nghe">
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setDeleteId(p.id); setDeleteText(p.text); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: HISTORY ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Tổng <span className="text-white font-semibold">{historyTotal}</span> lần luyện tập</p>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" /></div>
          ) : history.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center space-y-3">
              <History className="h-10 w-10 text-gray-600 mx-auto" />
              <p className="text-gray-400 text-sm">Chưa có lịch sử luyện tập. Hãy thử ghi âm một câu!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(h => {
                const words: WordAnalysis[] = (() => { try { return JSON.parse(h.wordAnalysisJson); } catch { return []; } })();
                const isExpanded = expandedHistory === h.id;
                return (
                  <div key={h.id} className="glass-card rounded-2xl overflow-hidden border border-white/5">
                    <div className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/2 transition-colors"
                      onClick={() => setExpandedHistory(isExpanded ? null : h.id)}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold ${h.accuracy === 'excellent' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : h.accuracy === 'good' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-amber-500 text-amber-400 bg-amber-500/10'}`}>
                          {h.score}
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-white text-sm font-semibold truncate">{h.phraseText}</p>
                          <p className="text-[10px] text-gray-500">{new Date(h.practicedAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${accuracyBg(h.accuracy)} ${accuracyColor(h.accuracy)}`}>
                          {accuracyLabel(h.accuracy)}
                        </span>
                        <button onClick={e => { e.stopPropagation(); handleDeleteHistory(h.id); }}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3 animate-fade-in">
                        <div className="flex flex-col sm:flex-row gap-4 text-xs">
                          <div>
                            <span className="text-gray-500 block mb-1">Câu mẫu:</span>
                            <span className="font-mono text-white">{h.phraseText}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Bạn đã nói:</span>
                            <span className="font-mono text-gray-300">"{h.spokenText}"</span>
                          </div>
                        </div>
                        {words.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {words.map((w, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded text-xs font-mono border ${w.status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : w.status === 'mispronounced' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 line-through'}`}>
                                {w.word}
                              </span>
                            ))}
                          </div>
                        )}
                        {h.feedback && (
                          <p className="text-xs text-gray-400 leading-relaxed bg-white/2 p-3 rounded-xl border border-white/5">
                            <Sparkles className="h-3 w-3 text-indigo-400 inline mr-1" />{h.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* History pagination */}
          {historyTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setHistoryPage(p => Math.max(1, p-1))} disabled={historyPage === 1}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white disabled:opacity-40 cursor-pointer transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-400">Trang {historyPage} / {historyTotalPages}</span>
              <button onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p+1))} disabled={historyPage === historyTotalPages}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white disabled:opacity-40 cursor-pointer transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Add/Edit Phrase ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl animate-zoom-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">{editingPhrase ? 'Sửa câu luyện tập' : 'Thêm câu mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSavePhrase} className="p-6 space-y-4">
              {formError && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">{formError}</p>}
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Câu luyện tập *</label>
                <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
                  placeholder="Nhập câu cần luyện phát âm..." />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Dịch nghĩa</label>
                <input type="text" value={form.translation} onChange={e => setForm({...form, translation: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Nghĩa tiếng Việt..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Cấp độ</label>
                  <select value={form.level} onChange={e => setForm({...form, level: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                    {LEVELS.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Ngôn ngữ</label>
                  <select value={form.language} onChange={e => setForm({...form, language: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="en" className="bg-gray-900">Tiếng Anh</option>
                    <option value="ja" className="bg-gray-900">Tiếng Nhật</option>
                    <option value="zh" className="bg-gray-900">Tiếng Trung</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl text-sm border border-white/5 cursor-pointer transition-colors">Hủy</button>
                <button type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2 px-4 rounded-xl text-sm cursor-pointer flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />{editingPhrase ? 'Cập nhật' : 'Thêm câu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Import ── */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl animate-zoom-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Import hàng loạt</h2>
              <button onClick={() => setIsImportOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleImport} className="p-6 space-y-4">
              {importError && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">{importError}</p>}
              <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed">
                <strong>Định dạng:</strong> Mỗi dòng là một câu.<br/>
                Câu | Dịch nghĩa &nbsp;(phần dịch không bắt buộc)<br/>
                <span className="text-gray-500 mt-1 block">VD: Hello, how are you? | Xin chào, bạn có khỏe không?</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Dán danh sách câu *</label>
                <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
                  placeholder={"Hello, how are you? | Xin chào, bạn khỏe không?\nCould you say that again? | Bạn có thể nói lại không?"} />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Cấp độ cho tất cả câu</label>
                <select value={importLevel} onChange={e => setImportLevel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                  {LEVELS.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsImportOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl text-sm border border-white/5 cursor-pointer transition-colors">Hủy</button>
                <button type="submit" disabled={importing}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-xl text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60">
                  {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {importing ? 'Đang import...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4 animate-zoom-in text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Xóa câu luyện tập?</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Bạn có chắc muốn xóa câu <span className="font-semibold text-white font-mono">"{deleteText}"</span>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl text-sm border border-white/5 cursor-pointer">Hủy</button>
              <button onClick={() => { if (deleteId) handleDeletePhrase(deleteId); }}
                className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-medium py-2 rounded-xl text-sm cursor-pointer">
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
