import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Save, Edit, Trash2, X, Eye, FileText, ChevronRight, Table, Code, Quote, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { logErrorToBackend } from '../utils/logger';

interface GrammarNote {
  id: string;
  title: string;
  content: string;
  level: string;
  createdAt: string;
  updatedAt: string;
}

export default function GrammarNotes() {
  const [notes, setNotes] = useState<GrammarNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<GrammarNote | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  // Editor mode state
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    level: 'Intermediate',
    content: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Delete Confirm State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [search, selectedLevel]);

  const fetchNotes = async () => {
    try {
      let url = `/api/grammar?search=${encodeURIComponent(search)}`;
      if (selectedLevel) url += `&level=${encodeURIComponent(selectedLevel)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length > 0 && !selectedNote && !isEditing) {
          setSelectedNote(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch grammar notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setForm({
      title: '',
      level: 'Intermediate',
      content: '',
    });
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleStartEdit = (note: GrammarNote) => {
    setEditingId(note.id);
    setForm({
      title: note.title,
      level: note.level,
      content: note.content,
    });
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/grammar/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIsEditing(false);
        setSelectedNote(null);
        fetchNotes();
      }
    } catch (err) {
      logErrorToBackend(err, 'GrammarNotes.handleDelete');
      console.error('Failed to delete grammar note:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tiêu đề và nội dung bài học.');
      return;
    }

    try {
      const url = editingId ? `/api/grammar/${editingId}` : '/api/grammar';
      const method = editingId ? 'PUT' : 'POST';
      const bodyData = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchNotes().then(() => {
          if (editingId) {
            // Re-select the updated note
            const updated = notes.find((n) => n.id === editingId);
            if (updated) setSelectedNote({ ...updated, ...form });
          }
        });
      } else {
        const text = await res.text();
        setErrorMsg(`Lỗi từ máy chủ: ${text}`);
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    }
  };

  const levels = ['Basic', 'Intermediate', 'Advanced', 'N5', 'N4', 'N3', 'N2', 'N1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS'];

  // Custom markdown components for rich rendering
  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="flex items-center gap-2 text-xl font-extrabold text-white mt-6 mb-3 pb-2 border-b border-indigo-500/30">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 text-xs font-bold shrink-0">H1</span>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="flex items-center gap-2 text-lg font-bold text-indigo-300 mt-5 mb-2.5 pb-1.5 border-b border-white/10">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-500/15 text-indigo-400 text-[10px] font-bold shrink-0">H2</span>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="flex items-center gap-2 text-base font-semibold text-cyan-300 mt-4 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-0.5" />
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-violet-300 mt-3 mb-1.5">
        <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
        {children}
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-300 text-sm leading-relaxed my-2">{children}</p>
    ),
    strong: ({ children }: any) => (
      <strong className="font-bold text-white">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-cyan-200">{children}</em>
    ),
    code: ({ inline, children }: any) =>
      inline ? (
        <code className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[12px] font-mono">
          {children}
        </code>
      ) : (
        <div className="relative my-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border-b border-white/10 rounded-t-xl">
            <Code className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Code</span>
          </div>
          <pre className="bg-[#0d1117] rounded-b-xl px-4 py-3 overflow-x-auto border border-white/10 border-t-0">
            <code className="text-emerald-300 text-xs font-mono leading-relaxed">{children}</code>
          </pre>
        </div>
      ),
    blockquote: ({ children }: any) => (
      <blockquote className="my-3 flex gap-3 p-3.5 rounded-xl bg-amber-500/8 border-l-4 border-amber-400/60 border border-amber-500/15">
        <Quote className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-amber-200 text-sm leading-relaxed [&>p]:my-0">{children}</div>
      </blockquote>
    ),
    ul: ({ children }: any) => (
      <ul className="my-2 space-y-1 pl-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="my-2 space-y-1 pl-1 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children, ordered }: any) => (
      <li className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
        {!ordered && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
        <span>{children}</span>
      </li>
    ),
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-indigo-500/15 border-b border-indigo-500/30">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-white/5">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-white/3 transition-colors">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2.5 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2.5 text-gray-300 text-xs leading-relaxed">{children}</td>
    ),
    hr: () => (
      <hr className="my-4 border-white/10" />
    ),
    a: ({ children, href }: any) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
        {children}
      </a>
    ),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Ghi chú Ngữ pháp
          </h1>
          <p className="text-gray-400 mt-1">Lưu trữ các cấu trúc ngữ pháp và tra cứu dạng bài viết Markdown.</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleStartAdd}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-indigo-500/15 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" />
            Tạo bài học mới
          </button>
        )}
      </div>

      {isEditing ? (
        /* Markdown Editor and Live Preview Panel */
        <div className="glass-card rounded-3xl overflow-hidden border border-white/10 flex flex-col h-[75vh]">
          <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-white/2">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                {editingId ? 'Chỉnh sửa bài học' : 'Soạn bài học mới'}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer border border-white/5"
              >
                <X className="h-3.5 w-3.5" /> Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1.5 px-4 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> Lưu bài viết
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4 border-b border-white/5 bg-white/1 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Tiêu đề bài học</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. Thì Hiện tại đơn vs Hiện tại tiếp diễn"
              />
            </div>
            <div className="w-full md:w-1/4">
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Cấp độ (Level)</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {levels.map((l) => (
                  <option key={l} value={l} className="bg-bg-dark text-white">
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Side by side editor */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 overflow-hidden">
            {/* Left side editor */}
            <div className="flex flex-col p-4 overflow-hidden h-full">
              <div className="flex flex-col gap-2 pb-2 mb-2 border-b border-white/5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Soạn thảo Markdown</span>
                <div className="flex items-center flex-wrap gap-1">
                  {[
                    { label: 'H2', title: 'Tiêu đề', insert: '## ' },
                    { label: 'H3', title: 'Tiêu đề nhỏ', insert: '### ' },
                    { label: <strong className="text-[10px] not-italic">B</strong>, title: 'In đậm', insert: '**text**' },
                    { label: <em className="text-[10px]">I</em>, title: 'In nghiêng', insert: '*text*' },
                    { label: <Code className="h-3 w-3" />, title: 'Inline code', insert: '`code`' },
                    { label: <List className="h-3 w-3" />, title: 'Danh sách', insert: '- item\n- item\n- item' },
                    { label: <Table className="h-3 w-3" />, title: 'Chèn bảng', insert: '| Cột 1 | Cột 2 | Cột 3 |\n|-------|-------|-------|\n| A     | B     | C     |\n| D     | E     | F     |' },
                    { label: <Quote className="h-3 w-3" />, title: 'Ghi chú/Lưu ý', insert: '> Lưu ý quan trọng' },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      title={btn.title}
                      onClick={() => setForm(prev => ({ ...prev, content: prev.content + (prev.content.endsWith('\n') || prev.content === '' ? '' : '\n') + btn.insert + '\n' }))}
                      className="min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/40 text-gray-400 hover:text-indigo-300 transition-colors text-[10px] font-bold cursor-pointer border border-white/10"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full flex-1 bg-transparent border-0 resize-none focus:ring-0 focus:outline-none text-sm text-gray-200 font-mono leading-relaxed overflow-y-auto"
                placeholder="### 1. Cách dùng&#10;Viết bài ghi chú ngữ pháp tại đây bằng Markdown..."
              />
            </div>

            {/* Right side live preview */}
            <div className="flex flex-col p-4 overflow-hidden h-full bg-white/1">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> Xem trước kết quả
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {form.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{form.content}</ReactMarkdown>
                ) : (
                  <span className="text-gray-600 italic text-xs">Chưa có nội dung xem trước.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Regular List View & Detail split screen */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
          {/* Left Panel: Note List */}
          <div className="glass-card rounded-2xl flex flex-col overflow-hidden border border-white/5 md:col-span-1">
            {/* Search and Filters */}
            <div className="p-4 border-b border-white/5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Tìm ghi chú..."
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

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : notes.length === 0 ? (
                <p className="text-gray-500 text-center text-xs py-8">Không có ghi chú nào.</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-4 cursor-pointer transition-all flex items-start justify-between gap-3 text-left ${
                      selectedNote?.id === note.id ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-white/2'
                    }`}
                  >
                    <div className="space-y-1">
                      <h3 className={`font-bold text-sm leading-snug ${selectedNote?.id === note.id ? 'text-white' : 'text-gray-300'}`}>
                        {note.title}
                      </h3>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-semibold text-indigo-400">
                        {note.level}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Note Detail View */}
          <div className="glass-card rounded-2xl flex flex-col overflow-hidden border border-white/5 md:col-span-2">
            {selectedNote ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header details */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-white">{selectedNote.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20 rounded-full">
                        {selectedNote.level}
                      </span>
                      <span>• Cập nhật: {new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(selectedNote)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                      title="Sửa ghi chú"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (selectedNote) {
                          setDeleteId(selectedNote.id);
                          setDeleteTitle(selectedNote.title);
                          setIsDeleteConfirmOpen(true);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer border border-rose-500/10"
                      title="Xóa ghi chú"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Markdown body rendering */}
                <div className="flex-1 p-6 overflow-y-auto pr-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{selectedNote.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-8 text-gray-500 space-y-3">
                <BookOpen className="h-10 w-10 text-gray-600" />
                <p className="text-sm">Chọn một ghi chú ngữ pháp từ thanh bên trái để đọc nội dung.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteConfirmOpen && deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4 animate-zoom-in text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-sans">Xóa ghi chú?</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Bạn có chắc chắn muốn xóa bài ghi chú ngữ pháp <span className="font-semibold text-white">"{deleteTitle}"</span> không? Hành động này không thể hoàn tác.
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
