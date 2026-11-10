"use client";

import { useAppStore } from "./app-store";

export default function LoginForm({
  handleEmailLogin,
} : {
  handleEmailLogin: (e: React.FormEvent) => Promise<void>;
}) {

  const {
    authMode,
    email,
    password,
    errorMessage,
    setAuthMode,
    setEmail,
    setErrorMessage,
    setPassword,
  } = useAppStore();

  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">{authMode === 'login' ? 'Welcome Back' : 'Create Producer Identity'}</h3>
          <p className="text-xs text-gray-500">Provide authentication access layer mapping credentials</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Email Destination Account</label>
            <input type="type" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Secret Secure Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium"/>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 text-xs rounded-lg leading-relaxed font-medium">{errorMessage}</div>
          )}

          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition">
            {authMode === 'login' ? 'Authorize Session' : 'Register Cluster Node'}
          </button>
        </form>

        <div className="text-center">
          <button onClick={() => { setErrorMessage(null); setAuthMode(authMode === 'login' ? 'signup' : 'login'); }} className="text-xs text-gray-400 hover:text-blue-400 underline transition">
            {authMode === 'login' ? "Need an account? Configure registration profiles" : "Already registered? Redirect out to login parameters"}
          </button>
        </div>
      </div>
    </div>
  );
};