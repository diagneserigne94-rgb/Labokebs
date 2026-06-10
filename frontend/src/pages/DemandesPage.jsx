import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, Filter, Clock, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUT_CONFIG = {
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  valide: { label: 'Validé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  archive: { label: 'Archivé', color: 'bg-slate-100 text-slate-600', icon: FileText },
};

export default function DemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statut, setStatut] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const s = searchParams.get('statut');
    if (s) setStatut(s);
  }, [searchParams]);

  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/demandes', { params: { statut, date_debut: dateDebut, date_fin: dateFin, page, limit: 20 } });
      setDemandes(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (e) { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, [statut, dateDebut, dateFin, page]);

  useEffect(() => { fetchDemandes(); }, [fetchDemandes]);

  const openPDF = (id) => window.open(`/api/pdf/resultat/${id}?token=${localStorage.getItem('labokeb_token')}`, '_blank');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ClipboardList size={20} /> Demandes & Résultats</h2>
          <p className="text-slate-500 text-sm">{total} demande{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => navigate('/demandes/nouvelle')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all">
          <Plus size={18} /> Nouvelle demande
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Statut</label>
            <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous</option>
              {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Du</label>
            <input type="date" value={dateDebut} onChange={e => { setDateDebut(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Au</label>
            <input type="date" value={dateFin} onChange={e => { setDateFin(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {(statut || dateDebut || dateFin) && (
            <button onClick={() => { setStatut(''); setDateDebut(''); setDateFin(''); setPage(1); }}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-2 hover:bg-slate-100 rounded-lg transition">
              Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">N° Demande</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Prescripteur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Examens</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </td></tr>
            ) : demandes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                <p>Aucune demande trouvée</p>
              </td></tr>
            ) : demandes.map((d, i) => {
              const sc = STATUT_CONFIG[d.statut] || STATUT_CONFIG.en_attente;
              const ScIcon = sc.icon;
              return (
                <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-semibold">{d.numero_demande}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p>{new Date(d.date_demande).toLocaleDateString('fr-FR')}</p>
                    <p className="text-slate-400">{new Date(d.date_demande).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 text-sm">{d.patient_nom} {d.patient_prenom}</p>
                    <p className="text-xs text-slate-400">{d.numero_dossier} • {d.patient_sexe}{d.patient_age ? ` • ${d.patient_age} ans` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{d.prescripteur || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                      {d.nb_valides}/{d.nb_examens} examen{d.nb_examens > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${sc.color}`}>
                      <ScIcon size={11} /> {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/demandes/${d.id}/resultats`)}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded font-medium transition">
                        Résultats
                      </button>
                      {d.statut === 'valide' && (
                        <button onClick={() => openPDF(d.id)}
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded font-medium transition flex items-center gap-1">
                          <FileText size={11} /> PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Page {page} sur {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
