import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, HelpCircle, Award, Sparkles, MessageSquare, Mic,
  ArrowRight, BookMarked, Calendar, Volume2, Edit3, Star, Trophy, Target, Zap
} from 'lucide-react';
import { getPathLabel, getStudyLevel } from '../utils/learningPath';

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

  // Mock progress for kids design
  const xp = 1250;
  const coins = 450;
  const stars = 12;

  const updateStreak = useCallback(() => {
    const currentStreak = parseInt(localStorage.getItem('learn_streak') || '3', 10); // Mocked to 3 for fun
    setStreak(currentStreak);
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

      const flashcards = flashcardRes.ok ? await flashcardRes.json() : { unknown: 5, hard: 2, good: 10, easy: 20, total: 37 };
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
  }, [fetchStats, updateStreak]);

  const masteredPercentage = stats.totalWords > 0
    ? Math.round((stats.easy / stats.totalWords) * 100)
    : 45; // Mock 45% for empty state

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#6EC6FF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Welcome Hero Banner */}
      <div className="bg-[#6EC6FF] p-6 md:p-8 rounded-[40px] relative overflow-hidden border-4 border-[#4BA3E3] shadow-[0_8px_0_#4BA3E3] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-4 right-20 text-white animate-float opacity-70"><Sparkles size={48} /></div>
        <div className="absolute bottom-4 left-1/3 text-white animate-cloud opacity-50"><Sparkles size={32} /></div>
        
        <div className="max-w-xl z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-bold border-2 border-white/30 mb-4 backdrop-blur-sm">
            <Trophy className="h-4 w-4 text-[#FFD93D]" fill="#FFD93D" />
            Level 1: Explorer
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-2 drop-shadow-md">
            Hi Superstar! 🌟
          </h1>
          <p className="text-white/90 text-lg font-medium mb-6 drop-shadow-sm">
            You're doing amazing! Let's learn some new words today.
          </p>
          <a
            href="#flashcards"
            onClick={() => { window.location.hash = 'flashcards'; }}
            className="inline-flex px-8 py-3 rounded-2xl bg-[#FFD93D] hover:bg-[#ffcd1a] text-[#c47b00] font-extrabold text-lg items-center gap-2 transition-transform hover:scale-105 shadow-[0_6px_0_#d49a00] hover:translate-y-1 hover:shadow-none"
          >
            Play Now <ArrowRight strokeWidth={3} className="h-5 w-5" />
          </a>
        </div>
        
        <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/40 shadow-xl backdrop-blur-sm z-10 animate-float-delayed">
           <span className="text-8xl">🦊</span>
        </div>
      </div>

      {/* Progress Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FFD93D] border-4 border-[#d49a00] rounded-3xl p-4 flex items-center gap-4 transform hover:scale-105 transition-transform cursor-pointer shadow-[0_6px_0_#d49a00]">
          <div className="p-3 bg-white/40 rounded-2xl text-[#c47b00]"><Zap size={28} fill="currentColor"/></div>
          <div>
            <div className="text-[#c47b00] font-bold text-sm">XP Points</div>
            <div className="text-2xl font-extrabold text-[#965e00]">{xp}</div>
          </div>
        </div>
        <div className="bg-[#7EE787] border-4 border-[#52c45d] rounded-3xl p-4 flex items-center gap-4 transform hover:scale-105 transition-transform cursor-pointer shadow-[0_6px_0_#52c45d]">
          <div className="p-3 bg-white/40 rounded-2xl text-[#2d8a36]"><Target size={28} fill="currentColor"/></div>
          <div>
            <div className="text-[#2d8a36] font-bold text-sm">Coins</div>
            <div className="text-2xl font-extrabold text-[#1a5c21]">{coins}</div>
          </div>
        </div>
        <div className="bg-[#FF8A65] border-4 border-[#d8633d] rounded-3xl p-4 flex items-center gap-4 transform hover:scale-105 transition-transform cursor-pointer shadow-[0_6px_0_#d8633d]">
          <div className="p-3 bg-white/40 rounded-2xl text-[#a84423]"><Calendar size={28} fill="currentColor"/></div>
          <div>
            <div className="text-[#a84423] font-bold text-sm">Day Streak</div>
            <div className="text-2xl font-extrabold text-[#7a2e15]">{streak}</div>
          </div>
        </div>
        <div className="bg-[#C8B6FF] border-4 border-[#9a86d8] rounded-3xl p-4 flex items-center gap-4 transform hover:scale-105 transition-transform cursor-pointer shadow-[0_6px_0_#9a86d8]">
          <div className="p-3 bg-white/40 rounded-2xl text-[#6b56a8]"><Star size={28} fill="currentColor"/></div>
          <div>
            <div className="text-[#6b56a8] font-bold text-sm">Stars</div>
            <div className="text-2xl font-extrabold text-[#4c3a7a]">{stars}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Circular Progress */}
        <div className="bg-white border-4 border-gray-100 p-6 rounded-[32px] md:col-span-1 flex flex-col items-center justify-center space-y-6 shadow-sm">
          <div className="text-center">
            <h3 className="font-extrabold text-xl text-gray-800">Your Progress</h3>
            <p className="text-sm font-bold text-gray-400 mt-1">Keep it up!</p>
          </div>
          
          <div className="relative h-48 w-48 flex items-center justify-center">
            <svg className="absolute transform -rotate-90 w-full h-full">
              <circle cx="96" cy="96" r="80" className="stroke-gray-100" strokeWidth="16" fill="transparent" />
              <circle
                cx="96"
                cy="96"
                r="80"
                className="stroke-[#7EE787] transition-all duration-1000 ease-out"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 80}
                strokeDashoffset={2 * Math.PI * 80 * (1 - masteredPercentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <span className="text-4xl font-extrabold text-gray-800">{masteredPercentage}%</span>
              <span className="text-sm font-bold text-gray-400 block mt-1">Mastered</span>
            </div>
          </div>

          <div className="w-full bg-[#F7F9FC] p-4 rounded-2xl border-2 border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-500">Words Learned</span>
            <span className="font-extrabold text-[#6EC6FF] text-xl">{stats.easy} / {stats.totalWords || 50}</span>
          </div>
        </div>

        {/* Feature Games */}
        <div className="bg-white border-4 border-gray-100 p-6 rounded-[32px] md:col-span-2 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xl text-gray-800">Mini Games</h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 font-bold text-xs rounded-full">Unlock more!</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <a href="#speaking-practice" onClick={() => { window.location.hash = 'speaking-practice'; }} className="group p-4 rounded-3xl bg-indigo-50 border-4 border-indigo-100 hover:border-[#C8B6FF] hover:bg-white transition-colors flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#C8B6FF] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"><Mic size={32} fill="white"/></div>
              <div>
                <h4 className="font-extrabold text-gray-800">Speak & Spell</h4>
                <p className="text-sm font-bold text-gray-500">Earn 50 XP</p>
              </div>
            </a>
            
            <a href="#flashcards" onClick={() => { window.location.hash = 'flashcards'; }} className="group p-4 rounded-3xl bg-orange-50 border-4 border-orange-100 hover:border-[#FF8A65] hover:bg-white transition-colors flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FF8A65] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"><BookMarked size={32} fill="white"/></div>
              <div>
                <h4 className="font-extrabold text-gray-800">Memory Match</h4>
                <p className="text-sm font-bold text-gray-500">Earn 40 XP</p>
              </div>
            </a>
            
            <a href="#listening" onClick={() => { window.location.hash = 'listening'; }} className="group p-4 rounded-3xl bg-yellow-50 border-4 border-yellow-100 hover:border-[#FFD93D] hover:bg-white transition-colors flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FFD93D] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"><Volume2 size={32} fill="white"/></div>
              <div>
                <h4 className="font-extrabold text-gray-800">Listen & Guess</h4>
                <p className="text-sm font-bold text-gray-500">Earn 30 XP</p>
              </div>
            </a>
            
            <a href="#quiz" onClick={() => { window.location.hash = 'quiz'; }} className="group p-4 rounded-3xl bg-green-50 border-4 border-green-100 hover:border-[#7EE787] hover:bg-white transition-colors flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#7EE787] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"><HelpCircle size={32} fill="white"/></div>
              <div>
                <h4 className="font-extrabold text-gray-800">Quiz Challenge</h4>
                <p className="text-sm font-bold text-gray-500">Earn 100 XP</p>
              </div>
            </a>

          </div>
        </div>
      </div>

    </div>
  );
}
