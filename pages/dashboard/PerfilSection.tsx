import React, { useEffect, useState } from 'react';
import { meService } from '../../services/meService';
import { useAuthStore } from '../../store/authStore';
import { Profile } from '../../types';

const PerfilSection: React.FC = () => {
  const { user, perfil, setMe } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await meService.getMe();
        setMe({ perfil: res.perfil });
      } catch (e) {
        console.error('Error cargando perfil:', e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [setMe]);

  if (loading) {
    return (
      <div className="p-10 animate-pulse text-textSecondary text-sm">
        Cargando perfil...
      </div>
    );
  }

  const profile: Profile | null = perfil;

  const nombreCompleto =
    profile?.nombres && profile?.apellidos
      ? `${profile.nombres} ${profile.apellidos}`
      : user?.email;

  return (
    <div className="px-8 py-12 max-w-6xl mx-auto w-full space-y-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-8">
        <div className="relative">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center text-4xl font-bold border border-accent/30 shadow-xl backdrop-blur-md">
            {profile?.nombres
              ? profile.nombres.charAt(0).toUpperCase()
              : user?.email?.charAt(0).toUpperCase()}
          </div>

          <div className="absolute -bottom-2 -right-2 bg-green-500 w-5 h-5 rounded-full border-4 border-background" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            {nombreCompleto}
          </h1>
          <p className="text-textSecondary text-sm">{user?.email}</p>
          <p className="text-xs text-accent font-medium tracking-wide uppercase">
            Docente • Asistente Pedagógico Nexus
          </p>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {profile ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* INFORMACIÓN GENERAL */}
          <div className="xl:col-span-2 bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-10 shadow-2xl transition-all hover:shadow-accent/10">
            <SectionTitle title="Información Profesional" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mt-8">
              <InfoBlock label="Unidad Educativa" value={profile.unidad_educativa} />
              <InfoBlock label="Nivel" value={profile.nivel} />
              <InfoBlock label="Grado" value={profile.grado} />
              <InfoBlock label="Ciudad" value={profile.ciudad} />
              <InfoBlock label="Departamento" value={profile.departamento} />
            </div>
          </div>

          {/* PANEL LATERAL */}
          <div className="space-y-8">
            {/* Preferencias */}
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
              <SectionTitle title="Preferencias del Asistente" />

              {profile.preferencias ? (
                <div className="space-y-5 mt-6">
                  <PreferenceItem label="Tono" value={profile.preferencias.tono} />
                  <PreferenceItem label="Detalle" value={profile.preferencias.detalle} />
                </div>
              ) : (
                <p className="text-textSecondary text-sm mt-6">
                  No hay preferencias configuradas.
                </p>
              )}
            </div>

            {/* Cuenta */}
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
              <SectionTitle title="Cuenta" />

              <div className="mt-6 space-y-4">
                <AccountRow label="Estado" value="Activa" />
                <AccountRow label="Tipo de Cuenta" value="Docente" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-12 text-center shadow-2xl">
          <h3 className="text-2xl font-semibold mb-3">
            Perfil incompleto
          </h3>
          <p className="text-textSecondary text-sm mb-8">
            Aún no has configurado tu información docente.
          </p>
          <button className="bg-accent hover:bg-accent/90 transition-all text-white px-8 py-3 rounded-xl text-sm font-semibold shadow-lg">
            Completar perfil
          </button>
        </div>
      )}
    </div>
  );
};

/* COMPONENTES AUXILIARES */

const SectionTitle = ({ title }: { title: string }) => (
  <h2 className="text-xs font-bold text-accent uppercase tracking-[0.2em]">
    {title}
  </h2>
);

const InfoBlock = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="space-y-1">
    <p className="text-xs text-textSecondary uppercase tracking-widest">
      {label}
    </p>
    <p className="text-lg font-semibold">
      {value || 'No definido'}
    </p>
  </div>
);

const PreferenceItem = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="flex justify-between items-center border-b border-white/5 pb-3">
    <span className="text-sm text-textSecondary">{label}</span>
    <span className="text-sm font-semibold">
      {value || 'No definido'}
    </span>
  </div>
);

const AccountRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex justify-between text-sm">
    <span className="text-textSecondary">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

export default PerfilSection;