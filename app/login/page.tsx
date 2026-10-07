import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 items-center justify-center text-white font-black text-2xl shadow-glow mb-2">
            AK
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Al-Kabeer Pakwaan</h1>
          <p className="text-xs font-semibold text-amber-500 tracking-wider uppercase">
            Catering Management Web Portal
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6 shadow-2xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
