import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, ClipboardList, Clock, CheckCircle, TrendingUp, FlaskConical, Activity } from 'lucide-react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['#2563EB', '#16A34A', '#DC2626', '#D97706', '#7C3AED', '#0891B2', '#BE185D'];

const StatCard = ({ icon: Icon, label, value, sub, color, onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`${color} bg-opacity-10 rounded-xl p-3`}>
        <Icon size={22} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-800">{value ?? '—'}</p>
    <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Tableau de bord</h2>
        <p className="text-slate-500 text-sm">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Cartes stats du jour */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity size={14} /> Activité du jour
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Patients du jour" value={data?.today?.patients} color="bg-blue-600" onClick={() => navigate('/patients')} />
          <StatCard icon={ClipboardList} label="Demandes du jour" value={data?.today?.analyses} color="bg-indigo-600" onClick={() => navigate('/demandes')} />
          <StatCard icon={Clock} label="En attente / En cours" value={data?.today?.en_attente} color="bg-amber-500" onClick={() => navigate('/demandes?statut=en_attente')} />
          <StatCard icon={CheckCircle} label="Validés aujourd'hui" value={data?.today?.valides} color="bg-green-600" onClick={() => navigate('/demandes?statut=valide')} />
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activité 6 mois */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2"><TrendingUp size={16} /> Activité des 6 derniers mois</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.mensuel || []} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => { const d = new Date(v); return d.toLocaleDateString('fr-FR', { month: 'short' }); }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                formatter={(val, name) => [val, name === 'nb_demandes' ? 'Demandes' : 'Patients']} />
              <Bar dataKey="nb_demandes" name="nb_demandes" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nb_patients" name="nb_patients" fill="#93C5FD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top examens */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-4"><FlaskConical size={16} /> Top examens du mois</h3>
          {data?.top5Examens?.length > 0 ? (
            <div className="space-y-3">
              {data.top5Examens.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{e.nom}</p>
                    <p className="text-xs text-slate-400">{e.categorie}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-600">{e.nb}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-400 text-sm text-center py-8">Aucune donnée</p>}
        </div>
      </div>

      {/* Actions rapides */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Nouveau patient', icon: Users, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200', path: '/patients/nouveau' },
            { label: 'Nouvelle demande', icon: ClipboardList, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200', path: '/demandes/nouvelle' },
            { label: 'Saisir résultats', icon: FlaskConical, color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200', path: '/demandes?statut=en_attente' },
            { label: 'Voir statistiques', icon: TrendingUp, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200', path: '/statistiques' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className={`${a.color} border rounded-xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md`}>
              <a.icon size={20} className="mb-2" />
              <p className="text-sm font-semibold">{a.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
