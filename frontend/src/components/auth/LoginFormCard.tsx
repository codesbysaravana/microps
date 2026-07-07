import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { loginSchema } from '../../lib/validations';
import type { LoginInput } from '../../lib/validations';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginFormCard: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      const response = await authService.login(data);
      login(response.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="w-full bg-[#111415]/80 sm:bg-[#131313]/90 backdrop-blur-md border border-[#2A2A2A] rounded-lg p-6 sm:p-10 shadow-2xl relative z-10">
      {/* Welcome Header */}
      <div className="mb-8">
        <h2 className="font-headline-md text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-2">
          MicrOps Login
        </h2>
        <p className="font-body-md text-sm sm:text-base text-neutral-400 opacity-80">
          Access your deployment terminal.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-3 rounded bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono animate-in fade-in duration-200"
        >
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Email Field */}
        <div className="group">
          <label
            htmlFor="login-email"
            className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-bold block mb-2 group-focus-within:text-[#D4AF37] transition-colors"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            className="w-full bg-transparent border-b border-[#2A2A2A] focus:border-[#D4AF37] focus:outline-none py-2.5 text-[#F5F5F0] placeholder:text-neutral-600 font-mono text-sm sm:text-base transition-colors"
            {...register('email')}
          />
          {errors.email && (
            <span className="block mt-1.5 text-xs font-mono text-red-400">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="group">
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="login-password"
              className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-bold group-focus-within:text-[#D4AF37] transition-colors"
            >
              Password
            </label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                alert('Contact your system administrator to reset terminal credentials.');
              }}
              className="font-mono text-xs text-[#D4AF37] hover:underline font-semibold transition-all"
            >
              Forgot Password?
            </a>
          </div>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full bg-transparent border-b border-[#2A2A2A] focus:border-[#D4AF37] focus:outline-none py-2.5 text-[#F5F5F0] placeholder:text-neutral-600 font-mono text-sm sm:text-base transition-colors"
            {...register('password')}
          />
          {errors.password && (
            <span className="block mt-1.5 text-xs font-mono text-red-400">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 sm:py-4 bg-[#D4AF37] hover:bg-[#e2bd44] text-[#131313] font-mono text-sm sm:text-base font-bold uppercase tracking-wider transition-all rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.2)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative flex py-8 items-center select-none">
        <div className="flex-grow border-t border-[#2A2A2A]/70"></div>
        <span className="flex-shrink mx-4 font-mono text-[11px] text-neutral-500 uppercase tracking-widest">
          OR
        </span>
        <div className="flex-grow border-t border-[#2A2A2A]/70"></div>
      </div>

      {/* Social Logins */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => window.location.href = 'https://microps.in/api/v1/github/auth'}
          className="flex items-center justify-center py-3 border border-[#2A2A2A] rounded-sm hover:bg-[#1C1B1B] transition-colors group text-neutral-200 hover:text-white font-mono text-xs sm:text-sm gap-2.5"
        >
          <svg className="w-4 h-4 text-neutral-400 group-hover:text-[#D4AF37] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>GitHub</span>
        </button>

        <button
          type="button"
          onClick={() => alert('SSO login via Google Cloud will be enabled for your enterprise organization.')}
          className="flex items-center justify-center py-3 border border-[#2A2A2A] rounded-sm hover:bg-[#1C1B1B] transition-colors group text-neutral-200 hover:text-white font-mono text-xs sm:text-sm gap-2.5"
        >
          <svg className="w-4 h-4 text-neutral-400 group-hover:text-[#D4AF37] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <span>Google</span>
        </button>
      </div>
    </div>
  );
};
