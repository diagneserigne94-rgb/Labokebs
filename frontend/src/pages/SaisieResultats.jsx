import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FlaskConical, CheckCircle, Save, ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const INTERP_OPTIONS = ['', 'normal', 'bas', 'eleve', 'positif', 'negatif', 'douteux'];
const INTERP_LABELS = { normal: '✓ Normal', bas: '▼ Bas', eleve: '▲ Élevé', positif: '+ Positif', negatif: '- Négatif', douteux: '? Douteux' };
const INTERP_COLORS = { normal: 'text-green-700 bg-green-50', bas: 'text-orange-700 bg-orange-50', eleve: 'text-red-700 bg-red-50', positif: 'text-red-700 bg-red-50', negatif: 'text-green-700 bg-green-50', douteux: 'text-yellow-700 bg-yellow-50' };
const CATEGORIE_ICONS = { 'Biochimie': '🧪', 'Hématologie': '🩸', 'Sérologie/Immunologie': '🦠', 'Bactériologie/Parasitologie': '🔬' };

export default function SaisieResultats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demande, setDemande] = useState(null);
  const [resultats, setResultats] = useState({});
  const [saving, setSaving] = useState({});
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDemande = async () => {
    try {
      const res = await api.get(`/demandes/${id}`);
      setDemande(res.data);
      const init = {};
      res.data.examens.forEach(e => {
        init[e.id] = {
          valeur_numerique: e.valeur_numerique ?? '',
          valeur_qualitative: e.valeur_qualitative ?? '',
          interpretation: e.interpretation ?? '',
          commentaire: e.commentaire ?? '',
          unite: e.unite ?? ''
        };
      });
      setResultats(init);
    } catch (err) { toast.error('Erreur chargement demande'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDemande(); }, [id]);

  const setVal = (examId, field, val) => {
    setResultats(prev => ({ ...prev, [examId]: { ...prev[examId], [field]: val } }));
  };

  const saveResultat = async (examen) => {
    setSaving(s => ({ ...s, [examen.id]: true }));
    try {
      const r = resultats[examen.id];
      await api.post('/resultats', {
        demande_examen_id: examen.id,
        valeur_numerique: r.valeur_numerique !== '' ? parseFloat(r.valeur_numerique) : null,
        valeur_qualitative: r.valeur_qualitative || null,
        unite: r.unite || examen.unite,
        interpretation: r.interpretation || null,
        commentaire: r.commentaire || null
      });
      toast.success(`${examen.examen_nom} sauvegardé`);
      fetchDemande();
    } catch (err) { toast.error('Erreur sauvegarde'); }
    finally { setSaving(s => ({ ...s, [examen.id]: false })); }
  };

  const validerDemande = async () => {
    if (!window.confirm('Valider définitivement tous les résultats de cette demande ?')) return;
    setValidating(true);
    try {
      await api.post(`/resultats/valider-demande/${id}`);
      toast.success('Demande validée avec succès !');
      fetchDemande();
    } catch (err) { toast.error('Erreur validation'); }
    finally { setValidating(false); }
  };

  const openPDF = () => window.open(`/api/pdf/resultat/${id}`, '_blank');

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  if (!demande) return <div className="text-center py-20 text-slate-500">Demande introuvable</div>;

  const groupes = {};
  demande.examens.forEach(e => {
    if (!groupes[e.categorie]) groupes[e.categorie] = [];
    groupes[e.categorie].push(e);
  });

  const tousValides = demande.examens.every(e => e.statut === 'valide');
  const tousSaisis = demande.examens.every(e => ['saisi', 'valide'].includes(e.statut));
  const isValide = demande.statut === 'valide';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/demandes')} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical size={20} /> Saisie des résultats
          </h2>
          <p className="text-slate-500 text-sm">{demande.numero_demande} — {demande.patient_nom} {demande.patient_prenom}</p>
        </div>
        <div className="flex gap-2">
          {isValide && (
            <button onClick={openPDF} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition">
              <FileText size={15} /> Imprimer PDF
            </button>
          )}
          {!isValide && (user?.role === 'technicien' || user?.role === 'administrateur') && tousSaisis && (
            <button onClick={validerDemande} disabled={validating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition">
              <CheckCircle size={15} />
              {validating ? 'Validation...' : 'Valider tous les résultats'}
            </button>
          )}
        </div>
      </div>

      {/* Info patient */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Patient', v: `${demande.patient_nom} ${demande.patient_prenom}` },
          { l: 'N° Dossier', v: demande.numero_dossier },
          { l: 'Sexe / Âge', v: `${demande.patient_sexe}${demande.patient_age ? ` / ${demande.patient_age} ans` : ''}` },
          { l: 'Prescripteur', v: demande.prescripteur || '—' },
          { l: 'Service', v: demande.service_demandeur || '—' },
          { l: 'Prélèvement', v: demande.type_prelevement || '—' },
          { l: 'Date demande', v: new Date(demande.date_demande).toLocaleString('fr-FR') },
          { l: 'Statut', v: demande.statut === 'valide' ? '✓ Validé' : demande.statut === 'en_cours' ? 'En cours' : 'En attente' },
        ].map(item => (
          <div key={item.l}>
            <p className="text-xs font-semibold text-slate-400 uppercase">{item.l}</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{item.v}</p>
          </div>
        ))}
      </div>

      {isValide && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Résultats validés</p>
            <p className="text-sm text-green-600">Tous les résultats ont été validés. Vous pouvez imprimer le bulletin.</p>
          </div>
        </div>
      )}

      {/* Résultats par catégorie */}
      {Object.entries(groupes).map(([categorie, examens]) => (
        <div key={categorie} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-700 px-5 py-3 flex items-center gap-2">
            <span className="text-lg">{CATEGORIE_ICONS[categorie] || '🔬'}</span>
            <h3 className="text-white font-semibold text-sm">{categorie}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {examens.map(examen => {
              const r = resultats[examen.id] || {};
              const isSaisi = ['saisi', 'valide'].includes(examen.statut);
              return (
                <div key={examen.id} className={`p-4 ${examen.statut === 'valide' ? 'bg-green-50/30' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-slate-800 text-sm">{examen.examen_nom}</p>
                        {examen.statut === 'valide' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Validé</span>}
                        {examen.statut === 'saisi' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Saisi</span>}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Résultat numérique ou qualitatif */}
                        {examen.type_resultat === 'numerique' || examen.type_resultat === 'mixte' ? (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Valeur numérique</label>
                            <div className="flex">
                              <input type="number" step="any"
                                value={r.valeur_numerique ?? ''} onChange={e => setVal(examen.id, 'valeur_numerique', e.target.value)}
                                disabled={isValide}
                                className="flex-1 border border-slate-200 rounded-l-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                placeholder="0.00" />
                              <span className="bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg px-2 py-2 text-xs text-slate-500 whitespace-nowrap">
                                {examen.unite || r.unite || '—'}
                              </span>
                            </div>
                          </div>
                        ) : null}
                        {examen.type_resultat === 'qualitatif' || examen.type_resultat === 'mixte' ? (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Résultat qualitatif</label>
                            <input value={r.valeur_qualitative ?? ''} onChange={e => setVal(examen.id, 'valeur_qualitative', e.target.value)}
                              disabled={isValide}
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                              placeholder="Positif / Négatif / ..." />
                          </div>
                        ) : null}
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">Interprétation</label>
                          <select value={r.interpretation ?? ''} onChange={e => setVal(examen.id, 'interpretation', e.target.value)}
                            disabled={isValide}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50">
                            {INTERP_OPTIONS.map(o => <option key={o} value={o}>{o ? INTERP_LABELS[o] : '— Choisir —'}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">Commentaire</label>
                          <input value={r.commentaire ?? ''} onChange={e => setVal(examen.id, 'commentaire', e.target.value)}
                            disabled={isValide}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            placeholder="Observation..." />
                        </div>
                      </div>

                      {/* Valeurs de référence */}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        {examen.ref_homme && <span>♂ {examen.ref_homme}</span>}
                        {examen.ref_femme && <span>♀ {examen.ref_femme}</span>}
                        {examen.ref_enfant && <span>👶 {examen.ref_enfant}</span>}
                      </div>
                    </div>

                    {!isValide && (
                      <button onClick={() => saveResultat(examen)} disabled={saving[examen.id]}
                        className="mt-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0">
                        <Save size={13} />
                        {saving[examen.id] ? '...' : 'Sauv.'}
                      </button>
                    )}
                    {r.interpretation && (
                      <div className={`mt-5 flex-shrink-0 text-xs font-bold px-2 py-1.5 rounded-lg ${INTERP_COLORS[r.interpretation] || 'bg-slate-100 text-slate-600'}`}>
                        {INTERP_LABELS[r.interpretation]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
