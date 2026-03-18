// pages/RegisterPage.tsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { meService } from '../services/meService';
import { useAuthStore } from '../store/authStore';

const RegisterPage: React.FC = () => {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setMe = useAuthStore((s) => s.setMe);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const e = email.trim();
    return e.length > 3 && password.length >= 6 && !loading;
  }, [email, password, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await authService.register(email.trim(), password);
      setSession(res.access_token, res.user);

      const me = await meService.getMe();
      setMe({ perfil: me.perfil });

      if (me.perfil == null) nav('/onboarding', { replace: true });
      else nav('/dashboard', { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? 'Registro falló');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-accent font-black">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">SIPRE</h1>
              <p className="text-sm text-textSecondary">
                Crea tu cuenta y configura tu perfil
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-7 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Crear cuenta</h2>
              
            </div>

            <div className="text-xs uppercase tracking-widest text-accent font-bold">
              Nuevo
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                Correo
              </label>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-accent/50 transition-all"
                placeholder="nombre@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-textSecondary uppercase ml-1">
                Contraseña
              </label>

              <div className="relative">
                <input
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12 outline-none focus:border-accent/50 transition-all"
                  placeholder="Mínimo 6 caracteres"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-all"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>

              <div className="text-xs text-textSecondary">
                Recomendación: usa una contraseña segura (mín. 6 caracteres).
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              disabled={!canSubmit}
              className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 text-sm font-semibold transition-all disabled:opacity-50 disabled:hover:bg-white/5"
            >
              {loading ? 'Creando…' : 'Crear cuenta'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-textSecondary">ya tengo cuenta</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Go to login */}
            <Link
              to="/login"
              className="block w-full text-center bg-transparent hover:bg-white/5 text-white py-3 rounded-xl border border-white/10 text-sm font-medium transition-all"
            >
              Iniciar sesión
            </Link>
          </form>

          <div className="mt-6 text-xs text-textSecondary">
            Al crear tu cuenta podrás completar onboarding y recibir recomendaciones personalizadas.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;