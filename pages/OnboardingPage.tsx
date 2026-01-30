/*import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meService } from '../services/meService';
import { useAuthStore } from '../store/authStore';
import { Profile } from '../types';

const OnboardingPage: React.FC = () => {
  const { setPerfil } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Profile>({
    nombres: '',
    apellidos: '',
    unidad_educativa: '',
    nivel: '',
    grado: '',
    ciudad: '',
    departamento: '',
    preferencias: { tono: 'Informativo', detalle: 'Medio' }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await meService.upsertPerfil(form);
      setPerfil(res);
      navigate('/dashboard');
    } catch (err) {
      alert("Error al guardar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border w-full max-w-4xl p-10 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <h1 className="text-3xl font-bold mb-2">Bienvenido a Nexus</h1>
        <p className="text-textSecondary mb-8 text-lg">Completa tu perfil docente para una experiencia personalizada.</p>
        
        <form onSubmit={handleFinish} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} required />
          <Input label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} required />
          <Input label="Unidad Educativa" name="unidad_educativa" value={form.unidad_educativa} onChange={handleChange} required />
          <Input label="Nivel" name="nivel" value={form.nivel} onChange={handleChange} required />
          <Input label="Grado" name="grado" value={form.grado} onChange={handleChange} required />
          <Input label="Ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} required />
          <Input label="Departamento" name="departamento" value={form.departamento} onChange={handleChange} required />
          
          <div className="md:col-span-2 flex justify-end mt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-accent hover:bg-blue-600 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-accent/20"
            >
              {loading ? 'Guardando...' : 'Finalizar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-textSecondary">{label}</label>
    <input 
      className="bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors"
      {...props}
    />
  </div>
);

export default OnboardingPage;*/

// pages/OnboardingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meService } from '../services/meService';
import { useAuthStore } from '../store/authStore';

const OnboardingPage: React.FC = () => {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setMe = useAuthStore((s) => s.setMe);

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    unidad_educativa: '',
    nivel: '',
    grado: '',
    ciudad: '',
    departamento: '',
    tono: 'formal',
    detalle: 'alto',
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (!user?.email) throw new Error('Sesión inválida: falta email');

      const perfilGuardado = await meService.upsertMe({
        nombres: form.nombres,
        apellidos: form.apellidos,
        unidad_educativa: form.unidad_educativa,
        nivel: form.nivel,
        grado: form.grado,
        ciudad: form.ciudad,
        departamento: form.departamento,
        preferencias: { tono: form.tono, detalle: form.detalle },
      });

      // Ya tienes perfil => store + dashboard
      setMe({ perfil: perfilGuardado });
      nav('/dashboard', { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? 'Error guardando perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Completa tu perfil</h1>
        <p className="text-sm text-white/60 mt-1">
          Esto se guarda con <span className="text-white/80">POST /me</span>.
        </p>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <input className="rounded-xl bg-black/40 border border-white/10 px-4 py-3"
            placeholder="Nombres" value={form.nombres} onChange={(e) => onChange('nombres', e.target.value)} />
          <input className="rounded-xl bg-black/40 border border-white/10 px-4 py-3"
            placeholder="Apellidos" value={form.apellidos} onChange={(e) => onChange('apellidos', e.target.value)} />

          <input className="rounded-xl bg-black/40 border border-white/10 px-4 py-3 md:col-span-2"
            placeholder="Unidad educativa" value={form.unidad_educativa} onChange={(e) => onChange('unidad_educativa', e.target.value)} />

          <input className="rounded-xl bg-black/40 border border-white/10 px-4 py-3"
            placeholder="Nivel (Primaria/Secundaria)" value={form.nivel} onChange={(e) => onChange('nivel', e.target.value)} />
          <input className="rounded-xl bg-black/40 border border-white/10 px-4 py-3"
            placeholder="Grado (3ro, 6to...)" value={form.grado} onChange={(e) => onChange('grado', e.target.value)} />

          <input className="rounded-xl bg-black/40 border border-white/10 px-4 py-3"
            placeholder="Ciudad" value={form.ciudad} onChange={(e) => onChange('ciudad', e.target.value)} />
          <input className="rounded-xl bg-black/40 border border-white/10 px-4 py-3"
            placeholder="Departamento" value={form.departamento} onChange={(e) => onChange('departamento', e.target.value)} />

          <select className="rounded-xl bg-black/40 border border-white/10 px-4 py-3"
            value={form.tono} onChange={(e) => onChange('tono', e.target.value)}>
            <option value="formal">Tono formal</option>
            <option value="amigable">Tono amigable</option>
          </select>

          <select className="rounded-xl bg-black/40 border border-white/10 px-4 py-3"
            value={form.detalle} onChange={(e) => onChange('detalle', e.target.value)}>
            <option value="alto">Detalle alto</option>
            <option value="medio">Detalle medio</option>
            <option value="bajo">Detalle bajo</option>
          </select>

          <div className="md:col-span-2 mt-2">
            <button
              disabled={loading}
              className="w-full rounded-xl bg-white text-black font-medium py-3 disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;

