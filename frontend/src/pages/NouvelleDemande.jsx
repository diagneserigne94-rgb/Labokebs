import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardPlus, Search, ArrowLeft, Plus, X, Save, User } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function NouvelleDemande() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prePatientId = searchParams.get('patient');

  const [step, setStep] = useState(prePatientId ? 2 : 1);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [examens, setExamens] = useState([]);
  const [selectedExamens, setSelectedExamens] = useState([]);
  const [form, setForm] = useState({ prescripteur: '', service_demandeur: '', type_prelevement: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('');
  const searchRef = useRef();

  const CATEGORIES = ['Biochimie', 'Hématologie', 'Sérologie/Immunologie', 'Bactériologie/Parasitologie'];

  useEffect(() => {
    if (prePatientId) {
      api.get(`/patients/${prePatientId}`).then(r => setSelectedPatient(r.data));
    }
    api.get('/examens', { params: { actif: true } }).then(r => setExamens(r.data));
  }, [prePatientId]);

  useEffect(() => {
    if (!patientSearch.trim()) { setPatientResults([]); return; }
    const t = setTimeout(() => {
      api.get('/patients', { params: { search: patientSearch, limit: 8 } })
        .then(r => setPatientResults(r.data.data));
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const filteredExamens = examens.filter(e =>
    (!categorieFiltre || e.categorie === categorieFiltre) &&
    (!examSearch || e.nom.toLowerCase().includes(examSearch.toLowerCase()))
  );

  const toggleExamen = (e) => {
    setSelectedExamens(prev =>
      prev.find(x => x.id === e.id) ? prev.filter(x => x.id !== e.id) : [...prev, e]
    );
  };

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error('Sélectionnez un patient'); return; }
    if (selectedExamens.length === 0) { toast.error('Sélectionnez au moins un examen'); return; }
    setSaving(true);
    try {
      const res = await api.post('/demandes', {
        patient_id: selectedPatient.id,
        examen_ids: selectedExamens.map(e => e.id),
        ...form
      });
      toast.success('Demande créée avec succès');
      navigate(`/demandes/${res.data.id}/resultats`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/demandes')} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ClipboardPlus size={20} />Nouvelle demande</h2>
          <p className="text-slate-500 text-sm">Créer une demande d'analyses médicales</p>
        </div>
      </div>

      {/* Étapes */}
      <div className="flex items-center gap-2 mb-2">
        {['Patient', 'Examens', 'Informations'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition
              ${step === i + 1 ? 'bg-blue-600 text-white' : step > i + 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                border-2 border-current">{i + 1}</span>
              {s}
            </div>
            {i < 2 && <div className="flex-1 h-0.5 bg-slate-200" />}
          </React.Fragment>
        ))}
      </div>

      {/* ÉTAPE 1: Sélection patient */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-800 px-5 py-3"><h3 className="text-white font-semibold text-sm flex items-center gap-2"><User size={15} />Sélection du patient</h3></div>
          <div className="p-5">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                ref={searchRef}
                placeholder="Rechercher par nom, prénom ou numéro de dossier..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {patientResults.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                {patientResults.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPatient(p); setStep(2); setPatientSearch(''); setPatientResults([]); }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition">
                    <p className="font-semibold text-sm text-slate-800">{p.nom} {p.prenom}</p>
                    <p className="text-xs text-slate-400">{p.numero_dossier} • {p.sexe}{p.age ? ` • ${p.age} ans` : ''}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <p className="text-sm text-slate-500">Patient non trouvé ?</p>
              <button onClick={() => navigate('/patients/nouveau')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <Plus size={14} /> Créer nouveau patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient sélectionné (étape 2+) */}
      {selectedPatient && step >= 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-blue-800">{selectedPatient.nom} {selectedPatient.prenom}</p>
            <p className="text-sm text-blue-600">{selectedPatient.numero_dossier} • {selectedPatient.sexe}{selectedPatient.age ? ` • ${selectedPatient.age} ans` : ''}</p>
          </div>
          {step === 2 && <button onClick={() => { setSelectedPatient(null); setStep(1); }} className="text-blue-400 hover:text-blue-600"><X size={18} /></button>}
        </div>
      )}

      {/* ÉTAPE 2: Sélection examens */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-800 px-5 py-3 flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Examens demandés</h3>
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{selectedExamens.length} sélectionné{selectedExamens.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="p-4">
            {/* Filtres */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={examSearch} onChange={e => setExamSearch(e.target.value)}
                  placeholder="Rechercher examen..."
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={categorieFiltre} onChange={e => setCategorieFiltre(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Toutes catégories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {filteredExamens.map(e => {
                const sel = selectedExamens.find(x => x.id === e.id);
                return (
                  <button key={e.id} onClick={() => toggleExamen(e)}
                    className={`text-left p-3 rounded-lg border-2 transition-all text-sm
                      ${sel ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <p className={`font-semibold text-xs ${sel ? 'text-blue-700' : 'text-slate-700'}`}>{e.nom}</p>
                    <p className={`text-xs mt-0.5 ${sel ? 'text-blue-500' : 'text-slate-400'}`}>{e.categorie}</p>
                    {e.prix > 0 && <p className="text-xs font-bold text-green-600 mt-1">{e.prix.toLocaleString()} FCFA</p>}
                  </button>
                );
              })}
            </div>

            {selectedExamens.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">Examens sélectionnés :</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedExamens.map(e => (
                    <span key={e.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {e.nom}
                      <button onClick={() => toggleExamen(e)} className="hover:text-blue-900"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-700 font-medium">← Retour</button>
            <button onClick={() => setStep(3)} disabled={selectedExamens.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3: Informations */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-800 px-5 py-3"><h3 className="text-white font-semibold text-sm">Informations de la demande</h3></div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {[
              { key: 'prescripteur', label: 'Prescripteur', placeholder: 'Dr. Nom du médecin' },
              { key: 'service_demandeur', label: 'Service demandeur', placeholder: 'Ex: Médecine interne, Urgences' },
              { key: 'type_prelevement', label: 'Type de prélèvement', placeholder: 'Ex: Sang veineux, Urine...' },
            ].map(f => (
              <div key={f.key} className={f.key === 'type_prelevement' ? 'col-span-2' : ''}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes / Observations</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Informations complémentaires..." />
            </div>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t flex justify-between items-center">
            <button onClick={() => setStep(2)} className="text-sm text-slate-500 hover:text-slate-700 font-medium">← Retour</button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{selectedExamens.length} examen{selectedExamens.length !== 1 ? 's' : ''} sélectionné{selectedExamens.length !== 1 ? 's' : ''}</span>
              <button onClick={handleSubmit} disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
                <Save size={16} />
                {saving ? 'Création...' : 'Créer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
