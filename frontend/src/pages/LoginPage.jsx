import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Microscope, Eye, EyeOff, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Veuillez remplir tous les champs'); return; }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Connexion réussie');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header institutionnel */}
        <div className="text-center mb-8">
          <p className="text-blue-300 text-xs font-medium tracking-widest uppercase mb-2">République du Sénégal</p>
          <p className="text-slate-400 text-xs mb-4">Ministère de la Santé et de l'Action Sociale</p>
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 rounded-2xl p-4 shadow-2xl shadow-blue-900/50">
              <Microscope size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">LaboKeb</h1>
          <p className="text-blue-300 text-sm mt-1">District Sanitaire de Kébémer</p>
          <p className="text-slate-400 text-xs mt-0.5">Laboratoire d'Analyses Médicales</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-6 text-center">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Nom d'utilisateur</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                  placeholder="Votre identifiant"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-10 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-all shadow-lg mt-6 flex items-center justify-center gap-2"
            >
              {loading ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Connexion...</> : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Quartier Escale — BP : 30 — Kébémer<br/>
          Tél : 78 059 20 94 / 76 784 86 32 55
        </p>
      </div>
    </div>
  );
}
