import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Settings, Users, Shield, HardDrive, Clock, Plus, Edit2,
  Trash2, Key, CheckCircle, AlertCircle, RefreshCw, Download,
  Eye, EyeOff, Save, X
} from "lucide-react";

const TABS = [
  { id: "utilisateurs", label: "Utilisateurs", icon: Users },
  { id: "sauvegarde", label: "Sauvegarde", icon: HardDrive },
  { id: "journal", label: "Journal des actions", icon: Clock },
  { id: "parametres", label: "Paramètres", icon: Settings }
];

const ROLES = [
  { value: "administrateur", label: "Administrateur", color: "red" },
  { value: "technicien", label: "Technicien", color: "blue" },
  { value: "receptionniste", label: "Réceptionniste", color: "green" }
];

export default function AdministrationPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("utilisateurs");

  // Utilisateurs
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [modalUser, setModalUser] = useState(null);
  const [userForm, setUserForm] = useState({ nom: "", prenom: "", username: "", email: "", role: "technicien", mot_de_passe: "" });
  const [showMdp, setShowMdp] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Sauvegarde
  const [sauvegardes, setSauvegardes] = useState([]);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);

  // Journal
  const [journal, setJournal] = useState([]);
  const [loadingJournal, setLoadingJournal] = useState(false);

  // Paramètres
  const [parametres, setParametres] = useState({});
  const [savingParams, setSavingParams] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/utilisateurs");
      setUtilisateurs(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingUsers(false); }
  }, []);

  const fetchBackups = useCallback(async () => {
    setLoadingBackup(true);
    try {
      const res = await api.get("/backup/liste");
      setSauvegardes(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingBackup(false); }
  }, []);

  const fetchJournal = useCallback(async () => {
    setLoadingJournal(true);
    try {
      const res = await api.get("/utilisateurs/journal?limit=100");
      setJournal(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingJournal(false); }
  }, []);

  const fetchParams = useCallback(async () => {
    try {
      const res = await api.get("/parametres");
      setParametres(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (activeTab === "utilisateurs") fetchUsers();
    else if (activeTab === "sauvegarde") fetchBackups();
    else if (activeTab === "journal") fetchJournal();
    else if (activeTab === "parametres") fetchParams();
  }, [activeTab, fetchUsers, fetchBackups, fetchJournal, fetchParams]);

  // ── Gestion utilisateurs ──
  const openAddUser = () => {
    setUserForm({ nom: "", prenom: "", username: "", email: "", role: "technicien", mot_de_passe: "" });
    setModalUser("new");
  };

  const openEditUser = (u) => {
    setUserForm({ nom: u.nom, prenom: u.prenom, username: u.username, email: u.email || "", role: u.role, mot_de_passe: "" });
    setModalUser(u.id);
  };

  const saveUser = async () => {
    if (!userForm.nom || !userForm.username || !userForm.role) return alert("Veuillez remplir les champs obligatoires.");
    if (modalUser === "new" && !userForm.mot_de_passe) return alert("Le mot de passe est obligatoire pour un nouvel utilisateur.");
    setSavingUser(true);
    try {
      if (modalUser === "new") {
        await api.post("/utilisateurs", userForm);
      } else {
        const payload = { ...userForm };
        if (!payload.mot_de_passe) delete payload.mot_de_passe;
        await api.put(`/utilisateurs/${modalUser}`, payload);
      }
      setModalUser(null);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || "Erreur lors de la sauvegarde");
    } finally { setSavingUser(false); }
  };

  const deleteUser = async (id, nom) => {
    if (!window.confirm(`Supprimer l'utilisateur « ${nom} » ?`)) return;
    try {
      await api.delete(`/utilisateurs/${id}`);
      fetchUsers();
    } catch (e) { alert(e.response?.data?.message || "Erreur suppression"); }
  };

  const roleBadge = (role) => {
    const r = ROLES.find(r => r.value === role);
    const colors = { red: "bg-red-100 text-red-700", blue: "bg-blue-100 text-blue-700", green: "bg-green-100 text-green-700" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[r?.color] || "bg-gray-100 text-gray-600"}`}>{r?.label || role}</span>;
  };

  // ── Sauvegarde ──
  const lancerSauvegarde = async () => {
    setRunningBackup(true);
    try {
      await api.post("/backup/manuel");
      alert("Sauvegarde effectuée avec succès !");
      fetchBackups();
    } catch (e) { alert(e.response?.data?.message || "Erreur de sauvegarde"); }
    finally { setRunningBackup(false); }
  };

  // ── Paramètres ──
  const saveParams = async () => {
    setSavingParams(true);
    try {
      await api.put("/parametres", parametres);
      alert("Paramètres enregistrés.");
    } catch (e) { alert("Erreur sauvegarde paramètres"); }
    finally { setSavingParams(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 p-2 rounded-lg">
          <Shield className="w-6 h-6 text-purple-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administration</h1>
          <p className="text-sm text-slate-500">Gestion du système LaboKeb</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── UTILISATEURS ── */}
      {activeTab === "utilisateurs" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-medium text-slate-700">Liste des utilisateurs</span>
            <button
              onClick={openAddUser}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          {loadingUsers ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Identifiant</th>
                  <th className="px-4 py-3 text-left">Rôle</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilisateurs.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{u.prenom} {u.nom}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{u.username}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3">
                      {u.actif ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3 h-3" /> Actif</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs"><AlertCircle className="w-3 h-3" /> Inactif</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditUser(u)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Modifier">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button onClick={() => deleteUser(u.id, u.nom)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── SAUVEGARDE ── */}
      {activeTab === "sauvegarde" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 mb-3">Sauvegarde manuelle</h2>
            <p className="text-sm text-slate-500 mb-4">
              La sauvegarde automatique est effectuée chaque soir à 23h00. Vous pouvez également lancer une sauvegarde manuelle à tout moment.
            </p>
            <button
              onClick={lancerSauvegarde}
              disabled={runningBackup}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium disabled:opacity-60"
            >
              {runningBackup ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
              {runningBackup ? "Sauvegarde en cours..." : "Lancer une sauvegarde"}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-700">Historique des sauvegardes</span>
              <button onClick={fetchBackups} className="p-1.5 hover:bg-slate-100 rounded">
                <RefreshCw className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {loadingBackup ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" /></div>
            ) : sauvegardes.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">Aucune sauvegarde disponible</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Fichier</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Taille</th>
                    <th className="px-4 py-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sauvegardes.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs text-slate-700">{s.fichier}</td>
                      <td className="px-4 py-2 text-slate-600">{new Date(s.created_at).toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-2 text-slate-500">{s.taille}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${s.type === "auto" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {s.type === "auto" ? "Automatique" : "Manuelle"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── JOURNAL ── */}
      {activeTab === "journal" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-medium text-slate-700">Journal des 100 dernières actions</span>
            <button onClick={fetchJournal} className="p-1.5 hover:bg-slate-100 rounded">
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          {loadingJournal ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" /></div>
          ) : journal.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Aucune action enregistrée</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Date / Heure</th>
                    <th className="px-4 py-2 text-left">Utilisateur</th>
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journal.map((j, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(j.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-700">{j.utilisateur_nom || j.username}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          j.action?.includes("suppr") ? "bg-red-100 text-red-700"
                          : j.action?.includes("créa") || j.action?.includes("ajout") ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                        }`}>{j.action}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-xs max-w-xs truncate">{j.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PARAMÈTRES ── */}
      {activeTab === "parametres" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-700 mb-5">Paramètres du système</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
            {[
              { key: "nom_etablissement", label: "Nom de l'établissement" },
              { key: "adresse", label: "Adresse" },
              { key: "telephone", label: "Téléphone" },
              { key: "email", label: "Email" },
              { key: "responsable", label: "Responsable du laboratoire" },
              { key: "titre_responsable", label: "Titre du responsable" }
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  type="text"
                  value={parametres[key] || ""}
                  onChange={e => setParametres(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveParams}
            disabled={savingParams}
            className="mt-6 flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {savingParams ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
        </div>
      )}

      {/* ── MODAL UTILISATEUR ── */}
      {modalUser !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                {modalUser === "new" ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {modalUser === "new" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
              </h3>
              <button onClick={() => setModalUser(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={userForm.prenom}
                    onChange={e => setUserForm(f => ({ ...f, prenom: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={userForm.nom}
                    onChange={e => setUserForm(f => ({ ...f, nom: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Identifiant (username) *</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rôle *</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  <Key className="w-3 h-3 inline mr-1" />
                  {modalUser === "new" ? "Mot de passe *" : "Nouveau mot de passe (laisser vide pour ne pas changer)"}
                </label>
                <div className="relative">
                  <input
                    type={showMdp ? "text" : "password"}
                    value={userForm.mot_de_passe}
                    onChange={e => setUserForm(f => ({ ...f, mot_de_passe: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder={modalUser !== "new" ? "••••••••" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMdp(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showMdp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setModalUser(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                Annuler
              </button>
              <button
                onClick={saveUser}
                disabled={savingUser}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {savingUser ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
