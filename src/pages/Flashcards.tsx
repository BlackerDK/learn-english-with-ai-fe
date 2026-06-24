import React, { useState, useEffect } from 'react';
import { Volume2, Award, ArrowRight, RotateCw, RefreshCw, HelpCircle, Layers, CheckCircle2, Flame, Circle, BrainCircuit } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Vocabulary {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  notes: string;
  tags: string;
  status: string;
  srsIntervalDays: number;
}

interface FlashcardStats {
  unknown: number;
  hard: number;
  good: number;
  easy: number;
  total: number;
}

export default function Flashcards() {
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [reviewingStatus, setReviewingStatus] = useState<string | null>(null);
  const [cards, setCards] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionFinished, setSessionFinished] = useState(false);

  const targetLang = localStorage.getItem('learn_target_lang') || 'en';

  useEffect(() => {
    fetchStats();
  }, []);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!reviewingStatus || loading || cards.length === 0 || sessionFinished) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') {
          handleReview('unknown');
        } else if (e.key === '2') {
          handleReview('hard');
        } else if (e.key === '3') {
          handleReview('good');
        } else if (e.key === '4') {
          handleReview('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, cards, currentIndex, isFlipped, sessionFinished, reviewingStatus]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/vocabulary/flashcard-stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const startReviewSession = async (status: string) => {
    setReviewingStatus(status);
    setLoading(true);
    setSessionFinished(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/vocabulary/review?status=${status}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (err) {
      console.error('Failed to fetch review cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      if (targetLang === 'ja') {
        utterance.lang = 'ja-JP';
      } else if (targetLang === 'zh') {
        utterance.lang = 'zh-CN';
      } else {
        utterance.lang = 'en-US';
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReview = async (rating: 'unknown' | 'hard' | 'good' | 'easy') => {
    const currentCard = cards[currentIndex];
    
    // Update streak tracking
    const todayStr = new Date().toDateString();
    const lastLearn = localStorage.getItem('last_learn_date');
    const currentStreak = parseInt(localStorage.getItem('learn_streak') || '0', 10);
    
    if (lastLearn !== todayStr) {
      if (lastLearn === new Date(Date.now() - 86400000).toDateString()) {
        localStorage.setItem('learn_streak', (currentStreak + 1).toString());
      } else if (!lastLearn) {
        localStorage.setItem('learn_streak', '1');
      } else {
        localStorage.setItem('learn_streak', '1');
      }
      localStorage.setItem('last_learn_date', todayStr);
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/vocabulary/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating }),
      });
    } catch (err) {
      console.error('Failed to log review:', err);
    }

    // Advance index
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      // Wait for flip transition to finish before changing text
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 200);
    } else {
      triggerConfetti();
      setSessionFinished(true);
    }
  };

  const triggerConfetti = () => {
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#a855f7', '#06b6d4'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#a855f7', '#06b6d4'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  if (loading && !reviewingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Dashboard View
  if (!reviewingStatus) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Flashcard Dashboard</h1>
          <p className="text-gray-400">Chọn nhóm từ vựng bạn muốn ôn tập hôm nay dựa trên mức độ thành thạo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unknown Bucket */}
          <div 
            onClick={() => startReviewSession('unknown')}
            className="glass-card p-6 rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-500/10 transition-all border border-gray-500/20 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-gray-500/20"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-gray-500/20 text-gray-400">
                    <Circle className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Chưa biết</h3>
                </div>
                <p className="text-sm text-gray-400">Các từ vựng mới thêm vào hoặc bạn hoàn toàn chưa nhớ.</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-extrabold text-gray-400">{stats?.unknown || 0}</span>
                <span className="block text-xs text-gray-500 font-semibold mt-1">TỪ VỰNG</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
              <span>Bắt đầu ôn tập</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Hard Bucket */}
          <div 
            onClick={() => startReviewSession('hard')}
            className="glass-card p-6 rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10 transition-all border border-rose-500/20 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/20"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                    <Flame className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Khó</h3>
                </div>
                <p className="text-sm text-gray-400">Những từ bạn hay quên hoặc cảm thấy khó nhớ.</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-extrabold text-rose-400">{stats?.hard || 0}</span>
                <span className="block text-xs text-rose-500 font-semibold mt-1">TỪ VỰNG</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm font-medium text-rose-400 group-hover:text-rose-300 transition-colors">
              <span>Bắt đầu ôn tập</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Good Bucket */}
          <div 
            onClick={() => startReviewSession('good')}
            className="glass-card p-6 rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all border border-indigo-500/20 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/20"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Nhớ sơ sơ</h3>
                </div>
                <p className="text-sm text-gray-400">Những từ bạn đã biết nghĩa nhưng cần ôn lại cho chắc.</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-extrabold text-indigo-400">{stats?.good || 0}</span>
                <span className="block text-xs text-indigo-500 font-semibold mt-1">TỪ VỰNG</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
              <span>Bắt đầu ôn tập</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Easy Bucket */}
          <div 
            onClick={() => startReviewSession('easy')}
            className="glass-card p-6 rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all border border-emerald-500/20 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Dễ</h3>
                </div>
                <p className="text-sm text-gray-400">Những từ bạn đã thuộc làu, chỉ cần lướt qua để không quên.</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-extrabold text-emerald-400">{stats?.easy || 0}</span>
                <span className="block text-xs text-emerald-500 font-semibold mt-1">TỪ VỰNG</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
              <span>Bắt đầu ôn tập</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading Review Session
  if (loading && reviewingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Empty Bucket
  if (cards.length === 0) {
    const statusLabel: Record<string, string> = {
      'unknown': 'Chưa biết',
      'hard': 'Khó',
      'good': 'Nhớ sơ sơ',
      'easy': 'Dễ'
    };
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12 animate-fade-in">
        <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full inline-block">
          <Layers className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Nhóm từ trống!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Tuyệt vời! Không có từ vựng nào trong nhóm <strong>{statusLabel[reviewingStatus || '']}</strong> để ôn tập lúc này.
          </p>
        </div>
        <button
          onClick={() => { setReviewingStatus(null); fetchStats(); }}
          className="flex items-center justify-center gap-2 mx-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2 px-5 rounded-xl text-sm transition-all duration-300 cursor-pointer"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  // Session Finished
  if (sessionFinished) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12 animate-fade-in">
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full inline-block">
          <Award className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Hoàn thành lượt ôn!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Bạn đã xuất sắc ôn tập xong <span className="text-emerald-400 font-bold">{cards.length} từ vựng</span>. Streak của bạn đã được cập nhật!
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => { setReviewingStatus(null); fetchStats(); }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-500/15"
          >
            Quay lại Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const statusLabel: Record<string, string> = {
    'unknown': 'Chưa biết',
    'hard': 'Khó',
    'good': 'Nhớ sơ sơ',
    'easy': 'Dễ'
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <button 
              onClick={() => { setReviewingStatus(null); fetchStats(); }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
            Ôn tập: <span className="text-indigo-400">{statusLabel[reviewingStatus || '']}</span>
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-gray-400">Tiến trình</span>
          <p className="text-sm font-bold text-white">
            {currentIndex + 1} / {cards.length}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        ></div>
      </div>

      {/* 3D Flip Card */}
      <div className="perspective-1000 w-full h-80">
        <div
          className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Side */}
          <div
            onClick={() => setIsFlipped(true)}
            className="absolute inset-0 backface-hidden glass-card flashcard-face p-8 rounded-3xl flex flex-col justify-between items-center text-center cursor-pointer border border-white/10 hover:border-indigo-500/30 transition-colors"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Mặt trước (Nhìn từ)</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Avoid flipping when clicking speak
                  handleSpeak(currentCard.word);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                title="Nghe phát âm chuẩn"
              >
                <Volume2 className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold text-white font-mono">{currentCard.word}</h2>
              {currentCard.pronunciation && (
                <span className="text-sm text-indigo-400 font-mono block">{currentCard.pronunciation}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <RotateCw className="h-3.5 w-3.5" /> Click hoặc nhấn Phím Cách (Space) để lật
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 glass-card flashcard-face p-8 rounded-3xl flex flex-col justify-between border border-indigo-500/20">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-start justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Mặt sau (Nghĩa)</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid flipping when clicking speak
                    handleSpeak(currentCard.word);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xl font-bold text-white leading-relaxed">{currentCard.meaning}</p>
                
                {currentCard.example && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300 italic">
                    <span className="font-semibold block text-white not-italic mb-1">Ví dụ minh họa</span>
                    "{currentCard.example}"
                    {currentCard.exampleTranslation && (
                      <span className="block text-gray-500 mt-1 font-normal not-italic">{currentCard.exampleTranslation}</span>
                    )}
                  </div>
                )}

                {currentCard.notes && (
                  <div className="text-[11px] text-indigo-300 leading-relaxed bg-indigo-500/5 p-2.5 rounded-lg border border-indigo-500/10">
                    <span className="font-semibold block text-indigo-200">Ghi chú:</span>
                    {currentCard.notes}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsFlipped(false)}
              className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-3 pt-3 border-t border-white/5 w-full cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" /> Click hoặc nhấn Phím Cách để lật lại
            </button>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="space-y-4">
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-3 animate-fade-in">
            <button
              onClick={() => handleReview('unknown')}
              className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-gray-600/10 cursor-pointer flex flex-col items-center border border-gray-500"
            >
              <span>Chưa biết</span>
              <span className="text-[10px] text-gray-300 font-normal mt-0.5">Phím 1</span>
            </button>
            <button
              onClick={() => handleReview('hard')}
              className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-3 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-rose-500/10 cursor-pointer flex flex-col items-center border border-rose-400"
            >
              <span>Khó</span>
              <span className="text-[10px] text-rose-200 font-normal mt-0.5">Phím 2</span>
            </button>
            <button
              onClick={() => handleReview('good')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-indigo-500/10 cursor-pointer flex flex-col items-center border border-indigo-400"
            >
              <span>Nhớ sơ sơ</span>
              <span className="text-[10px] text-indigo-200 font-normal mt-0.5">Phím 3</span>
            </button>
            <button
              onClick={() => handleReview('easy')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-emerald-500/10 cursor-pointer flex flex-col items-center border border-emerald-400"
            >
              <span>Dễ</span>
              <span className="text-[10px] text-emerald-200 font-normal mt-0.5">Phím 4</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-2xl text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Hiện câu trả lời</span>
            <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">Space</span>
          </button>
        )}

        <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Mẹo: Nhấn 1, 2, 3, 4 để chọn trạng thái nhanh!</span>
        </div>
      </div>
    </div>
  );
}
