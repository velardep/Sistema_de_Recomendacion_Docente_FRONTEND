// app/router.tsx 

// Este archivo define las rutas de la aplicación, usando React Router v6. Las rutas públicas (login, register) no requieren autenticación, mientras que las rutas protegidas (onboarding, dashboard) están envueltas en el componente RequireAuth, que verifica si el usuario está autenticado y tiene perfil configurado antes de permitir el acceso.
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import RequireAuth from '../shared/guards/RequireAuth';



const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/onboarding" element={
        <RequireAuth>
          <OnboardingPage />
        </RequireAuth>
      } />

      <Route path="/dashboard/*" element={
        <RequireAuth>
          <DashboardPage />
        </RequireAuth>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;
