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
        </form>
      </div>
    </div>
  );
};
