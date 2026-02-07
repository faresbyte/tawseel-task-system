import React, { useState } from 'react';
import { LogIn, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const success = await login(email, password);

        if (!success) {
            alert('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
            <div className="w-full max-w-md animate-scale-in">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl shadow-xl mb-4">
                        <Lock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2">توصيل ون</h1>
                    <p className="text-gray-500 font-medium">نظام إدارة المهام المتقدم</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        تسجيل الدخول
                    </h2>

                    {/* Email Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            البريد الإلكتروني
                        </label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@tawseel.com"
                                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            كلمة المرور
                        </label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span>جاري التحقق...</span>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                <span>دخول النظام</span>
                            </>
                        )}
                    </button>

                    {/* Footer Info */}
                    <div className="mt-6 text-center text-xs text-gray-500">
                        <p>نظام محمي • تسجيل الخروج التلقائي بعد 10 دقائق من عدم النشاط</p>
                    </div>
                </form>

                {/* Copyright */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    © 2026 توصيل ون • جميع الحقوق محفوظة
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
