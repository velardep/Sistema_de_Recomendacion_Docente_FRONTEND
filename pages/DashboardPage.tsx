import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  IconChat,
  IconSparkles,
  IconGrid,
  IconUser
} from '../shared/components/Icons';
import ChatGeneralSection from './dashboard/ChatGeneralSection';
import RecomendacionesSection from './dashboard/RecomendacionesSection';
import EspaciosSection from './dashboard/EspaciosSection';
import PerfilSection from './dashboard/PerfilSection';
import WelcomeSection from './dashboard/WelcomeSection';
import { useAuthStore } from '../store/authStore';
import PdcSection from './dashboard/PdcSection';

const DashboardPage: React.FC = () => {
  const { logout, user, perfil } = useAuthStore();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Overlay móvil */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar móvil */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-card flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent
          user={user}
          perfil={perfil}
          onLogout={handleLogout}
          onNavigate={closeMobileMenu}
          collapsed={false}
          onToggleCollapse={undefined}
          mobile
        />
      </aside>

      {/* Sidebar desktop */}
      <aside
        className={`
          hidden lg:flex border-r border-border bg-card flex-col transition-all duration-300
          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        <SidebarContent
          user={user}
          perfil={perfil}
          onLogout={handleLogout}
          onNavigate={() => {}}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar móvil */}
        <div className="lg:hidden border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-textPrimary hover:bg-white/10 transition-colors"
            >
              <span className="text-lg leading-none">☰</span>
            </button>

            <div className="text-right">
              <h2 className="text-base font-bold text-accent tracking-tight">SIPRE AI</h2>
              <p className="text-[11px] text-textSecondary">Panel docente</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <Routes>
            <Route path="welcome" element={<WelcomeSection />} />
            <Route path="chat" element={<ChatGeneralSection />} />
            <Route path="espacios" element={<EspaciosSection />} />
            <Route path="pdc" element={<PdcSection />} />
            <Route path="recomendaciones" element={<RecomendacionesSection />} />
            <Route path="perfil" element={<PerfilSection />} />
            <Route path="/" element={<WelcomeSection />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

interface SidebarContentProps {
  user: any;
  perfil: any;
  onLogout: () => void;
  onNavigate: () => void;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  user,
  perfil,
  onLogout,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobile = false,
}) => {
  return (
    <>
      <div className={`${collapsed ? 'p-4' : 'p-6'} border-b border-border`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className={`font-bold text-accent tracking-tighter ${collapsed ? 'text-lg text-center' : 'text-2xl'}`}>
              {collapsed ? 'SA' : 'SIPRE AI'}
            </h2>

            {!collapsed && (
              <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                Sistema Inteligente de Planificación y Recursos Educativos
              </p>
            )}
          </div>

          {!mobile && onToggleCollapse && (
            <button
              type="button"
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
              onClick={onToggleCollapse}
              className="shrink-0 rounded-lg border border-border bg-white/5 px-2 py-1 text-sm text-textSecondary hover:bg-white/10 hover:text-textPrimary transition-colors"
            >
              {collapsed ? '→' : '←'}
            </button>
          )}

          {mobile && (
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={onNavigate}
              className="shrink-0 rounded-lg border border-border bg-white/5 px-2 py-1 text-sm text-textSecondary hover:bg-white/10 hover:text-textPrimary transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        <NavItem
          to="/dashboard/welcome"
          icon={<IconGrid className="w-5 h-5" />}
          label="Inicio"
          collapsed={collapsed}
          onClick={onNavigate}
        />
        <NavItem
          to="/dashboard/chat"
          icon={<IconChat className="w-5 h-5" />}
          label="Chat General"
          collapsed={collapsed}
          onClick={onNavigate}
        />
        <NavItem
          to="/dashboard/espacios"
          icon={<IconGrid className="w-5 h-5" />}
          label="Espacios de Trabajo"
          collapsed={collapsed}
          onClick={onNavigate}
        />
        <NavItem
          to="/dashboard/pdc"
          icon={<IconSparkles className="w-5 h-5" />}
          label="Generacion de PDC"
          collapsed={collapsed}
          onClick={onNavigate}
        />
        <NavItem
          to="/dashboard/recomendaciones"
          icon={<IconSparkles className="w-5 h-5" />}
          label="Sugerencias"
          collapsed={collapsed}
          onClick={onNavigate}
        />
        <NavItem
          to="/dashboard/perfil"
          icon={<IconUser className="w-5 h-5" />}
          label="Perfil"
          collapsed={collapsed}
          onClick={onNavigate}
        />
      </nav>

      <div className="p-4 border-t border-border">
        <div className={`flex items-center gap-3 mb-4 ${collapsed ? 'justify-center' : 'px-2'}`}>
          <div className="w-10 h-10 shrink-0 bg-accent/20 rounded-full border border-accent/40 flex items-center justify-center font-bold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>

          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-medium truncate">
                {perfil?.nombres} {perfil?.apellidos}
              </p>
              <p className="text-xs text-textSecondary truncate">{user?.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className={`
            text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors
            ${collapsed ? 'w-10 h-10 mx-auto flex items-center justify-center' : 'w-full text-left px-4 py-2'}
          `}
          title="Cerrar sesión"
        >
          {collapsed ? '⎋' : 'Cerrar Sesión'}
        </button>

        {!collapsed && (
          <p className="text-xs text-textSecondary mt-2">v1.0 Demo Edition</p>
        )}
      </div>
    </>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon,
  label,
  collapsed = false,
  onClick,
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={({ isActive }) => `
      flex items-center rounded-xl transition-all
      ${collapsed ? 'justify-center px-3 py-3' : 'gap-3 px-4 py-3'}
      ${isActive
        ? 'bg-accent/10 text-accent font-semibold border border-accent/20'
        : 'text-textSecondary hover:bg-white/5 hover:text-textPrimary'
      }
    `}
  >
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

export default DashboardPage;