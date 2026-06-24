import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Search, Play, Pause, ChevronRight, Eye, EyeOff, Plus, Check, X, Sparkles, PlusCircle, Edit, Trash2, FileSpreadsheet, Upload } from 'lucide-react';
import { logErrorToBackend } from '../utils/logger';
import { handleApiError } from '../utils/apiError';

interface ListeningLesson {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  translation: string;
  level: string;
}

export default function Listening() {
  const [lessons, setLessons] = useState<ListeningLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<ListeningLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  // Player Settings
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [useTTS, setUseTTS] = useState(false);

  // Practice State
  const [userInput, setUserInput] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [diffResult, setDiffResult] = useState<{text: string, status: 'correct' | 'wrong'}[] | null>(null);

  useEffect(() => {
    if (selectedLesson && !selectedLesson.audioUrl) {
      setUseTTS(true);
    } else {
      setUseTTS(false);
    }
    window.speechSynthesis.cancel();
    
    // Reset practice state
    setShowTranscript(false);
    setUserInput('');
    setHasAttempted(false);
    setScore(null);
    setDiffResult(null);
  }, [selectedLesson?.id]);

  // Click-to-lookup word translation popup
  const [lookupWord, setLookupWord] = useState('');
  const [lookupTranslation, setLookupTranslation] = useState('');
  const [translating, setTranslating] = useState(false);
  const [lookupPosition, setLookupPosition] = useState<{ x: number; y: number } | null>(null);

  // Modal State for adding new lessons
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    audioUrl: '',
    transcript: '',
    translation: '',
    level: 'Intermediate',
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Excel import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    fetchLessons();
  }, [search, selectedLevel]);

  const fetchLessons = async () => {
    try {
      let url = `/api/listening?search=${encodeURIComponent(search)}`;
      if (selectedLevel) url += `&level=${encodeURIComponent(selectedLevel)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
        if (data.length > 0 && !selectedLesson) {
          setSelectedLesson(data[0]);
        }
      }
    } catch (err) {
      logErrorToBackend(err, 'Listening.fetchLessons');
      console.error('Failed to fetch listening lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = () => {
    if (!selectedLesson) return;
    
    const cleanWord = (w: string) => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim();
    
    const targetWordsRaw = selectedLesson.transcript.split(/\s+/).filter(Boolean);
    const inputWordsRaw = userInput.split(/\s+/).filter(Boolean);
    
    const targetWords = targetWordsRaw.map(cleanWord);
    const inputWords = inputWordsRaw.map(cleanWord);
    
    if (targetWords.length === 0) {
      setScore(100);
      setHasAttempted(true);
      setDiffResult([]);
      return;
    }
    if (inputWords.length === 0) {
      setScore(0);
      setHasAttempted(true);
      setDiffResult(targetWordsRaw.map(w => ({ text: w, status: 'wrong' as const })));
      return;
    }

    const dp = Array(inputWords.length + 1).fill(0).map(() => Array(targetWords.length + 1).fill(0));
    for (let i = 1; i <= inputWords.length; i++) {
      for (let j = 1; j <= targetWords.length; j++) {
        if (inputWords[i - 1] === targetWords[j - 1] && inputWords[i - 1] !== '') {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    let i_idx = inputWords.length;
    let j_idx = targetWords.length;
    const matchedTargetIndices = new Set<number>();

    while (i_idx > 0 && j_idx > 0) {
      if (inputWords[i_idx - 1] === targetWords[j_idx - 1] && inputWords[i_idx - 1] !== '') {
        matchedTargetIndices.add(j_idx - 1);
        i_idx--;
        j_idx--;
      } else if (dp[i_idx - 1][j_idx] > dp[i_idx][j_idx - 1]) {
        i_idx--;
      } else {
        j_idx--;
      }
    }

    const result = targetWordsRaw.map((word, index) => ({
      text: word,
      status: matchedTargetIndices.has(index) ? 'correct' as const : 'wrong' as const
    }));

    const matched = matchedTargetIndices.size;
    const percentage = Math.round((matched / targetWords.length) * 100);
    
    setScore(percentage > 100 ? 100 : percentage);
    setHasAttempted(true);
    setDiffResult(result);
  };

  const playTTS = () => {
    if (!selectedLesson) return;
    
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedLesson.transcript);
    const targetLang = localStorage.getItem('learn_target_lang') || 'en';
    utterance.lang = targetLang === 'ja' ? 'ja-JP' : targetLang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = playbackRate;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      if (useTTS) {
        window.speechSynthesis.pause();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (useTTS || !selectedLesson?.audioUrl) {
        playTTS();
      } else if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Audio play failed, falling back to TTS', err);
          setUseTTS(true);
          playTTS();
        }
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    if (useTTS && isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Click to translate word using AI Tutor Chat
  const handleWordClick = async (e: React.MouseEvent, word: string) => {
    // Clean word from punctuation
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim();
    if (!cleanWord || cleanWord.length < 2) return;

    setLookupWord(cleanWord);
    setLookupTranslation('Đang dịch...');
    setTranslating(true);

    // Calculate popup position near the clicked word
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setLookupPosition({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 80,
    });

    try {
      const targetLang = localStorage.getItem('learn_target_lang') || 'en';
      const prompt = `Translate this word: "${cleanWord}" from ${targetLang === 'ja' ? 'Japanese' : targetLang === 'zh' ? 'Chinese' : 'English'} to Vietnamese. Provide the part of speech, IPA pronunciation, main definition, and a very short example sentence in Vietnamese. Keep it concise.`;
      
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setLookupTranslation(data.response);
      } else {
        await handleApiError(res);
        setLookupTranslation('Không thể dịch từ. Vui lòng kiểm tra API Key.');
      }
    } catch (err) {
      logErrorToBackend(err, 'Listening.handleWordClick');
      setLookupTranslation('Lỗi hệ thống.');
    } finally {
      setTranslating(false);
    }
  };

  // Add lookup word to vocabulary notebook
  const handleAddLookupToVocabulary = async () => {
    if (!lookupWord) return;

    try {
      const payload = {
        word: lookupWord,
        pronunciation: '', // Can be completed later
        meaning: lookupTranslation.split('\n')[0].replace(/.*Dịch nghĩa:|.*Nghĩa:/i, '').trim(), // Rough extraction of first line
        example: selectedLesson?.title || 'Từ vựng từ bài nghe',
        exampleTranslation: '',
        notes: `Tra từ bài luyện nghe: ${selectedLesson?.title}`,
        tags: 'Listening,Lookup',
      };

      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Đã thêm từ "${lookupWord}" vào sổ từ vựng thành công!`);
        setLookupPosition(null);
      }
    } catch (err) {
      logErrorToBackend(err, 'Listening.handleAddLookupToVocabulary');
      console.error('Failed to add lookup word to vocab:', err);
    }
  };

  // Render clickable words from transcript text
  const renderClickableText = (text: string) => {
    return text.split(/\s+/).map((word, idx) => (
      <span
        key={idx}
        onClick={(e) => handleWordClick(e, word)}
        className="hover:text-indigo-400 hover:underline cursor-pointer select-none inline-block mr-1 transition-colors"
      >
        {word}
      </span>
    ));
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      audioUrl: '',
      transcript: '',
      translation: '',
      level: 'Intermediate',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lesson: ListeningLesson) => {
    setEditingId(lesson.id);
    setForm({
      title: lesson.title,
      audioUrl: lesson.audioUrl,
      transcript: lesson.transcript,
      translation: lesson.translation || '',
      level: lesson.level,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/listening/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Sau khi xóa, tìm bài nghe khác để select
        const remainingLessons = lessons.filter(l => l.id !== id);
        if (remainingLessons.length > 0) {
          setSelectedLesson(remainingLessons[0]);
        } else {
          setSelectedLesson(null);
        }
        setIsPlaying(false);
        setLookupPosition(null);
        fetchLessons();
      } else {
        alert('Không thể xóa bài nghe từ máy chủ.');
      }
    } catch (err) {
      logErrorToBackend(err, 'Listening.handleDeleteLesson');
      alert('Không thể kết nối đến máy chủ để xóa.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.transcript.trim()) {
      setErrorMsg('Vui lòng điền đủ Tiêu đề và Transcript.');
      return;
    }

    try {
      const url = editingId ? `/api/listening/${editingId}` : '/api/listening';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        if (editingId) {
          // Cập nhật lại selectedLesson đang hiển thị
          setSelectedLesson({ id: editingId, ...form });
        }
        fetchLessons();
      } else {
        const text = await res.text();
        setErrorMsg(`Lỗi từ máy chủ: ${text}`);
      }
    } catch (err) {
      logErrorToBackend(err, 'Listening.handleSave');
      setErrorMsg('Không thể kết nối đến máy chủ.');
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) { setImportError('Vui lòng chọn file Excel.'); return; }
    setImporting(true); setImportError(''); setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/listening/import-excel', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setImportResult({ count: data.length });
        setImportFile(null);
        fetchLessons();
      } else {
        const text = await res.text();
        setImportError(`Lỗi: ${text}`);
      }
    } catch (err) {
      logErrorToBackend(err, 'Listening.handleImportExcel');
      setImportError('Lỗi kết nối đến máy chủ.');
    } finally { setImporting(false); }
  };

  const levels = ['Basic', 'Intermediate', 'Advanced', 'N5', 'N4', 'N3', 'N2', 'N1', 'B1', 'B2', 'IELTS'];

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Click-to-lookup word popup portal */}
      {lookupPosition && (
        <div
          className="absolute z-50 glass-card p-4 rounded-xl border border-indigo-500/20 shadow-2xl max-w-xs space-y-3 bg-slate-900 text-left animate-zoom-in"
          style={{ left: `${Math.min(lookupPosition.x, window.innerWidth - 300)}px`, top: `${lookupPosition.y}px` }}
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="font-extrabold text-sm text-white flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              Tra từ: "{lookupWord}"
            </span>
            <button
              onClick={() => setLookupPosition(null)}
              className="p-0.5 rounded text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="text-xs text-gray-300 leading-relaxed overflow-y-auto max-h-36 pr-1 whitespace-pre-wrap">
            {lookupTranslation}
          </div>
          {!translating && (
            <button
              onClick={handleAddLookupToVocabulary}
              className="w-full flex items-center justify-center gap-1 py-1 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Thêm vào Sổ từ vựng
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Luyện nghe thông minh
          </h1>
          <p className="text-gray-400 mt-1">Nghe audio chuẩn, tra từ vựng nhanh trực tiếp bằng cách click vào transcript.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => { setIsImportOpen(true); setImportFile(null); setImportError(''); setImportResult(null); }}
            className="flex items-center justify-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 font-medium py-2.5 px-4 rounded-xl text-sm transition-all duration-300 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import Excel
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Thêm bài nghe mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[72vh]">
        {/* Left Side: Lesson List */}
        <div className="glass-card rounded-2xl flex flex-col overflow-hidden border border-white/5 md:col-span-1">
          <div className="p-4 border-b border-white/5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Tìm bài nghe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 text-gray-300"
            >
              <option value="" className="bg-bg-dark">Tất cả trình độ</option>
              {levels.map((l) => (
                <option key={l} value={l} className="bg-bg-dark">
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-gray-500 text-center text-xs py-8">Không có bài nghe nào.</p>
            ) : (
              lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLesson(lesson);
                    setIsPlaying(false);
                    setLookupPosition(null);
                  }}
                  className={`p-4 cursor-pointer transition-all flex items-start justify-between gap-3 text-left ${
                    selectedLesson?.id === lesson.id ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-white/2'
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className={`font-bold text-sm leading-snug ${selectedLesson?.id === lesson.id ? 'text-white' : 'text-gray-300'}`}>
                      {lesson.title}
                    </h3>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-semibold text-indigo-400">
                      {lesson.level}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Player Workspace */}
        <div className="glass-card rounded-2xl flex flex-col overflow-hidden border border-white/5 md:col-span-2">
          {selectedLesson ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={selectedLesson.audioUrl}
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                  if (selectedLesson.audioUrl) {
                    console.warn("Audio failed to load. Falling back to TTS.");
                    setUseTTS(true);
                  }
                }}
              />

              {/* Player Top Bar */}
              <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-white/2">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400">Đang học nghe</span>
                  <h2 className="text-base font-bold text-white leading-tight">{selectedLesson.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedLesson)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 border border-white/5 transition-colors cursor-pointer"
                    title="Chỉnh sửa bài nghe"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Sửa
                  </button>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-rose-400 hover:text-rose-300 border border-white/5 transition-colors cursor-pointer"
                    title="Xóa bài nghe"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
                  </button>
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    disabled={!hasAttempted}
                    title={!hasAttempted ? 'Hãy kiểm tra bài nghe ít nhất 1 lần để xem Transcript' : ''}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      hasAttempted 
                        ? 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5 cursor-pointer' 
                        : 'bg-white/5 opacity-40 text-gray-500 border-transparent cursor-not-allowed'
                    }`}
                  >
                    {showTranscript ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showTranscript ? 'Ẩn Transcript' : 'Hiện Transcript'}
                  </button>
                </div>
              </div>

              {/* Audio Controls Console */}
              <div className="p-6 border-b border-white/5 bg-white/1 flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Play/Pause control */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="p-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/10 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-white" />}
                  </button>
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Trạng thái phát</span>
                    <span className="text-sm font-semibold text-white">
                      {isPlaying ? (useTTS ? 'Đang đọc văn bản (TTS)...' : 'Đang phát âm thanh...') : 'Đã tạm dừng'}
                    </span>
                  </div>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium mr-2">Tốc độ:</span>
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        playbackRate === speed
                          ? 'bg-indigo-500 border-indigo-500 text-white shadow shadow-indigo-500/10'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Workspace: Transcript vs Translation */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {showTranscript ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Transcript original (interactive) */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Văn bản gốc (Click vào từ để dịch)</h4>
                      <p className="text-sm md:text-base text-gray-100 font-medium leading-relaxed font-serif whitespace-pre-wrap select-text">
                        {renderClickableText(selectedLesson.transcript)}
                      </p>
                    </div>

                    {/* Translation */}
                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                      <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Bản dịch tiếng Việt</h4>
                      <p className="text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {selectedLesson.translation || 'Không có bản dịch cho bài học này.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full pb-8">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-indigo-400">Ghi lại những gì bạn nghe được:</label>
                        {score !== null && (
                          <span className={`text-sm font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            <Sparkles className="h-3.5 w-3.5" />
                            Độ chính xác: {score}%
                          </span>
                        )}
                      </div>
                      {diffResult ? (
                        <div className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm overflow-y-auto leading-relaxed font-sans shadow-inner">
                          {diffResult.map((item, idx) => (
                            <span 
                              key={idx} 
                              className={`mr-1.5 ${item.status === 'correct' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold underline decoration-rose-500/30'}`}
                            >
                              {item.text}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <textarea 
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none text-gray-200 leading-relaxed font-sans shadow-inner placeholder:text-gray-500"
                          placeholder="Bấm Play ở trên và gõ nội dung bạn nghe được vào đây (không phân biệt hoa/thường, không tính dấu chấm phẩy)..."
                        />
                      )}
                    </div>
                    <div className="self-end flex gap-3">
                      {diffResult && (
                        <button 
                          onClick={() => { setDiffResult(null); }}
                          className="bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-2 px-6 rounded-xl text-sm transition-all border border-white/5 cursor-pointer"
                        >
                          Làm lại
                        </button>
                      )}
                      {!diffResult && (
                        <button 
                          onClick={handleCheck}
                          disabled={!userInput.trim()}
                          className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2 px-6 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                        >
                          <Check className="h-4.5 w-4.5" />
                          Kiểm tra kết quả
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8 text-gray-500 space-y-3">
              <Volume2 className="h-10 w-10 text-gray-600" />
              <p className="text-sm">Chọn một bài nghe từ thanh bên trái để bắt đầu luyện tập.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Chỉnh sửa bài nghe' : 'Thêm bài nghe mới'}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-gray-300 block mb-1 font-semibold">Tiêu đề bài nghe *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. VOA - Learning English Lesson 1"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-gray-300 block mb-1 font-semibold">Trình độ (Level)</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {levels.map((l) => (
                      <option key={l} value={l} className="bg-bg-dark text-white">
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1 font-semibold">Đường dẫn File Audio (URL) (Tùy chọn)</label>
                <input
                  type="url"
                  value={form.audioUrl}
                  onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Bỏ trống hệ thống sẽ tự động đọc (TTS)..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1 font-semibold">Transcript bài viết (Nguyên văn) *</label>
                <textarea
                  required
                  rows={4}
                  value={form.transcript}
                  onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Nhập nội dung văn bản tiếng nước ngoài nghe được tại đây..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1 font-semibold">Bản dịch tiếng Việt</label>
                <textarea
                  rows={3}
                  value={form.translation}
                  onChange={(e) => setForm({ ...form, translation: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Dịch nội dung bài nghe sang tiếng Việt (nếu có)..."
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-medium py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  {editingId ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-teal-400" />
                <h2 className="text-lg font-bold text-white">Import bài nghe từ Excel</h2>
              </div>
              <button onClick={() => setIsImportOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Format guide */}
              <div className="p-4 bg-indigo-500/8 border border-indigo-500/20 rounded-xl space-y-2">
                <p className="text-xs font-bold text-indigo-400">Định dạng file Excel yêu cầu:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-indigo-500/15">
                        {['Tên bài nghe', 'Trình độ', 'Đường dẫn', 'Nguyên văn', 'Đoạn dịch'].map(col => (
                          <th key={col} className="px-2 py-1.5 text-left text-indigo-300 font-bold border border-indigo-500/20 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {['VOA Lesson 1', 'Intermediate', 'https://...mp3', 'Learning is...', 'Học tập là...'].map((v, i) => (
                          <td key={i} className="px-2 py-1.5 text-gray-400 border border-white/5 whitespace-nowrap">{v}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-500">• Hàng đầu tiên là tiêu đề cột (không bắt buộc)<br/>• Chỉ cột "Tên bài nghe" là bắt buộc, các cột còn lại có thể để trống</p>
              </div>

              <form onSubmit={handleImportExcel} className="space-y-4">
                {importError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{importError}</div>
                )}
                {importResult && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    Import thành công <span className="font-bold">{importResult.count}</span> bài nghe!
                  </div>
                )}

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setIsDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
                      setImportFile(f); setImportError('');
                    } else { setImportError('Chỉ hỗ trợ file .xlsx hoặc .xls'); }
                  }}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-teal-400 bg-teal-500/10' : 'border-white/10 hover:border-white/20'}`}
                >
                  <input type="file" accept=".xlsx,.xls" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setImportFile(f); setImportError(''); } }} />
                  <div className="space-y-2 pointer-events-none">
                    <Upload className={`h-8 w-8 mx-auto ${isDragging ? 'text-teal-400' : 'text-gray-500'}`} />
                    {importFile ? (
                      <div>
                        <p className="text-sm font-semibold text-teal-400">{importFile.name}</p>
                        <p className="text-[10px] text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-400">Kéo thả file Excel vào đây</p>
                        <p className="text-[10px] text-gray-500 mt-1">hoặc click để chọn file (.xlsx, .xls)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setIsImportOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-medium py-2 px-4 rounded-xl text-sm cursor-pointer transition-colors">
                    {importResult ? 'Đóng' : 'Hủy'}
                  </button>
                  {!importResult && (
                    <button type="submit" disabled={!importFile || importing}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-xl text-sm cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15">
                      {importing ? <><Upload className="h-4 w-4 animate-bounce" />Đang import...</> : <><FileSpreadsheet className="h-4 w-4" />Import</>}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4 animate-zoom-in text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-sans">Xóa bài nghe?</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Bạn có chắc chắn muốn xóa bài nghe <span className="font-semibold text-white">"{selectedLesson.title}"</span> không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors border border-white/5 cursor-pointer font-sans"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteLesson(selectedLesson.id);
                  setIsDeleteConfirmOpen(false);
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
