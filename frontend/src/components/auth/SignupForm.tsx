import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { signupSchema } from '../../lib/validations';
import type { SignupInput } from '../../lib/validations';
import { authService } from '../../services/authService';

interface ExtendedSignupFormInput extends SignupInput {
  organization?: string;
}

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExtendedSignupFormInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: ExtendedSignupFormInput) => {
    try {
      setError('');
      await authService.signup({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Account creation failed. Please verify your details.');
    }
  };

  return (
    <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-10 xl:p-14 bg-[#131313] my-auto">
      <div className="w-full max-w-md space-y-5 sm:space-y-6 lg:space-y-8 xl:space-y-10">
        {/* Title & Subtitle */}
        <div className="space-y-1.5 sm:space-y-2.5">
          <h1 className="font-headline-lg text-2xl sm:text-3xl xl:text-4xl font-semibold text-[#F5F5F0] tracking-tight">
            MicrOps Signup
          </h1>
          <p className="font-body-md text-xs sm:text-sm xl:text-base text-neutral-400">
            Precision cloud deployment for elite engineering teams.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-2.5 rounded bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono animate-in fade-in duration-200"
          >
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 lg:space-y-7" noValidate>
          <div className="space-y-3.5 sm:space-y-4.5 lg:space-y-5">
            {/* Full Name */}
            <div className="group">
              <label
                htmlFor="signup-name"
                className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-neutral-400 font-bold block mb-1 group-focus-within:text-[#D4AF37] transition-colors"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder="ALEXANDER VANCE"
                className="w-full bg-[#131313] border-b border-[#2A2A2A] focus:border-[#D4AF37] focus:outline-none px-0 py-1 sm:py-1.5 xl:py-2 text-[#F5F5F0] placeholder:text-neutral-600 font-mono text-xs sm:text-sm xl:text-base transition-colors"
                {...register('name')}
              />
              {errors.name && (
                <span className="block mt-1 text-[11px] font-mono text-red-400">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Work Email */}
            <div className="group">
              <label
                htmlFor="signup-email"
                className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-neutral-400 font-bold block mb-1 group-focus-within:text-[#D4AF37] transition-colors"
              >
                Work Email
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="AV@MICROPS.TECH"
                className="w-full bg-[#131313] border-b border-[#2A2A2A] focus:border-[#D4AF37] focus:outline-none px-0 py-1 sm:py-1.5 xl:py-2 text-[#F5F5F0] placeholder:text-neutral-600 font-mono text-xs sm:text-sm xl:text-base transition-colors"
                {...register('email')}
              />
              {errors.email && (
                <span className="block mt-1 text-[11px] font-mono text-red-400">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Organization Name */}
            <div className="group">
              <label
                htmlFor="signup-org"
                className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-neutral-400 font-bold block mb-1 group-focus-within:text-[#D4AF37] transition-colors"
              >
                Organization Name
              </label>
              <input
                id="signup-org"
                type="text"
                placeholder="STELLAR QUANTUM"
                className="w-full bg-[#131313] border-b border-[#2A2A2A] focus:border-[#D4AF37] focus:outline-none px-0 py-1 sm:py-1.5 xl:py-2 text-[#F5F5F0] placeholder:text-neutral-600 font-mono text-xs sm:text-sm xl:text-base transition-colors"
                {...register('organization')}
              />
            </div>

            {/* Password */}
            <div className="group">
              <label
                htmlFor="signup-password"
                className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-neutral-400 font-bold block mb-1 group-focus-within:text-[#D4AF37] transition-colors"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-[#131313] border-b border-[#2A2A2A] focus:border-[#D4AF37] focus:outline-none px-0 py-1 sm:py-1.5 xl:py-2 text-[#F5F5F0] placeholder:text-neutral-600 font-mono text-xs sm:text-sm xl:text-base transition-colors"
                {...register('password')}
              />
              {errors.password && (
                <span className="block mt-1 text-[11px] font-mono text-red-400">
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-1 sm:pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 sm:py-3.5 xl:py-4 bg-[#D4AF37] hover:bg-[#e2bd44] text-[#131313] font-mono text-xs sm:text-sm xl:text-base font-bold uppercase tracking-wider transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'Provisioning...' : 'Create Account'}</span>
              {!isSubmitting && (
                <svg className="w-4 h-4 stroke-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>

          {/* Sign In Redirect */}
          <p className="text-center font-mono text-[11px] sm:text-xs text-neutral-400 pt-0.5 sm:pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-[#D4AF37] hover:underline underline-offset-4 font-semibold">
              Sign in
            </Link>
          </p>

          {/* Divider */}
          <div className="relative flex py-4 items-center select-none">
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
              className="w-full flex items-center justify-center py-3 sm:py-3.5 border border-[#2A2A2A] rounded-sm hover:bg-[#1C1B1B] transition-colors group text-neutral-200 hover:text-white font-mono text-xs sm:text-sm gap-2.5"
            >
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-[#D4AF37] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.href = 'https://microps.in/api/v1/google/auth'}
              className="w-full flex items-center justify-center py-3 sm:py-3.5 border border-[#2A2A2A] rounded-sm hover:bg-[#1C1B1B] transition-colors group text-neutral-200 hover:text-white font-mono text-xs sm:text-sm gap-2.5"
            >
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-[#D4AF37] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span>Google</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
