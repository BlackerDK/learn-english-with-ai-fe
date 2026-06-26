import React from 'react';
import { X, KeyRound, AlertTriangle, ExternalLink, Settings } from 'lucide-react';

interface ApiError {
  statusCode?: number;
  errorCode?: string;
  message?: string;
  detail?: string;
}

interface Props {
  error: ApiError | null;
  onClose: () => void;
  onGoToSettings?: () => void;
}

export default function ApiErrorPopup({ error, onClose, onGoToSettings }: Props) {
  if (!error) return null;

  const isApiKeyError = error.errorCode === 'API_KEY_MISSING' || error.statusCode === 503;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-zoom-in"
        style={{ borderColor: isApiKeyError ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)' }}>

        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${isApiKeyError ? 'border-amber-500/20 bg-amber-500/8' : 'border-rose-500/20 bg-rose-500/8'}`}>
          <div className="flex items-center gap-2.5">
            {isApiKeyError
              ? <KeyRound className="h-5 w-5 text-amber-400 shrink-0" />
              : <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />}
            <span className={`font-bold text-sm ${isApiKeyError ? 'text-amber-300' : 'text-rose-300'}`}>
              {isApiKeyError ? 'Chưa cấu hình AI API Key' : 'Lỗi hệ thống'}
            </span>
          </div>
          <button onClick={onClose}
            className="p-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-gray-800 leading-relaxed">
            {error.message || 'Đã xảy ra lỗi không xác định.'}
          </p>

          {isApiKeyError && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-2 text-xs text-gray-600 leading-relaxed">
                <p className="font-semibold text-gray-700">Cách lấy API Key miễn phí:</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[9px] flex items-center justify-center shrink-0 mt-0.5 font-bold">1</span>
                    <span>
                      <span className="text-gray-900 font-medium">Gemini</span>: Truy cập{' '}
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5">
                        aistudio.google.com/apikey <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      {' '}→ Tạo API Key miễn phí
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[9px] flex items-center justify-center shrink-0 mt-0.5 font-bold">2</span>
                    <span>
                      <span className="text-gray-900 font-medium">Groq</span> (backup): Truy cập{' '}
                      <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-0.5">
                        console.groq.com/keys <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] flex items-center justify-center shrink-0 mt-0.5 font-bold">3</span>
                    <span>Dán key vào <span className="text-gray-900 font-medium">Cài đặt → AI API Key</span> trong ứng dụng</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isApiKeyError && error.detail && (
            <details className="group">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-600 transition-colors select-none">
                Chi tiết lỗi kỹ thuật
              </summary>
              <p className="mt-2 text-[11px] text-gray-500 font-mono bg-black/30 p-3 rounded-lg border border-gray-200 leading-relaxed break-all">
                {error.detail}
              </p>
            </details>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-4 border-t flex gap-3 ${isApiKeyError ? 'border-amber-500/10' : 'border-rose-500/10'}`}>
          <button onClick={onClose}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 rounded-xl text-sm border border-gray-200 cursor-pointer transition-colors">
            Đóng
          </button>
          {isApiKeyError && onGoToSettings && (
            <button onClick={() => { onClose(); onGoToSettings(); }}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-2 rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
              <Settings className="h-4 w-4" />
              Vào Cài đặt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
