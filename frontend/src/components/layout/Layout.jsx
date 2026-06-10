import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, ClipboardList, FlaskConical,
  BookOpen, BarChart3, Settings, LogOut, Menu, X,
  Microscope, ChevronRight, Bell, User
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { path: '/patients', icon: Users, label: 'Patients' },
  { path: '/demandes', icon: ClipboardList, label: 'Demandes & Résultats' },
  { path: '/examens', icon: FlaskConical, label: 'Catalogue des examens' },
  { path: '/registre', icon: BookOpen, label: 'Registre de laboratoire' },
  { path: '/statistiques', icon: BarChart3, label: 'Statistiques' },
];

const ROLE_LABELS = { administrateur: 'Administrateur', technicien: 'Technicien de Labo.', receptionniste: 'Réceptionniste' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 flex flex-col transition-all duration-300 flex-shrink-0 shadow-2xl z-10`}>
        {/* Logo */}
        <div className={`flex items-center ${sidebarOpen ? 'px-4 py-4' : 'px-3 py-4 justify-center'} border-b border-slate-700`}>
          <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
            <Microscope size={22} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">LaboKeb</p>
              <p className="text-blue-300 text-xs leading-tight truncate">Dist. Sanitaire Kébémer</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} py-3 mx-2 rounded-lg mb-1 transition-all group
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}

          {user?.role === 'administrateur' && (
            <NavLink to="/administration"
              className={({ isActive }) =>
                `flex items-center ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} py-3 mx-2 rounded-lg mb-1 transition-all
                ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Settings size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="ml-3 text-sm font-medium">Administration</span>}
            </NavLink>
          )}
        </nav>

        {/* User info */}
        <div className={`border-t border-slate-700 p-3 ${!sidebarOpen && 'flex justify-center'}`}>
          {sidebarOpen ? (
            <div className="flex items-center">
              <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
              </div>
              <div className="ml-2 overflow-hidden flex-1">
                <p className="text-white text-xs font-semibold truncate">{user?.prenom} {user?.nom}</p>
                <p className="text-blue-300 text-xs truncate">{ROLE_LABELS[user?.role]}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 ml-1" title="Déconnexion">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400" title="Déconnexion">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
          {/* Bandeau institutionnel */}
          <div className="bg-slate-900 text-white px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-blue-300">RÉPUBLIQUE DU SÉNÉGAL</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">Ministère de la Santé et de l'Action Sociale</span>
            </div>
            <div className="text-xs text-slate-300">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Barre principale */}
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-900 p-1 rounded">
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div>
                <h1 className="text-slate-800 font-bold text-sm leading-tight">District Sanitaire de Kébémer</h1>
                <p className="text-slate-500 text-xs">Laboratoire d'Analyses Médicales</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Système connecté</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <Outlet />
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-slate-200 px-5 py-2 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span>Quartier Escale, Kébémer — BP : 30 — Tél : 78 059 20 94 / 76 784 86 32 55 — districtkebemer2022@gmail.com</span>
          <span>LaboKeb v1.0 © 2024</span>
        </footer>
      </div>
    </div>
  );
}
