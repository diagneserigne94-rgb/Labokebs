import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  BookOpen, Search, Calendar, Download, Eye, ChevronLeft,
  ChevronRight, FileText, Filter, RefreshCw
} from "lucide-react";

export default function RegistrePage() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: new Date().toISOString().slice(0, 10),
    statut: "",
    search: ""
  });
  const [filterApplied, setFilterApplied] = useState({ ...filters });

  const fetchRegistre = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterApplied.dateDebut) params.append("dateDebut", filterApplied.dateDebut);
      if (filterApplied.dateFin) params.append("dateFin", filterApplied.dateFin);
      if (filterApplied.statut) params.append("statut", filterApplied.statut);
      if (filterApplied.search) params.append("search", filterApplied.search);
      const res = await api.get(`/registre?${params}`);
      setDemandes(res.data.demandes || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterApplied]);

  useEffect(() => { fetchRegistre(); }, [fetchRegistre]);

  const appliquerFiltres = () => {
    setPage(1);
    setFilterApplied({ ...filters });
  };

  const resetFiltres = () => {
    const today = new Date().toISOString().slice(0, 10);
    const reset = { dateDebut: today, dateFin: today, statut: "", search: "" };
    setFilters(reset);
    setFilterApplied(reset);
    setPage(1);
  };

  const exportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (filterApplied.dateDebut) params.append("dateDebut", filterApplied.dateDebut);
      if (filterApplied.dateFin) params.append("dateFin", filterApplied.dateFin);
      if (filterApplied.statut) params.append("statut", filterApplied.statut);
      const res = await api.get(`/pdf/registre?${params}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `registre_${filterApplied.dateDebut}_${filterApplied.dateFin}.pdf`;
      a.click();
    } catch (err) {
      alert("Erreur lors de l'export PDF");
    }
  };

  const statutBadge = (statut) => {
    const map = {
      en_attente: "bg-yellow-100 text-yellow-800",
      en_cours: "bg-blue-100 text-blue-800",
      valide: "bg-green-100 text-green-800",
      annule: "bg-red-100 text-red-800"
    };
    const labels = {
      en_attente: "En attente",
      en_cours: "En cours",
      valide: "Validé",
      annule: "Annulé"
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[statut] || "bg-gray-100 text-gray-700"}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Registre de laboratoire</h1>
            <p className="text-sm text-slate-500">Historique complet des analyses</p>
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          <Download className="w-4 h-4" /> Exporter PDF
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />Date début
            </label>
            <input
              type="date"
              value={filters.dateDebut}
              onChange={e => setFilters(f => ({ ...f, dateDebut: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />Date fin
            </label>
            <input
              type="date"
              value={filters.dateFin}
              onChange={e => setFilters(f => ({ ...f, dateFin: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Filter className="w-3 h-3 inline mr-1" />Statut
            </label>
            <select
              value={filters.statut}
              onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="valide">Validé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Search className="w-3 h-3 inline mr-1" />Recherche
            </label>
            <input
              type="text"
              placeholder="Patient, N° demande..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && appliquerFiltres()}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={appliquerFiltres}
              className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center justify-center gap-1"
            >
              <Search className="w-4 h-4" /> Filtrer
            </button>
            <button
              onClick={resetFiltres}
              className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 text-sm"
              title="Réinitialiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            {total} entrée{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}
          </span>
          <span className="text-xs text-slate-400">
            Page {page} / {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : demandes.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune entrée pour cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">N° Demande</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Prescripteur</th>
                  <th className="px-4 py-3 text-left">Examens</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demandes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        {d.numero_demande}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{new Date(d.created_at).toLocaleDateString("fr-FR")}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(d.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {d.patient_prenom} {d.patient_nom}
                      </div>
                      <div className="text-xs text-slate-400">{d.numero_dossier}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.prescripteur || <span className="text-slate-300 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(d.examens_noms || []).slice(0, 3).map((nom, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">
                            {nom}
                          </span>
                        ))}
                        {(d.examens_noms || []).length > 3 && (
                          <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded">
                            +{d.examens_noms.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{statutBadge(d.statut)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/resultats/${d.id}`)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Voir les résultats"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {d.statut === "valide" && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.get(`/pdf/bulletin/${d.id}`, { responseType: "blob" });
                                const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `bulletin_${d.numero_demande}.pdf`;
                                a.click();
                              } catch { alert("Erreur PDF"); }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Télécharger PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-sm ${p === page ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
