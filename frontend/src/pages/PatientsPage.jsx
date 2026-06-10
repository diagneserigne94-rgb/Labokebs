import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, Eye, Edit, ChevronLeft, ChevronRight, Phone, MapPin, Calendar } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SEXE_BADGE = { Masculin: 'bg-blue-100 text-blue-700', Féminin: 'bg-pink-100 text-pink-700' };

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients', { params: { search, page, limit: 20 } });
      setPatients(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (e) { toast.error('Erreur chargement patients'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { const t = setTimeout(fetchPatients, 300); return () => clearTimeout(t); }, [fetchPatients]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users size={20} /> Gestion des patients</h2>
          <p className="text-slate-500 text-sm">{total} patient{total !== 1 ? 's' : ''} enregistré{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/patients/nouveau')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all">
          <Plus size={18} /> Nouveau patient
        </button>
      </div>

      {/* Barre recherche */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom, prénom, numéro de dossier ou téléphone..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">N° Dossier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Sexe</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Âge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Analyses</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p>Aucun patient trouvé</p>
              </td></tr>
            ) : patients.map((p, i) => (
              <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">{p.numero_dossier}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 text-sm">{p.nom} {p.prenom}</p>
                  {p.adresse && <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} />{p.adresse}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEXE_BADGE[p.sexe] || 'bg-slate-100 text-slate-600'}`}>{p.sexe}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {p.age ? `${p.age} ans` : (p.date_naissance ? <span className="flex items-center gap-1 text-xs text-slate-400"><Calendar size={10} />{new Date(p.date_naissance).toLocaleDateString('fr-FR')}</span> : '—')}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {p.telephone ? <span className="flex items-center gap-1"><Phone size={12} />{p.telephone}</span> : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">{p.nb_demandes || 0}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/demandes/nouvelle?patient=${p.id}`)}
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded font-medium transition">
                      + Demande
                    </button>
                    <button onClick={() => navigate(`/patients/${p.id}/modifier`)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                      <Edit size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Page {page} sur {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
