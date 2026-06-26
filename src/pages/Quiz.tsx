import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, Check, X, Award, RefreshCw, BookOpen, Clock, Calendar, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { handleApiError } from '../utils/apiError';

interface QuizQuestion {
  question: string;
  type: 'multiple-choice' | 'fill-in-the-blank' | 'translation';
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizHistory {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  datePlayed: string;
}

export default function Quiz() {
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Settings
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [useVocab, setUseVocab] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Active quiz gameplay state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [answersLog, setAnswersLog] = useState<{ question: string; answer: string; correct: boolean }[]>([]);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'result'>('setup');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/quiz/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch quiz history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setQuestions([]);
    setCurrentIdx(0);
    setCorrectAnswersCount(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setAnswersLog([]);

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || 'General Language Review',
          count,
          useVocabulary: useVocab,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
        setGameState('playing');
      } else {
        await handleApiError(res);
      }
    } catch (err) {
      handleApiError(new Response(null, { status: 0 }));
    } finally {
      setGenerating(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (submitted) return;
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || submitted) return;

    const currentQuestion = questions[currentIdx];
    const isCorrect = selectedAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
    }

    setAnswersLog((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        answer: selectedAnswer,
        correct: isCorrect,
      },
    ]);

    setSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    setGameState('result');
    triggerConfetti();

    // Save history to backend
    try {
      const payload = {
        topic: topic.trim() || 'General Language Review',
        score: correctAnswersCount,
        totalQuestions: questions.length,
        detailsJson: JSON.stringify(answersLog),
      };

      await fetch((import.meta.env.VITE_API_URL || '') + '/api/quiz/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      fetchHistory();
    } catch (err) {
      console.error('Failed to save quiz history:', err);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#06b6d4'],
    });
  };

  const activeQuestion = questions[currentIdx];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          AI Quiz Generator
        </h1>
        <p className="text-gray-600 mt-1">Sử dụng Google Gemini để sinh câu hỏi trắc nghiệm kiểm tra trình độ thông minh.</p>
      </div>

      {gameState === 'setup' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Setup Panel */}
          <div className="glass-card p-6 rounded-3xl md:col-span-1 space-y-4 h-fit">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-gray-900">Tạo Quiz mới</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-700 block mb-1 font-semibold">Chủ đề mong muốn</label>
                <input
                  type="text"
                  placeholder="e.g. Du lịch, Ẩn thực, hoặc Trống..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-gray-700 block mb-1 font-semibold">Số lượng câu hỏi: {count}</label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-gray-50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="vocab"
                  checked={useVocab}
                  onChange={(e) => setUseVocab(e.target.checked)}
                  className="h-4 w-4 bg-white border border-gray-200 text-indigo-500 rounded focus:ring-indigo-500"
                />
                <label htmlFor="vocab" className="text-xs text-gray-700 cursor-pointer select-none">
                  Tập trung vào bộ từ vựng cá nhân
                </label>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl text-xs transition-all duration-300 shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'AI đang soạn câu hỏi...' : 'Tạo và làm Quiz'}
              </button>
            </form>
          </div>

          {/* History Panel */}
          <div className="glass-card rounded-3xl md:col-span-2 overflow-hidden border border-gray-200 flex flex-col max-h-[50vh] md:max-h-[60vh]">
            <div className="px-6 py-4 border-b border-gray-200 bg-white/2 flex items-center gap-3">
              <Clock className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-gray-900">Lịch sử làm Quiz</h2>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center text-gray-500 space-y-2">
                  <BookOpen className="h-8 w-8 mx-auto text-gray-600" />
                  <p className="text-xs">Chưa có lượt làm bài nào.</p>
                </div>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="p-4 flex items-center justify-between text-left text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-gray-900 block truncate max-w-[200px] sm:max-w-xs">{h.topic}</span>
                      <span className="text-gray-500 text-[10px] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(h.datePlayed).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-indigo-400 text-sm">
                        {h.score} / {h.totalQuestions}
                      </span>
                      <span className="text-[10px] text-gray-500 block">đáp án đúng</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && activeQuestion && (
        <div className="max-w-2xl mx-auto glass-card p-6 md:p-8 rounded-3xl space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 font-semibold">
              <span>Câu hỏi {currentIdx + 1} / {questions.length}</span>
              <span>Đúng: {correctAnswersCount}</span>
            </div>
            <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-semibold text-indigo-400 uppercase tracking-wider">
              {activeQuestion.type}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed">{activeQuestion.question}</h2>
          </div>

          {/* Options grid */}
          <div className="space-y-3">
            {activeQuestion.options && activeQuestion.options.length > 0 ? (
              /* Multiple Choice */
              activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectOpt = opt.toLowerCase() === activeQuestion.correctAnswer.toLowerCase();
                
                let buttonStyle = 'bg-white/2 border-gray-200 hover:bg-white text-gray-800';
                
                if (submitted) {
                  if (isCorrectOpt) {
                    buttonStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold';
                  } else if (isSelected) {
                    buttonStyle = 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold';
                  } else {
                    buttonStyle = 'bg-white/1 border-white/2 text-gray-500 opacity-60';
                  }
                } else if (isSelected) {
                  buttonStyle = 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-semibold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(opt)}
                    className={`w-full p-4 rounded-xl text-left text-xs transition-all border flex items-center justify-between cursor-pointer ${buttonStyle}`}
                  >
                    <span>{opt}</span>
                    {submitted && isCorrectOpt && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                    {submitted && isSelected && !isCorrectOpt && <X className="h-4 w-4 shrink-0 text-rose-400" />}
                  </button>
                );
              })
            ) : (
              /* Input Field for translation or blanks */
              <div className="space-y-3">
                <input
                  type="text"
                  value={selectedAnswer || ''}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  disabled={submitted}
                />
                {submitted && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono">
                    Đáp án đúng: "{activeQuestion.correctAnswer}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Explanation Details */}
          {submitted && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-1 animate-fade-in">
              <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" /> Giải thích cấu trúc ngữ pháp
              </span>
              <p className="text-xs text-gray-700 leading-relaxed">{activeQuestion.explanation}</p>
            </div>
          )}

          {/* Bottom command console */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            {!submitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all duration-300 cursor-pointer shadow-lg shadow-indigo-500/15"
              >
                Gửi câu trả lời
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-semibold rounded-xl text-xs transition-all duration-300 cursor-pointer"
              >
                {currentIdx + 1 < questions.length ? 'Câu tiếp theo' : 'Xem kết quả'}
              </button>
            )}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-8 animate-fade-in">
          <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full inline-block">
            <Award className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Kết quả bài Quiz</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Bạn đã trả lời đúng <span className="text-indigo-400 font-bold">{correctAnswersCount} / {questions.length}</span> câu hỏi.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setGameState('setup')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-all duration-300 cursor-pointer shadow-lg shadow-indigo-500/15"
            >
              <RefreshCw className="h-4 w-4" />
              Làm lượt mới
            </button>
            <a
              href="#dashboard"
              onClick={() => window.location.hash = 'dashboard'}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-medium py-2.5 px-5 rounded-xl text-sm transition-all duration-300 cursor-pointer"
            >
              Về trang chủ
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
