import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Volume2, Tag, Edit, Trash2, Check, X, BookOpen, AlertCircle, Sparkles, RefreshCw, ChevronLeft, ChevronRight, UploadCloud, FileSpreadsheet } from 'lucide-react';
import { logErrorToBackend } from '../utils/logger';

interface Vocabulary {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  notes: string;
  status: string;
  tags: string;
  nextReviewDate: string;
}

export default function Vocabulary() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    word: '',
    pronunciation: '',
    meaning: '',
    example: '',
    exampleTranslation: '',
    notes: '',
    tags: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Extract from Document State
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractText, setExtractText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // New States for Excel Import
  const [extractTab, setExtractTab] = useState<'text' | 'excel'>('text');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // AI Autofill States
  const [autofillingIds, setAutofillingIds] = useState<Record<string, boolean>>({});
  const [isFormAutofilling, setIsFormAutofilling] = useState(false);

  // Custom Delete Confirm State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteWord, setDeleteWord] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;

  const handleAutofill = async (id: string) => {
    setAutofillingIds(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/vocabulary/${id}/autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const updated = await res.json();
        setVocabularies(prev => prev.map(v => v.id === id ? updated : v));
        showFeedback('AI cập nhật từ vựng thành công!', 'success');
      } else {
        const text = await res.text();
        showFeedback(`Lỗi AI dịch: ${text}`, 'error');
      }
    } catch (err) {
      logErrorToBackend(err, 'Vocabulary.handleAutofill');
      showFeedback('Không thể kết nối đến máy chủ.', 'error');
    } finally {
      setAutofillingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleFormAutofill = async () => {
    if (!form.word.trim()) {
      setErrorMsg('Vui lòng nhập Từ mới trước khi dịch bằng AI.');
      return;
    }
    setIsFormAutofilling(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/vocabulary/lookup?word=${encodeURIComponent(form.word.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          pronunciation: data.pronunciation || prev.pronunciation,
          meaning: data.meaning || prev.meaning,
          example: data.example || prev.example,
          exampleTranslation: data.exampleTranslation || prev.exampleTranslation,
        }));
      } else {
        const text = await res.text();
        setErrorMsg(`AI không dịch được từ này: ${text}`);
      }
    } catch (err) {
      logErrorToBackend(err, 'Vocabulary.handleFormAutofill');
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsFormAutofilling(false);
    }
  };

  const targetLang = localStorage.getItem('learn_target_lang') || 'en';

  useEffect(() => {
    fetchVocabularies(currentPage);
  }, [currentPage, search, selectedTag, selectedStatus]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchVocabularies = async (page = 1) => {
    try {
      setLoading(true);
      let url = `/api/vocabulary?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`;
      if (selectedTag) url += `&tag=${encodeURIComponent(selectedTag)}`;
      if (selectedStatus) url += `&status=${encodeURIComponent(selectedStatus)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVocabularies(data.items || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || 1);
        setTotalItems(data.totalItems || 0);
      }
    } catch (err) {
      logErrorToBackend(err, 'Vocabulary.fetchVocabularies');
      console.error('Failed to fetch vocabularies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/vocabulary/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (err) {
      logErrorToBackend(err, 'Vocabulary.fetchTags');
      console.error('Failed to fetch tags:', err);
    }
  };

  const handleSpeak = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(word);
      
      // Select appropriate voice language
      if (targetLang === 'ja') {
        utterance.lang = 'ja-JP';
      } else if (targetLang === 'zh') {
        utterance.lang = 'zh-CN';
      } else {
        utterance.lang = 'en-US';
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt của bạn không hỗ trợ Text-to-Speech.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      word: '',
      pronunciation: '',
      meaning: '',
      example: '',
      exampleTranslation: '',
      notes: '',
      tags: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Vocabulary) => {
    setEditingId(item.id);
    setForm({
      word: item.word,
      pronunciation: item.pronunciation,
      meaning: item.meaning,
      example: item.example,
      exampleTranslation: item.exampleTranslation,
      notes: item.notes,
      tags: item.tags,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/vocabulary/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback('Xóa từ vựng thành công!', 'success');
        const nextPage = vocabularies.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        if (nextPage !== currentPage) {
          setCurrentPage(nextPage);
        } else {
          fetchVocabularies(currentPage);
        }
        fetchTags();
      }
    } catch (err) {
      logErrorToBackend(err, 'Vocabulary.handleDelete');
      showFeedback('Không thể kết nối đến máy chủ để xóa.', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.word.trim() || !form.meaning.trim()) {
      setErrorMsg('Vui lòng nhập Từ mới và Ý nghĩa.');
      return;
    }

    try {
      const url = editingId ? `/api/vocabulary/${editingId}` : '/api/vocabulary';
      const method = editingId ? 'PUT' : 'POST';
      const bodyData = editingId 
        ? { id: editingId, ...form, status: vocabularies.find(v => v.id === editingId)?.status || 'New' }
        : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        showFeedback(editingId ? 'Cập nhật thành công!' : 'Thêm từ mới thành công!', 'success');
        setIsModalOpen(false);
        if (editingId) {
          fetchVocabularies(currentPage);
        } else {
          setCurrentPage(1);
          fetchVocabularies(1);
        }
        fetchTags();
      } else {
        const text = await res.text();
        setErrorMsg(`Lỗi từ máy chủ: ${text}`);
      }
    } catch (err) {
      logErrorToBackend(err, 'Vocabulary.handleSave');
      setErrorMsg('Không thể kết nối đến máy chủ.');
    }
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractText.trim()) {
      setErrorMsg('Vui lòng dán văn bản vào ô trống.');
      return;
    }

    setIsExtracting(true);
    setErrorMsg('');

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/vocabulary/extract-from-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractText }),
      });

      if (res.ok) {
        const data = await res.json();
        showFeedback(`Trích xuất và lưu thành công ${data.length} từ vựng mới!`, 'success');
        setIsExtractModalOpen(false);
        setExtractText('');
        fetchVocabularies();
        fetchTags();
      } else {
        const text = await res.text();
        setErrorMsg(`Lỗi từ máy chủ: ${text}`);
      }
    } catch (err) {
      logErrorToBackend(err, 'Vocabulary.handleExtract');
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setExcelFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || 
                      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.type === 'application/vnd.ms-excel';
      if (isExcel) {
        setExcelFile(file);
        setErrorMsg('');
      } else {
        setErrorMsg('Chỉ hỗ trợ tệp tin Excel (.xlsx, .xls).');
      }
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setErrorMsg('Vui lòng chọn hoặc kéo thả tệp Excel vào vùng tải lên.');
      return;
    }

    setIsExtracting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', excelFile);

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/vocabulary/import-excel', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        showFeedback(`Trích xuất và nhập thành công ${data.length} từ vựng từ Excel!`, 'success');
        setIsExtractModalOpen(false);
        setExcelFile(null);
        fetchVocabularies();
        fetchTags();
      } else {
        const text = await res.text();
        setErrorMsg(`Lỗi từ máy chủ: ${text}`);
      }
    } catch (err) {
      logErrorToBackend(err, 'Vocabulary.handleImportExcel');
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsExtracting(false);
    }
  };

  const showFeedback = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(msg);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Sổ tay Từ vựng
          </h1>
          <p className="text-gray-600 mt-1">Lưu trữ, tra cứu và quản lý các từ vựng ngôn ngữ của bạn.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => { setIsExtractModalOpen(true); setErrorMsg(''); setExtractText(''); setExtractTab('text'); setExcelFile(null); }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-teal-500/15 cursor-pointer"
          >
            <Sparkles className="h-4.5 w-4.5" />
            AI Trích xuất
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Thêm từ mới
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <Check className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm từ hoặc nghĩa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-600">
            <Filter className="h-3.5 w-3.5" />
            Lọc:
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50 text-gray-700"
          >
            <option value="" className="bg-bg-dark">Tất cả trạng thái</option>
            <option value="unknown" className="bg-bg-dark">Chưa biết (Unknown)</option>
            <option value="hard" className="bg-bg-dark">Khó (Hard)</option>
            <option value="good" className="bg-bg-dark">Nhớ (Good)</option>
            <option value="easy" className="bg-bg-dark">Đã thuộc (Easy)</option>
          </select>

          <select
            value={selectedTag}
            onChange={(e) => { setSelectedTag(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50 text-gray-700 max-w-[150px]"
          >
            <option value="" className="bg-bg-dark">Tất cả Tag</option>
            {tags.map((t) => (
              <option key={t} value={t} className="bg-bg-dark">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vocabularies List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : vocabularies.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl space-y-3">
          <div className="p-4 bg-white border border-gray-200 rounded-full inline-block text-gray-500">
            <BookOpen className="h-8 w-8" />
          </div>
          <p className="text-gray-600 text-sm">Không tìm thấy từ vựng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vocabularies.map((item) => (
            <div key={item.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900 font-mono">{item.word}</h3>
                      <button
                        onClick={() => handleSpeak(item.word)}
                        className="p-1 rounded bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAutofill(item.id)}
                        disabled={autofillingIds[item.id]}
                        className={`p-1 rounded bg-white hover:bg-gray-50 transition-all cursor-pointer relative ${
                          autofillingIds[item.id] ? 'text-teal-400' : 'text-teal-400 hover:text-teal-300'
                        }`}
                        title="AI cập nhật chi tiết"
                      >
                        {autofillingIds[item.id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className={`h-4 w-4 ${item.meaning === '(Đang cập nhật)' ? 'animate-pulse text-teal-400' : ''}`} />
                            {item.meaning === '(Đang cập nhật)' && (
                              <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                    {item.pronunciation && (
                      <span className="text-xs text-indigo-400 font-mono block">{item.pronunciation}</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    item.status === 'easy' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : item.status === 'good' 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      : item.status === 'hard'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                  }`}>
                    {item.status === 'easy' ? 'Đã thuộc (Easy)' : item.status === 'good' ? 'Nhớ (Good)' : item.status === 'hard' ? 'Khó (Hard)' : 'Chưa biết (Unknown)'}
                  </span>
                </div>

                <p className="text-sm text-gray-800 font-medium leading-relaxed">{item.meaning}</p>

                {(item.example || item.notes) && (
                  <div className="border-t border-gray-200 pt-2.5 mt-2.5 space-y-1.5">
                    {item.example && (
                      <div className="text-xs text-gray-600 italic leading-relaxed">
                        <span className="font-semibold not-italic text-gray-900">Ví dụ: </span>
                        {item.example}
                        {item.exampleTranslation && (
                          <span className="block text-gray-500 mt-0.5 font-normal not-italic">{item.exampleTranslation}</span>
                        )}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[11px] text-indigo-300 leading-relaxed bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                        <span className="font-semibold block text-indigo-200">Ghi chú:</span>
                        {item.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3">
                <div className="flex flex-wrap gap-1">
                  {item.tags.split(',').filter(Boolean).map((t, idx) => (
                    <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[9px] text-gray-600">
                      <Tag className="h-2 w-2" />
                      {t.trim()}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition-colors cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(item.id);
                      setDeleteWord(item.word);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination UI */}
      {vocabularies.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
          <span className="text-xs text-gray-600">
            Hiển thị từ thứ <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> đến{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{' '}
            trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> từ vựng
          </span>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Render số trang */}
            {(() => {
              const pages = [];
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
                    className={`h-9 w-9 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      currentPage === 1
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 border-indigo-500 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(
                    <span key="dots-start" className="text-gray-600 px-1 text-xs">
                      ...
                    </span>
                  );
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`h-9 w-9 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      currentPage === i
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 border-indigo-500/30 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {i}
                  </button>
                );
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="dots-end" className="text-gray-600 px-1 text-xs">
                      ...
                    </span>
                  );
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className={`h-9 w-9 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      currentPage === totalPages
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 border-indigo-500 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Chỉnh sửa từ vựng' : 'Thêm từ mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-semibold">Từ mới *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={form.word}
                      onChange={(e) => setForm({ ...form, word: e.target.value })}
                      className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="e.g. Serendipity"
                    />
                    <button
                      type="button"
                      onClick={handleFormAutofill}
                      disabled={isFormAutofilling}
                      className="px-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      title="AI dịch tự động"
                    >
                      {isFormAutofilling ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>Dịch</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-semibold">Phiên âm</label>
                  <input
                    type="text"
                    value={form.pronunciation}
                    onChange={(e) => setForm({ ...form, pronunciation: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. /ˌserənˈdipədē/"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-700 block mb-1 font-semibold">Ý nghĩa *</label>
                <textarea
                  required
                  rows={2}
                  value={form.meaning}
                  onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="e.g. Sự tình cờ may mắn"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-semibold">Ví dụ (Câu gốc)</label>
                  <input
                    type="text"
                    value={form.example}
                    onChange={(e) => setForm({ ...form, example: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. We met by serendipity."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-semibold">Ví dụ (Bản dịch)</label>
                  <input
                    type="text"
                    value={form.exampleTranslation}
                    onChange={(e) => setForm({ ...form, exampleTranslation: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Chúng tôi gặp nhau do tình cờ."
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-700 block mb-1 font-semibold">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Thêm giải nghĩa, cụm đi kèm hoặc từ đồng nghĩa..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-700 block mb-1 font-semibold">Tags (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. IELTS, Business, N5"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-xl text-sm transition-colors border border-gray-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-indigo-500/10"
                >
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Extract Modal */}
      {isExtractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-400" />
                AI Trích xuất Từ vựng
              </h2>
              <button
                onClick={() => !isExtracting && setIsExtractModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Switching headers */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                type="button"
                onClick={() => !isExtracting && setExtractTab('text')}
                className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  extractTab === 'text'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Dán văn bản
              </button>
              <button
                type="button"
                onClick={() => !isExtracting && setExtractTab('excel')}
                className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  extractTab === 'excel'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Tải lên Excel
              </button>
            </div>

            {extractTab === 'text' ? (
              <form onSubmit={handleExtract} className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Dán một đoạn văn bản hoặc tài liệu vào đây. AI sẽ tự động đọc, trích xuất tất cả từ vựng nổi bật và lưu thẳng vào Sổ tay của bạn.
                </p>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div>
                  <textarea
                    required
                    rows={8}
                    value={extractText}
                    onChange={(e) => setExtractText(e.target.value)}
                    disabled={isExtracting}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors resize-none disabled:opacity-50 text-gray-800"
                    placeholder="Paste your English text here..."
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsExtractModalOpen(false)}
                    disabled={isExtracting}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-xl text-sm transition-colors border border-gray-200 cursor-pointer disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isExtracting}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-teal-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isExtracting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'Trích xuất & Lưu'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleImportExcel} className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Tải lên tệp tài liệu Excel chứa danh sách từ vựng. Hệ thống sẽ tự động phân tích các cột: Từ vựng (Word), Phiên âm (Pronunciation), và Ý nghĩa (Meaning) để nhập vào.
                </p>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-teal-500 bg-teal-500/5'
                      : excelFile
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : 'border-gray-200 hover:border-teal-500/50 bg-white'
                  }`}
                  onClick={() => document.getElementById('excel-file-input')?.click()}
                >
                  <input
                    id="excel-file-input"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isExtracting}
                  />
                  {excelFile ? (
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 max-w-[250px] mx-auto truncate">
                          {excelFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(excelFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExcelFile(null);
                        }}
                        disabled={isExtracting}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                      >
                        Chọn tệp khác
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-teal-400">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Kéo thả tệp Excel vào đây hoặc click để chọn
                        </p>
                        <p className="text-xs text-gray-500">
                          Chỉ hỗ trợ tệp định dạng Excel (.xlsx, .xls) tối đa 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsExtractModalOpen(false)}
                    disabled={isExtracting}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-xl text-sm transition-colors border border-gray-200 cursor-pointer disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isExtracting || !excelFile}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-teal-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isExtracting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'Nhập từ vựng'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteConfirmOpen && deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-4 animate-zoom-in text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 font-sans">Xóa từ vựng?</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                Bạn có chắc chắn muốn xóa từ <span className="font-semibold text-gray-900">"{deleteWord}"</span> khỏi sổ tay không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-xl text-sm transition-colors border border-gray-200 cursor-pointer font-sans"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteId);
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
