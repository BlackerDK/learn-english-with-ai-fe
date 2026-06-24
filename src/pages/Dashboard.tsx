import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, HelpCircle, Award, Sparkles, MessageSquare, Mic,
  ArrowRight, BookMarked, Calendar, Volume2, Globe, Edit3
} from 'lucide-react';
import { getPathLabel, getStudyLevel, vocabMatchesPath } from '../utils/learningPath';

interface Vocabulary {
  id: string;
  word: string;
  status: string;
  tags: string;
  nextReviewDate: string;
}

interface PagedVocabulary {
  items: Vocabulary[];
  totalItems: number;
}

export default function Dashboard() {
  const [pathLabel, setPathLabel] = useState(getPathLabel());
  const [stats, setStats] = useState({
    unknown: 0,
    hard: 0,
    good: 0,
    easy: 0,
    totalWords: 0,
    grammarCount: 0,
    listeningCount: 0,
    quizCount: 0,
  });
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const updateStreak = useCallback(() => {
    const lastLearnDate = localStorage.getItem('last_learn_date');
    const currentStreak = parseInt(localStorage.getItem('learn_streak') || '0', 10);
    const todayStr = new Date().toDateString();

    if (lastLearnDate === todayStr) {
      setStreak(currentStreak);
    } else if (lastLearnDate === new Date(Date.now() - 86400000).toDateString()) {
      setStreak(currentStreak);
    } else {
      setStreak(0);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const level = getStudyLevel();
    setPathLabel(getPathLabel());

    try {
      const levelParam = encodeURIComponent(level);

      const [flashcardRes, grammarRes, listeningRes, quizRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || '') + '/api/vocabulary/flashcard-stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/grammar?level=${levelParam}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/listening?level=${levelParam}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch((import.meta.env.VITE_API_URL || '') + '/api/quiz/history', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
      ]);

      const flashcards = flashcardRes.ok ? await flashcardRes.json() : { unknown: 0, hard: 0, good: 0, easy: 0, total: 0 };
      const grammar = grammarRes.ok ? await grammarRes.json() : [];
      const listening = listeningRes.ok ? await listeningRes.json() : [];
      const quizHistory = quizRes.ok ? await quizRes.json() : [];

      setStats({
        unknown: flashcards.unknown || 0,
        hard: flashcards.hard || 0,
        good: flashcards.good || 0,
        easy: flashcards.easy || 0,
        totalWords: flashcards.total || 0,
        grammarCount: Array.isArray(grammar) ? grammar.length : 0,
        listeningCount: Array.isArray(listening) ? listening.length : 0,
        quizCount: Array.isArray(quizHistory) ? quizHistory.length : 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    updateStreak();
    fetchStats();

    const handlePathChange = () => {
      updateStreak();
      fetchStats();
    };

    window.addEventListener('storage', handlePathChange);
    window.addEventListener('learn-path-changed', handlePathChange);

    return () => {
      window.removeEventListener('storage', handlePathChange);
      window.removeEventListener('learn-path-changed', handlePathChange);
    };
  }, [fetchStats, updateStreak]);

  const masteredPercentage = stats.totalWords > 0
    ? Math.round((stats.easy / stats.totalWords) * 100)
    : 0;

  const langName = pathLabel.split(' · ')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/10">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-radial-gradient from-indigo-500 to-transparent pointer-events-none"></div>
        <div className="max-w-xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              AI Language Learning Tutor
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">
              <Globe className="h-3.5 w-3.5" />
              Lộ trình: {pathLabel}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Chào mừng bạn đến với <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Antigravity Lang</span>!
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Hôm nay là một ngày tuyệt vời để nâng cao kỹ năng {langName.toLowerCase()}.
            Bạn đang có <span className="text-rose-400 font-bold">{stats.hard} từ Khó</span> và <span className="text-indigo-400 font-bold">{stats.unknown} từ Mới</span> chờ ôn tập.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#flashcards"
              onClick={() => { window.location.hash = 'flashcards'; }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-sm flex items-center gap-2 transition-all duration-300 shadow-lg shadow-indigo-500/15"
            >
              Ôn tập ngay ({stats.hard + stats.unknown})
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#settings"
              onClick={() => { window.location.hash = 'settings'; }}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium text-sm flex items-center gap-2 transition-all duration-300"
            >
              Đổi lộ trình
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Stats & Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Học liên tục</span>
            <span className="text-2xl font-bold text-white mt-0.5">{streak} ngày</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Khó (Hard)</span>
            <span className="text-2xl font-bold text-white mt-0.5">{stats.hard} thẻ</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Từ vựng</span>
            <span className="text-2xl font-bold text-white mt-0.5">{stats.totalWords} từ</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Đã thuộc lòng (Easy)</span>
            <span className="text-2xl font-bold text-white mt-0.5">{stats.easy} thẻ</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl md:col-span-1 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-semibold text-gray-200">Tiến trình từ vựng</h3>
            <p className="text-[10px] text-gray-500 mt-1">{pathLabel}</p>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative h-36 w-36 flex items-center justify-center">
              <svg className="absolute transform -rotate-90 w-full h-full">
                <circle cx="72" cy="72" r="60" className="stroke-white/5" strokeWidth="8" fill="transparent" />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-indigo-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - masteredPercentage / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-3xl font-extrabold text-white">{masteredPercentage}%</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Đã Thuộc</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
              <span className="text-gray-400 block mb-0.5">Chưa biết</span>
              <span className="font-bold text-gray-300">{stats.unknown}</span>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
              <span className="text-gray-400 block mb-0.5">Khó</span>
              <span className="font-bold text-rose-400">{stats.hard}</span>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
              <span className="text-gray-400 block mb-0.5">Nhớ sơ sơ</span>
              <span className="font-bold text-indigo-400">{stats.good}</span>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
              <span className="text-gray-400 block mb-0.5">Dễ</span>
              <span className="font-bold text-emerald-400">{stats.easy}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl md:col-span-2 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-200 mb-1">Tính năng chính</h3>
            <p className="text-[10px] text-gray-500">Nội dung theo lộ trình {pathLabel}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="#grammar-notes"
              onClick={() => { window.location.hash = 'grammar-notes'; }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">Ghi chú ngữ pháp</span>
                <span className="text-xs text-gray-400 mt-1 block leading-relaxed">
                  {stats.grammarCount} bài học cấp {getStudyLevel()}
                </span>
              </div>
            </a>

            <a
              href="#listening"
              onClick={() => { window.location.hash = 'listening'; }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">Luyện nghe</span>
                <span className="text-xs text-gray-400 mt-1 block leading-relaxed">
                  {stats.listeningCount} bài nghe cấp {getStudyLevel()}
                </span>
              </div>
            </a>

            <a
              href="#ai-tutor"
              onClick={() => { window.location.hash = 'ai-tutor'; }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">AI Tutor Chat</span>
                <span className="text-xs text-gray-400 mt-1 block leading-relaxed">Hỏi đáp từ vựng, ngữ pháp và đối thoại 24/7.</span>
              </div>
            </a>

            <a
              href="#speaking-practice"
              onClick={() => { window.location.hash = 'speaking-practice'; }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition-transform">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">Luyện nói & Phát âm</span>
                <span className="text-xs text-gray-400 mt-1 block leading-relaxed">Luyện phát âm {langName} với AI.</span>
              </div>
            </a>

            <a
              href="#writing"
              onClick={() => { window.location.hash = 'writing'; }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-pink-500/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl group-hover:scale-110 transition-transform">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">Luyện viết AI</span>
                <span className="text-xs text-gray-400 mt-1 block leading-relaxed">Viết theo chủ đề và nhận chấm điểm, chữa lỗi từ AI.</span>
              </div>
            </a>

            <a
              href="#quiz"
              onClick={() => { window.location.hash = 'quiz'; }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl group-hover:scale-110 transition-transform">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">Quiz trắc nghiệm AI</span>
                <span className="text-xs text-gray-400 mt-1 block leading-relaxed">
                  {stats.quizCount > 0 ? `${stats.quizCount} lượt quiz đã làm` : 'Tạo quiz kiểm tra từ vựng và ngữ pháp'}
                </span>
              </div>
            </a>

            <a
              href="#flashcards"
              onClick={() => { window.location.hash = 'flashcards'; }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-rose-500/30 transition-all duration-300 group"
            >
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
                <BookMarked className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white block text-sm">Thẻ Flashcard (SRS)</span>
                <span className="text-xs text-gray-400 mt-1 block leading-relaxed">
                  {stats.hard + stats.unknown} thẻ chờ ôn tập hôm nay
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
