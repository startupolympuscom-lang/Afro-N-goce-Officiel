import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface PasswordGateProps {
  expectedPassword?: string;
  unlockKey: string;
  children: React.ReactNode;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ 
  expectedPassword = 'aziz123', 
  unlockKey, 
  children 
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(unlockKey) === 'true') {
      setIsUnlocked(true);
    }
  }, [unlockKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      sessionStorage.setItem(unlockKey, 'true');
      setIsUnlocked(true);
    } else {
      setError(true);
    }
  };

  if (isUnlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/50">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 font-display uppercase tracking-tight">Accès Sécurisé</h1>
          <p className="text-slate-500 font-medium text-sm">Veuillez entrer le mot de passe pour accéder à cette section restreinte.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Mot de passe"
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-colors`}
            />
            {error && <p className="text-red-500 text-xs mt-2 font-bold px-1">Mot de passe incorrect</p>}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Déverrouiller
          </button>
        </form>
      </div>
    </div>
  );
}
