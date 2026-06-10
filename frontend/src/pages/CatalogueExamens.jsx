import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, Edit, Trash2, Search, X, Save } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'Biochimie', label: '🧪 Biochimie' },
  { key: 'Hématologie', label: '🩸 Hématologie' },
  { key: 'Sérologie/Immunologie', label: '🦠 Sérologie / Immunologie' },
  { key: 'Bactériologie/Parasitologie', label: '🔬 Bactériologie / Parasitologie' },
];

const TYPE_OPTIONS = [
  { value: 'numerique', label: 'Numérique' },
  { value: 'qualitatif', label: 'Qualitatif' },
  { value: 'mixte', label: 'Mixte' },
];

const emptyForm = { code: '', nom: '', categorie: 'Biochimie', unite: '', ref_homme: '', ref_femme: '', ref_enfant: '', prix: '', delai_rendu: '', type_resultat: 'numerique', actif: true };

export default function CatalogueExamens() {
  const [examens, setExamens] = useState([]);
  const [tab, setTab] = useState('Biochimie');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchExamens = async () => {
    setLoading(true);
    try {
      const res = await api.get('/examens');
      setExamens(res.data);
    } catch (e) { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchExamens(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...emptyForm, categorie: tab }); setModal(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e, prix: e.prix || '' }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.code || !form.nom || !form.categorie) { toast.error('Code, nom et catégorie requis'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/examens/${editing.id}`, form);
        toast.success('Examen modifié');
      } else {
        await api.post('/examens', form);
        toast.success('Examen créé');
      }
      closeModal();
      fetchExamens();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e) => {
    if (!window.confirm(`Désactiver l'examen "${e.nom}" ?`)) return;
    try {
      await api.delete(`/examens/${e.id}`);
      toast.success('Examen désactivé');
      fetchExamens();
    } catch { toast.error('Erreur'); }
  };

  const filtered = examens.filter(e =>
    e.categorie === tab && e.actif &&
    (!search || e.nom.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FlaskConical size={20} />Catalogue des examens</h2>
          <p className="text-slate-500 text-sm">{examens.filter(e => e.actif).length} examens actifs</p>
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all">
          <Plus size={18} /> Nouvel examen
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un examen..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex-wrap">
        {CATEGORIES.map(cat => {
          const count = examens.filter(e => e.categorie === cat.key && e.actif).length;
          return (
            <button key={cat.key} onClick={() => setTab(cat.key)}
              className={`flex-1 min-w-0 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                ${tab === cat.key ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className="truncate">{cat.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0
                ${tab === cat.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-white text-xs">
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Nom de l'examen</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Unité</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Réf. Homme</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Réf. Femme</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Réf. Enfant</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Prix</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Délai</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">
                  <FlaskConical size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Aucun examen dans cette catégorie</p>
                </td></tr>
              ) : filtered.map((e, i) => (
                <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{e.code}</span></td>
                  <td className="px-4 py-3 font-medium text-slate-800 text-sm">{e.nom}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{e.unite || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-32 truncate" title={e.ref_homme}>{e.ref_homme || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-32 truncate" title={e.ref_femme}>{e.ref_femme || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-32 truncate" title={e.ref_enfant}>{e.ref_enfant || '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-green-700">{e.prix > 0 ? `${Number(e.prix).toLocaleString()} FCFA` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{e.delai_rendu || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(e)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal CRUD */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">{editing ? 'Modifier l\'examen' : 'Nouvel examen'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'code', label: 'Code *', placeholder: 'BIO001' },
                  { key: 'nom', label: 'Nom *', placeholder: 'Nom de l\'examen', full: true },
                  { key: 'unite', label: 'Unité', placeholder: 'g/L, UI/L...' },
                  { key: 'delai_rendu', label: 'Délai de rendu', placeholder: '2 heures' },
                  { key: 'ref_homme', label: 'Réf. Homme', placeholder: '0.70 - 1.10', full: true },
                  { key: 'ref_femme', label: 'Réf. Femme', placeholder: '0.70 - 1.10', full: true },
                  { key: 'ref_enfant', label: 'Réf. Enfant', placeholder: '0.60 - 1.00', full: true },
                  { key: 'prix', label: 'Prix (FCFA)', placeholder: '2000', type: 'number' },
                ].map(f => (
                  <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                    <input type={f.type || 'text'} value={form[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie *</label>
                  <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type de résultat</label>
                  <select value={form.type_resultat} onChange={e => setForm(p => ({ ...p, type_resultat: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium">Annuler</button>
              <button onClick={handleSave} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
                <Save size={15} />
                {saving ? 'Enregistrement...' : (editing ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
