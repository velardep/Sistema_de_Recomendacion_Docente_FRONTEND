
import React, { useEffect, useState } from 'react';
import { meService } from '../../services/meService';
import { Profile, User } from '../../types';

const PerfilSection: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meService.getMe().then(res => {
      setUser(res.user);
      setProfile(res.perfil);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 animate-pulse text-textSecondary">Cargando perfil...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
      </header>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="h-32 bg-gradient-to-r from-accent to-blue-900" />
        <div className="px-8 pb-8 -mt-12">
          <div className="flex items-end justify-between mb-8">
            <div className="flex items-end gap-6">
              {/* Fix: use avatar_url now defined in Profile interface */}
              <img 
                src={profile?.avatar_url || "https://picsum.photos/150"} 
                className="w-24 h-24 rounded-2xl border-4 border-card bg-card"
                alt="Avatar"
              />
              <div className="pb-1">
                {/* Fix: use name now defined in User interface */}
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-textSecondary text-sm">{user?.email}</p>
              </div>
            </div>
            <button className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-border text-sm transition-all">Editar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Biografía</h4>
                {/* Fix: use bio now defined in Profile interface */}
                <p className="text-textSecondary leading-relaxed italic">
                  "{profile?.bio || 'Sin biografía definida'}"
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Preferencias</h4>
                <div className="flex flex-wrap gap-2">
                  {/* Fix: map over Object.values(preferencias) as it's an object, and used 'preferencias' property name */}
                  {profile?.preferencias && Object.values(profile.preferencias).map((p, i) => (
                    <span key={i} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-semibold border border-accent/20">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-background/50 rounded-xl p-6 border border-border">
              <h4 className="text-sm font-bold mb-4">Estadísticas Nexus</h4>
              <div className="space-y-4">
                <StatRow label="Mensajes enviados" value="124" />
                <StatRow label="Espacios activos" value="4" />
                <StatRow label="Nivel de cuenta" value="Premium AI" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5">
    <span className="text-sm text-textSecondary">{label}</span>
    <span className="text-sm font-bold text-textPrimary">{value}</span>
  </div>
);

export default PerfilSection;
