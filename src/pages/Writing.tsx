import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Plus, Search, Trash2, Edit2, Play, Sparkles,
  Upload, Check, X, CheckCircle, Clock, Save, FileText, UploadCloud,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { globalShowApiError } from '../App';

interface WritingTopic {
  id: string;
  title: string;
  description: string;
  level: string;
  createdAt: string;
}

interface WritingHistory {
  id: string;
  topicId: string;
  topicTitle: string;
  submittedText: string;
  score: number;
  feedbackJson: string;
  targetLevel: string;
  submittedAt: string;
}

export default function Writing() {
  const [topics, setTopics] = useState<WritingTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<WritingTopic | null>(null);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);

  // Practice State
  const [userInput, setUserInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [histories, setHistories] = useState<WritingHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Modal State for Topic
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: '', title: '', description: '', level: 'Intermediate' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTopics();
    fetchHistories();
  }, []);

  useEffect(() => {
    // Reset state when topic changes
    setUserInput('');
    setEvaluationResult(null);
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/writing', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
        if (data.length > 0 && !selectedTopic) {
          setSelectedTopic(data[0]);
        } else if (data.length === 0) {
          setForm({ id: '', title: '', description: '', level: 'Intermediate' });
          setIsModalOpen(true);
        }
      } else {
        if (globalShowApiError) globalShowApiError?.({ message: 'Failed to load topics' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistories = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/writing/history', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        const data = await res.json();
        setHistories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTopics = topics.filter(t =>
    (t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())) &&
    (selectedLevel === '' || t.level === selectedLevel)
  );

  const handleSaveTopic = async () => {
    try {
      const isEdit = !!form.id;
      const url = isEdit ? `/api/writing/${form.id}` : '/api/writing';
      const method = isEdit ? 'PUT' : 'POST';

      const payload: any = { ...form };
      if (!isEdit) {
        delete payload.id;
      }

      const res = await fetch((import.meta.env.VITE_API_URL || '') + url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedTopic = await res.json();
        setIsModalOpen(false);
        fetchTopics();

        if (isEdit && selectedTopic?.id === form.id) {
          setSelectedTopic(savedTopic);
        } else if (!isEdit) {
          setSelectedTopic(savedTopic);
        }

        setForm({ id: '', title: '', description: '', level: 'Intermediate' });
      } else {
        const err = await res.text();
        globalShowApiError?.({ message: err || `Failed to save topic` });
      }
    } catch (err) {
      console.error(err);
      globalShowApiError?.({ message: 'Could not save topic' });
    }
  };

  const confirmDelete = async () => {
    if (!topicToDelete) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/writing/${topicToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchTopics();
        if (selectedTopic?.id === topicToDelete) setSelectedTopic(null);
      } else {
        const err = await res.text();
        globalShowApiError?.({ message: err || 'Không thể xóa chủ đề' });
      }
    } catch (err) {
      console.error(err);
      globalShowApiError?.({ message: 'Lỗi kết nối khi xóa chủ đề' });
    } finally {
      setTopicToDelete(null);
    }
  };

  const handleDelete = (id: string) => {
    setTopicToDelete(id);
  };

  const openEditModal = (t: WritingTopic) => {
    setForm({ id: t.id, title: t.title, description: t.description, level: t.level });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processData = async (data: any[]) => {
      try {
        const topicsToAdd = [];
        
        let startIndex = 0;
        if (data.length > 0 && data[0].length > 0 && 
           (String(data[0][0]).toLowerCase().includes('chủ đề') || String(data[0][0]).toLowerCase().includes('topic'))) {
          startIndex = 1;
        }

        for (let i = startIndex; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 2) continue;
          
          topicsToAdd.push({
            title: String(row[0] || 'Untitled').trim(),
            description: String(row[1] || '').trim(),
            level: String(row[2] || 'Intermediate').trim()
          });
        }

        if (topicsToAdd.length === 0) {
          globalShowApiError?.({ message: 'Không tìm thấy dữ liệu hợp lệ trong file' });
          return;
        }

        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/writing/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(topicsToAdd)
        });

        if (res.ok) {
          fetchTopics();
          if (fileInputRef.current) fileInputRef.current.value = '';
          alert(`Đã import thành công ${topicsToAdd.length} chủ đề!`);
        } else {
          globalShowApiError?.({ message: 'Lỗi khi import chủ đề' });
        }
      } catch (err) {
        console.error(err);
        globalShowApiError?.({ message: 'Lỗi xử lý file' });
      }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          processData(jsonData as any[]);
        } catch (err) {
          console.error(err);
          globalShowApiError?.({ message: 'Không thể đọc file Excel' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split('\n');
          const data = [];
          for (const line of lines) {
            const l = line.trim();
            if (!l) continue;
            let separator = ',';
            if (l.includes('|')) separator = '|';
            else if (l.includes('\t')) separator = '\t';

            const row = l.split(new RegExp(`\\s*${separator}\\s*(?=(?:(?:[^"]*"){2})*[^"]*$)`));
            const cleanRow = row.map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
            data.push(cleanRow);
          }
          processData(data);
        } catch (err) {
          console.error(err);
          globalShowApiError?.({ message: 'Lỗi khi đọc file text/csv' });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedTopic || !userInput.trim()) return;

    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/writing/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          topicTitle: selectedTopic.title,
          submittedText: userInput
        })
      });

      if (res.ok) {
        const history: WritingHistory = await res.json();
        setEvaluationResult(JSON.parse(history.feedbackJson));
        fetchHistories();
      } else {
        const err = await res.text();
        if (globalShowApiError) globalShowApiError?.({ message: 'Error evaluating: ' + err });
      }
    } catch (err) {
      console.error(err);
      if (globalShowApiError) globalShowApiError?.({ message: 'Network error evaluating writing.' });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 animate-fade-in">
      {/* Left Sidebar - Topic List */}
      <div className="w-1/3 flex flex-col gap-4">
        {/* Header & Actions */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-pink-400" />
              Luyện Viết
            </h2>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv,.txt,.tsv,.xlsx,.xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-emerald-500 transition-colors"
                title="Import Chủ Đề (Excel, CSV)"
              >
                <UploadCloud className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                title="Lịch sử viết"
              >
                <Clock className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setForm({ id: '', title: '', description: '', level: 'Intermediate' });
                  setIsModalOpen(true);
                }}
                className="p-2 rounded-xl bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors"
                title="Thêm Chủ Đề"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
            <input
              type="text"
              placeholder="Tìm chủ đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-none focus:border-pink-500/50"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedLevel === lvl
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  : 'bg-white text-gray-600 hover:text-gray-800 border border-transparent'
                  }`}
              >
                {lvl === '' ? 'Tất cả' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Topic List */}
        <div className="glass-card rounded-2xl flex-1 overflow-y-auto p-3 space-y-2">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className={`group p-4 rounded-xl cursor-pointer border transition-all duration-200 ${selectedTopic?.id === topic.id
                ? 'bg-pink-500/10 border-pink-500/30 shadow-lg shadow-pink-500/5'
                : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold text-sm ${selectedTopic?.id === topic.id ? 'text-pink-400' : 'text-gray-800'}`}>
                  {topic.title}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-50 text-gray-700">
                  {topic.level}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{topic.description}</p>

              <div className="mt-3 flex justify-end gap-2 border-t border-gray-200 pt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditModal(topic); }}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-indigo-400 transition-colors flex items-center gap-1 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Sửa
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(topic.id); }}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa
                </button>
              </div>
            </div>
          ))}
          {filteredTopics.length === 0 && (
            <div className="text-center p-8 text-gray-500 text-sm">
              Không tìm thấy chủ đề nào.
            </div>
          )}
        </div>
      </div>

      {/* Right Content - Workspace */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {selectedTopic ? (
          <>
            {/* Topic Details */}
            <div className="glass-card p-6 rounded-2xl flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTopic.title}</h2>
                <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold border border-pink-500/20">
                  Mục tiêu: {selectedTopic.level}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed bg-black/20 p-4 rounded-xl border border-gray-200">
                {selectedTopic.description}
              </p>
            </div>

            {/* Writing Area */}
            <div className="glass-card p-6 rounded-2xl flex-1 flex flex-col min-h-0 relative">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-pink-400" />
                  Bài viết của bạn:
                </label>
                <span className="text-xs text-gray-500 font-mono">
                  {userInput.trim().split(/\s+/).filter(Boolean).length} từ
                </span>
              </div>

              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-pink-500/50 transition-colors resize-none text-gray-800 leading-relaxed font-sans shadow-inner placeholder:text-gray-600 mb-4"
                placeholder="Bắt đầu viết tại đây..."
                disabled={isEvaluating}
              />

              <div className="flex justify-end">
                <button
                  onClick={handleEvaluate}
                  disabled={!userInput.trim() || isEvaluating}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-medium py-2.5 px-6 rounded-xl text-sm transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {isEvaluating ? (
                    <>
                      <div className="animate-spin h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full" />
                      AI đang chấm điểm...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5" />
                      Nộp bài & Nhận xét
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Evaluation Results */}
            {evaluationResult && (
              <div className="glass-card p-6 rounded-2xl flex-shrink-0 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 max-h-96 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative h-16 w-16 flex items-center justify-center flex-shrink-0">
                    <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" className="stroke-white/5" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="32" cy="32" r="28"
                        className={`stroke-indigo-500 transition-all duration-1000 ease-out`}
                        strokeWidth="6" fill="transparent"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - (evaluationResult.score || 0) / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-xl font-bold text-gray-900 absolute">{evaluationResult.score}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Nhận xét từ AI</h3>
                    <p className="text-sm text-gray-700 mt-1">{evaluationResult.generalFeedback}</p>
                  </div>
                </div>

                {evaluationResult.grammarMistakes?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-3">
                      <X className="h-4 w-4" />
                      Lỗi Ngữ Pháp & Sửa Lỗi
                    </h4>
                    <div className="space-y-3">
                      {evaluationResult.grammarMistakes.map((mistake: any, idx: number) => (
                        <div key={idx} className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl text-sm">
                          <div className="flex flex-col gap-1 mb-2">
                            <span className="line-through text-rose-400">{mistake.mistake}</span>
                            <span className="text-emerald-400 font-medium">→ {mistake.correction}</span>
                          </div>
                          <p className="text-xs text-gray-600 bg-black/20 p-2 rounded-lg">{mistake.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {evaluationResult.vocabularySuggestions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4" />
                      Gợi ý Từ vựng (Nâng cao)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {evaluationResult.vocabularySuggestions.map((vocab: any, idx: number) => (
                        <div key={idx} className="bg-cyan-500/5 border border-cyan-500/10 p-3 rounded-xl text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-600">{vocab.original}</span>
                            <ArrowRight className="h-3 w-3 text-gray-600" />
                            <span className="text-cyan-400 font-bold">{vocab.suggestion}</span>
                          </div>
                          <p className="text-[10px] text-gray-500">{vocab.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="glass-card flex-1 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-gray-600">
            <div className="p-6 bg-white rounded-full mb-4">
              <FileText className="h-12 w-12 text-pink-400/50" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Luyện Viết AI</h3>
            <p className="max-w-md text-sm leading-relaxed">
              Chọn một chủ đề bên trái để bắt đầu luyện viết. AI sẽ đánh giá bài viết của bạn theo tiêu chuẩn cấp độ đã chọn, chỉ ra lỗi ngữ pháp và gợi ý từ vựng nâng cao.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Topic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative border border-gray-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {form.id ? 'Sửa Chủ Đề' : 'Thêm Chủ Đề Mới'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Tên chủ đề</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 text-gray-900 placeholder:text-gray-600"
                  placeholder="Vd: The impact of climate change"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Mô tả / Yêu cầu đề bài</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full h-32 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 text-gray-900 placeholder:text-gray-600 resize-none"
                  placeholder="Chi tiết đề bài..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Cấp độ</label>
                <select
                  value={form.level}
                  onChange={e => setForm({ ...form, level: e.target.value })}
                  className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/20 text-indigo-700 cursor-pointer shadow-sm hover:bg-indigo-100 transition-colors"
                >
                  <option value="Beginner">Beginner (A1-A2)</option>
                  <option value="Intermediate">Intermediate (B1-B2)</option>
                  <option value="Advanced">Advanced (C1-C2)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-medium text-sm transition-colors border border-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveTopic}
                  disabled={!form.title || !form.description}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-medium text-sm transition-colors shadow-lg shadow-pink-500/20 disabled:opacity-50"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] rounded-3xl p-6 md:p-8 shadow-2xl relative border border-gray-200 flex flex-col">
            <button
              onClick={() => setShowHistory(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Clock className="h-6 w-6 text-pink-400" />
              Lịch sử bài viết
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {histories.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  Bạn chưa có bài viết nào.
                </div>
              ) : (
                histories.map(h => (
                  <div key={h.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-gray-900 font-bold">{h.topicTitle}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(h.submittedAt).toLocaleString()} • {h.targetLevel}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg font-bold">
                        Điểm: {h.score}
                      </div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl text-sm text-gray-700 line-clamp-3 mb-3">
                      {h.submittedText}
                    </div>
                    <button
                      onClick={() => {
                        const parsed = JSON.parse(h.feedbackJson);
                        alert(parsed.generalFeedback || 'Không có nhận xét chi tiết');
                      }}
                      className="text-xs text-pink-400 hover:underline"
                    >
                      Xem nhận xét chung
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {topicToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-200 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xóa Chủ Đề</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa chủ đề này? Tất cả lịch sử bài làm liên quan cũng sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTopicToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-medium text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition-colors shadow-lg shadow-rose-500/20"
              >
                Đồng ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
