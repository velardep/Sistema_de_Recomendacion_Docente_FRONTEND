
import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { IconChat, IconSparkles, IconGrid, IconUser } from '../shared/components/Icons';
import ChatGeneralSection from './dashboard/ChatGeneralSection';
import RecomendacionesSection from './dashboard/RecomendacionesSection';
import EspaciosSection from './dashboard/EspaciosSection';
import PerfilSection from './dashboard/PerfilSection';
import { useAuthStore } from '../store/authStore';

const DashboardPage: React.FC = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-accent tracking-tighter">NEXUS AI</h2>
          <p className="text-xs text-textSecondary mt-1">v2.4 Core Edition</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 py-4">
          <NavItem to="/dashboard/chat" icon={<IconChat className="w-5 h-5"/>} label="Chat General" />
          <NavItem to="/dashboard/recomendaciones" icon={<IconSparkles className="w-5 h-5"/>} label="Sugerencias" />
          <NavItem to="/dashboard/espacios" icon={<IconGrid className="w-5 h-5"/>} label="Espacios" />
          <NavItem to="/dashboard/perfil" icon={<IconUser className="w-5 h-5"/>} label="Perfil" />
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-accent/20 rounded-full border border-accent/40 flex items-center justify-center font-bold">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-textSecondary truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Routes>
          <Route path="chat" element={<ChatGeneralSection />} />
          <Route path="recomendaciones" element={<RecomendacionesSection />} />
          <Route path="espacios" element={<EspaciosSection />} />
          <Route path="perfil" element={<PerfilSection />} />
          <Route path="/" element={<ChatGeneralSection />} />
        </Routes>
      </main>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
      ${isActive ? 'bg-accent/10 text-accent font-semibold border border-accent/20' : 'text-textSecondary hover:bg-white/5 hover:text-textPrimary'}
    `}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default DashboardPage;
