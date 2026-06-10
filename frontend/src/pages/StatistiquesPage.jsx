import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Users, FlaskConical, Download, RefreshCw,
  Calendar, Award, BarChart2
} from "lucide-react";

const COLORS = ["#1E3A5F","#2E86AB","#28A745","#FFC107","#DC3545","#6F42C1","#20C997","#FD7E14"];

export default function StatistiquesPage() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const annees = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/statistiques?annee=${annee}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [annee]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const exportExcel = async () => {
    setExportLoading(true);
    try {
      const res = await api.get(`/statistiques/export-excel?annee=${annee}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `statistiques_${annee}.xlsx`;
      a.click();
    } catch { alert("Erreur export Excel"); }
    finally { setExportLoading(false); }
  };

  const exportPDF = async () => {
    try {
      const res = await api.get(`/statistiques/export-pdf?annee=${annee}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `statistiques_${annee}.pdf`;
      a.click();
    } catch { alert("Erreur export PDF"); }
  };

  const moisLabels = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  const dataBarChart = stats?.parMois?.map((m, i) => ({
    mois: moisLabels[i],
    Patients: m.patients,
    Analyses: m.analyses
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <BarChart2 className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Statistiques</h1>
            <p className="text-sm text-slate-500">Activité du laboratoire — {annee}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={annee}
            onChange={e => setAnnee(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={fetchStats} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={exportExcel}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-60"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total patients", value: stats?.totaux?.patients ?? 0, icon: Users, color: "blue" },
          { label: "Total analyses", value: stats?.totaux?.analyses ?? 0, icon: FlaskConical, color: "green" },
          { label: "Résultats validés", value: stats?.totaux?.valides ?? 0, icon: TrendingUp, color: "indigo" },
          { label: "Mois le plus actif", value: stats?.moisPic ? moisLabels[stats.moisPic - 1] : "—", icon: Award, color: "orange", isText: true }
        ].map(({ label, value, icon: Icon, color, isText }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
              <div className={`bg-${color}-100 p-1.5 rounded-lg`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
            </div>
            <div className={`${isText ? "text-2xl font-semibold" : "text-3xl font-bold"} text-slate-800`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Graphique mensuel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Activité mensuelle {annee}
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dataBarChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}
            />
            <Legend wrapperStyle={{ fontSize: "13px" }} />
            <Bar dataKey="Patients" fill="#2E86AB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Analyses" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau mensuel + Top examens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tableau mensuel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-700">Détail par mois</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Mois</th>
                  <th className="px-4 py-2 text-right">Patients</th>
                  <th className="px-4 py-2 text-right">Analyses</th>
                  <th className="px-4 py-2 text-right">Validés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.parMois || []).map((m, i) => (
                  <tr key={i} className={`hover:bg-slate-50 ${m.analyses === 0 ? "opacity-50" : ""}`}>
                    <td className="px-4 py-2 font-medium text-slate-700">{moisLabels[i]}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{m.patients}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{m.analyses}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-green-600 font-medium">{m.valides}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold text-slate-800">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{stats?.totaux?.patients ?? 0}</td>
                  <td className="px-4 py-2 text-right">{stats?.totaux?.analyses ?? 0}</td>
                  <td className="px-4 py-2 text-right text-green-600">{stats?.totaux?.valides ?? 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 examens */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Top 10 examens les plus demandés
          </h2>
          {stats?.topExamens?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.topExamens.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="count"
                    nameKey="nom"
                  >
                    {stats.topExamens.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {stats.topExamens.slice(0, 8).map((e, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-700">{e.nom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-slate-100 w-20 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(e.count / stats.topExamens[0].count) * 100}%`,
                            backgroundColor: COLORS[i % COLORS.length]
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-8 text-right">{e.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              Aucune donnée disponible pour {annee}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
