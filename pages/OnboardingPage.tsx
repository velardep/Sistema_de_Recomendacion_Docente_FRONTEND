// pages/OnboardingPage.tsx
import React, { useMemo, useState } from 'react';
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

  const canSubmit = useMemo(() => {
    // mínimos para evitar perfiles vacíos
    return (
      !loading &&
      form.nombres.trim().length >= 2 &&
      form.apellidos.trim().length >= 2 &&
      form.unidad_educativa.trim().length >= 2 &&
      form.nivel.trim().length >= 2 &&
      form.grado.trim().length >= 1 &&
      form.ciudad.trim().length >= 2 &&
      form.departamento.trim().length >= 2
    );
  }, [form, loading]);

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

      setMe({ perfil: perfilGuardado });
      nav('/dashboard', { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? 'Error guardando perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Header / Brand */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-accent font-black">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Completa tu perfil</h1>
              <p className="text-sm text-textSecondary">
                Esto se guarda en tu backend (POST <span className="text-white/80">/me</span>)
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* Top line */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Datos del docente</h2>
              <p className="text-sm text-textSecondary mt-1">
                Nos ayuda a personalizar tono, detalle y recomendaciones.
              </p>
            </div>

            <div className="text-xs uppercase tracking-widest text-accent font-bold">
              Onboarding
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}

          <form className="mt-6 space-y-6" onSubmit={onSubmit}>
            {/* Section: Identidad */}
            <section>
              <div className="text-xs uppercase tracking-widest text-accent font-bold mb-3">
                Información básica
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Nombres
                  </label>
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    placeholder="Ej: Juan Carlos"
                    value={form.nombres}
                    onChange={(e) => onChange('nombres', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Apellidos
                  </label>
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    placeholder="Ej: Pérez López"
                    value={form.apellidos}
                    onChange={(e) => onChange('apellidos', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Unidad educativa
                  </label>
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    placeholder="Ej: U.E. 15 de Abril"
                    value={form.unidad_educativa}
                    onChange={(e) => onChange('unidad_educativa', e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Section: Contexto */}
            <section>
              <div className="text-xs uppercase tracking-widest text-accent font-bold mb-3">
                Contexto educativo
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Nivel
                  </label>
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    placeholder="Primaria / Secundaria"
                    value={form.nivel}
                    onChange={(e) => onChange('nivel', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Grado
                  </label>
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    placeholder="3ro, 6to, etc."
                    value={form.grado}
                    onChange={(e) => onChange('grado', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Ciudad
                  </label>
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    placeholder="Ej: Tarija"
                    value={form.ciudad}
                    onChange={(e) => onChange('ciudad', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Departamento
                  </label>
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    placeholder="Ej: Tarija"
                    value={form.departamento}
                    onChange={(e) => onChange('departamento', e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Section: Preferencias */}
            <section>
              <div className="text-xs uppercase tracking-widest text-accent font-bold mb-3">
                Preferencias del asistente
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Tono
                  </label>
                  <select
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    value={form.tono}
                    onChange={(e) => onChange('tono', e.target.value)}
                  >
                    <option value="formal">Tono formal</option>
                    <option value="amigable">Tono amigable</option>
                  </select>
                  <p className="text-xs text-textSecondary">
                    Define cómo te responde SIPRE (estilo de redacción).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                    Nivel de detalle
                  </label>
                  <select
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                    value={form.detalle}
                    onChange={(e) => onChange('detalle', e.target.value)}
                  >
                    <option value="alto">Detalle alto</option>
                    <option value="medio">Detalle medio</option>
                    <option value="bajo">Detalle bajo</option>
                  </select>
                  <p className="text-xs text-textSecondary">
                    Ajusta qué tan extensas serán las explicaciones.
                  </p>
                </div>
              </div>

              {/* Preview mini */}
              <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-xs uppercase tracking-widest text-accent font-bold mb-2">
                  Vista previa
                </div>
                <p className="text-sm text-textSecondary">
                  Responderé con tono <span className="text-white/80 font-semibold">{form.tono}</span> y un
                  nivel de detalle <span className="text-white/80 font-semibold">{form.detalle}</span>.
                </p>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-2">
              <button
                disabled={!canSubmit}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 text-sm font-semibold transition-all disabled:opacity-50 disabled:hover:bg-white/5"
              >
                {loading ? 'Guardando…' : 'Guardar y continuar'}
              </button>

              {!canSubmit && (
                <div className="mt-2 text-xs text-textSecondary">
                  Completa los campos obligatorios para continuar.
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-textSecondary">
          Disfruta la esta primera version.
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;