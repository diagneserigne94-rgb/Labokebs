import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserPlus, Save, ArrowLeft, Calendar } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const calcAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', sexe: 'Masculin', date_naissance: '', telephone: '', adresse: '' });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/patients/${id}`).then(r => setForm({
        nom: r.data.nom, prenom: r.data.prenom, sexe: r.data.sexe,
        date_naissance: r.data.date_naissance ? r.data.date_naissance.split('T')[0] : '',
        telephone: r.data.telephone || '', adresse: r.data.adresse || ''
      })).finally(() => setLoading(false));
    }
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.prenom) { toast.error('Nom et prénom obligatoires'); return; }
    setSaving(true);
    try {
      if (isEdit) { await api.put(`/patients/${id}`, form); toast.success('Patient modifié'); }
      else { await api.post('/patients', form); toast.success('Patient créé'); }
      navigate('/patients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

  const age = calcAge(form.date_naissance);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/patients')} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus size={20} />
            {isEdit ? 'Modifier le patient' : 'Nouveau patient'}
          </h2>
          <p className="text-slate-500 text-sm">{isEdit ? 'Mise à jour du dossier patient' : 'Enregistrement d\'un nouveau dossier patient'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4">
          <h3 className="text-white font-semibold text-sm">Informations personnelles</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="NOM DE FAMILLE" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
              <input value={form.prenom} onChange={e => set('prenom', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Prénom" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sexe <span className="text-red-500">*</span></label>
              <select value={form.sexe} onChange={e => set('sexe', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Date de naissance
                {age !== null && <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{age} ans</span>}
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Téléphone</label>
            <input value={form.telephone} onChange={e => set('telephone', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 77 000 00 00" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse</label>
            <textarea value={form.adresse} onChange={e => set('adresse', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Quartier, ville..." />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onClick={() => navigate('/patients')}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
            <Save size={16} />
            {saving ? 'Enregistrement...' : (isEdit ? 'Enregistrer les modifications' : 'Créer le dossier patient')}
          </button>
        </div>
      </form>
    </div>
  );
}
