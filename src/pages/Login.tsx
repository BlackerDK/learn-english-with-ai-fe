import React, { useState } from 'react';
import { Lock, User, Sparkles, LogIn, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface Props {
  onLoginSuccess: (token: string, user: { id: string; username: string; displayName: string; role: string }) => void;
}

export default function Login({ onLoginSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    if (!isLogin && username.trim().length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự.');
      return;
    }

    if (password.trim().length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password: password.trim() }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLoginSuccess(data.token, data.user);
        } else {
          const text = await res.text();
          setError(text || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
        }
      } else {
        // Register Flow
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            displayName: displayName.trim() || username.trim(),
          }),
        });

        if (res.ok) {
          setInfo('Đăng ký tài khoản thành công! Hãy chuyển qua tab đăng nhập.');
          setIsLogin(true);
          setPassword('');
        } else {
          const text = await res.text();
          setError(text || 'Đăng ký không thành công. Tên đăng nhập có thể đã tồn tại.');
        }
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra API đang chạy.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456a@' }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
      } else {
        const text = await res.text();
        setError(text || 'Không thể đăng nhập tài khoản admin mẫu.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ khi đăng nhập nhanh.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700"></div>

      <div className="glass w-full max-w-md rounded-3xl border border-white/5 shadow-2xl p-6 md:p-8 space-y-6 z-10 animate-fade-in">
        {/* Brand/Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">ANTIGRAVITY LANG</h1>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">AI Language Studio</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => { setIsLogin(true); setError(''); setInfo(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              isLogin ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); setInfo(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              !isLogin ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Alert / Error messages */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {info && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-2.5 text-xs">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{info}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Tên hiển thị (Tùy chọn)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-gray-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium font-sans">Tên đăng nhập</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                type="text"
                placeholder="Nhập tên tài khoản..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu của bạn..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? 'Vui lòng đợi...' : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
          </button>
        </form>

        {/* Divider for Quick Admin Login */}
        {isLogin && (
          <div className="space-y-4 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-full border-t border-white/5"></div>
              <span className="relative px-3 bg-[#0c101b] text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Hoặc sử dụng tài khoản mẫu</span>
            </div>

            <button
              onClick={handleQuickAdminLogin}
              disabled={loading}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium text-xs rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Đăng nhập nhanh Admin (Seed)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
