import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PatientsPage from './pages/PatientsPage';
import PatientForm from './pages/PatientForm';
import DemandesPage from './pages/DemandesPage';
import NouvelleDemandeePage from './pages/NouvelleDemande';
import SaisieResultats from './pages/SaisieResultats';
import CatalogueExamens from './pages/CatalogueExamens';
import RegistrePage from './pages/RegistrePage';
import StatistiquesPage from './pages/StatistiquesPage';
import AdministrationPage from './pages/AdministrationPage';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-900"><div className="text-white text-xl">Chargement...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1E3A5F', color: '#fff', fontFamily: 'Inter, sans-serif' } }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/nouveau" element={<PatientForm />} />
            <Route path="patients/:id/modifier" element={<PatientForm />} />
            <Route path="demandes" element={<DemandesPage />} />
            <Route path="demandes/nouvelle" element={<NouvelleDemandeePage />} />
            <Route path="demandes/:id/resultats" element={<SaisieResultats />} />
            <Route path="resultats/:id" element={<SaisieResultats />} />
            <Route path="examens" element={<CatalogueExamens />} />
            <Route path="registre" element={<RegistrePage />} />
            <Route path="statistiques" element={<StatistiquesPage />} />
            <Route path="administration" element={<PrivateRoute roles={['administrateur']}><AdministrationPage /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
